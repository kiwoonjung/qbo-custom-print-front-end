import { useState, useEffect } from "react";

const Dashboard = ({ handleLogout }) => {
  const [showGetDataButton, setShowGetDataButton] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);

  const handleGetData = async () => {
    try {
      const { accessToken, realmId } = await new Promise((resolve) => {
        chrome.storage.local.get(["accessToken", "realmId"], (data) =>
          resolve(data)
        );
      });

      if (!accessToken) {
        console.error("Access token is missing.");
        return;
      }

      if (!invoiceId) {
        console.error("Invoice ID is missing.");
        return;
      }

      console.log("Fetching invoice with ID:", invoiceId);

      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getInvoice", accessToken, realmId, invoiceId },
          resolve
        );
      });

      if (response.success) {
        // Store invoice data in local storage
        chrome.storage.local.set({ invoiceData: response.data }, () => {
          console.log("Stored invoice data:", response.data);
          printInvoice();
        });
      } else {
        console.error("Failed to fetch invoice data.");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getCurrentTabURL" }, (response) => {
      if (response && response.url) {
        console.log("Current URL:", response.url);

        // Extract invoiceId using URL parameters
        const match = response.url.match(/[?&]txnId=(\d+)/);
        if (match) {
          setInvoiceId(match[1]); // Set invoiceId
          setShowGetDataButton(true);
        } else {
          setShowGetDataButton(false);
        }
      } else {
        console.error("Failed to get current URL");
      }
    });
  }, []);

  const printInvoice = async () => {
    try {
      // Get stored invoice data
      const { invoiceData } = await new Promise((resolve) =>
        chrome.storage.local.get("invoiceData", resolve)
      );

      if (!invoiceData) {
        console.error("No invoice data available");
        return;
      }

      // Fetch the external HTML template
      const response = await fetch(
        chrome.runtime.getURL("templates/template.html")
      );
      if (!response.ok)
        throw new Error(`Failed to load template: ${response.status}`);

      let templateHtml = await response.text();

      // Replace placeholders with actual invoice data
      templateHtml = templateHtml
        .replace("{{date}}", invoiceData.date)
        .replace("{{invoiceId}}", invoiceData.id)
        .replace(
          "{{items}}",
          invoiceData.items
            .map(
              (item) =>
                `<tr><td>${item.name}</td><td>${item.quantity}</td><td>${item.price}</td></tr>`
            )
            .join("")
        );

      // Open a new print window and insert the processed template
      const printWindow = window.open("", "_blank");
      printWindow.document.open();
      printWindow.document.write(templateHtml);
      printWindow.document.close();

      // Automatically print and close the window
      printWindow.onload = () => {
        printWindow.print();
        setTimeout(() => printWindow.close(), 500);
      };
    } catch (error) {
      console.error("Error printing invoice:", error);
    }
  };

  return (
    <>
      <p className="text-2xl pb-4">Welcome to QBO Custom Print</p>
      <p className="pb-4">You are logged in!</p>
      <div className="flex justify-center gap-2">
        {showGetDataButton && (
          <button
            onClick={handleGetData}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Get Data
          </button>
        )}
        <button
          onClick={handleLogout}
          className="border border-red-500 text-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </>
  );
};

export default Dashboard;
