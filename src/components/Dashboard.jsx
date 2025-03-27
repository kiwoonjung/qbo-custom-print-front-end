import { useState, useEffect } from "react";

const Dashboard = ({ handleLogout }) => {
  const [showGetDataButton, setShowGetDataButton] = useState(false);
  const [invoiceId, setInvoiceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [templateHtml, setTemplateHtml] = useState("");

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

      // Call the QuickBooks API to get invoice data
      const response = await fetch(
        `https://quickbooks.api.intuit.com/v3/company/${realmId}/invoice/${invoiceId}/?minorversion=75`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to fetch invoice data:", response.statusText);
        return;
      }

      const invoiceData = await response.json();
      console.log("Fetched Invoice Data:", invoiceData);

      // Store invoice data in Chrome local storage
      chrome.storage.local.set({ invoiceData }, async () => {
        console.log("Stored invoice data:", invoiceData);

        // Wait for the template to load
        const loadedTemplate = await loadTemplate();

        // Ensure the template is actually loaded before printing
        if (loadedTemplate) {
          console.log("Template successfully loaded, printing...");
          handlePrint();
        } else {
          console.error("Template HTML is still empty after loading.");
        }
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  const loadTemplate = async () => {
    try {
      const response = await fetch(
        chrome.runtime.getURL("templates/template.html")
      );
      const htmlContent = await response.text();

      if (!htmlContent) {
        console.error("Fetched template HTML is empty.");
        return null;
      }

      setTemplateHtml(htmlContent);
      setShowModal(true); // Open modal after loading template

      return htmlContent; // Return the loaded template
    } catch (error) {
      console.error("Error loading template:", error);
      return null;
    }
  };

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "getCurrentTabURL" }, (response) => {
      if (response && response.url) {
        // console.log("Current URL:", response.url);

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

  useEffect(() => {
    if (templateHtml) {
      // console.log("Template updated, now printing...");
      handlePrint();
    }
  }, [templateHtml]);

  const handlePrint = () => {
    if (!templateHtml) {
      console.error("Template HTML is empty, delaying print...");
      return;
    }

    // console.log("Opening print preview with template:", templateHtml);
    window.open("/templates/template.html", "_blank");
  };

  return (
    <>
      {!showModal && (
        <div className="text-center">
          <p className="text-2xl pb-4">Welcome to QBO Custom Print!</p>
          <p className="pb-4">You are logged in!</p>
        </div>
      )}
      <div className="flex justify-center gap-2">
        {showGetDataButton && !showModal && (
          <button onClick={handleGetData}>Create Bill of Lading</button>
        )}
      </div>
    </>
  );
};

export default Dashboard;
