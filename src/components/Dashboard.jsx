import { useState, useEffect } from "react";
import Modal from "./Modal"; // Import the modal component

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
          loadTemplate(); // Load the template when invoice data is ready
        });
      } else {
        console.error("Failed to fetch invoice data.");
      }
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
      setTemplateHtml(htmlContent);
      setShowModal(true); // Open modal after loading template
    } catch (error) {
      console.error("Error loading template:", error);
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

  return (
    <>
      <p className="text-2xl pb-4">Welcome to QBO Custom Print</p>
      <p className="pb-4">You are logged in!</p>
      <div className="flex justify-center gap-2">
        {showGetDataButton && (
          <button onClick={handleGetData}>Create Custom Invoice</button>
        )}
      </div>

      {/* Modal Component */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <div dangerouslySetInnerHTML={{ __html: templateHtml }} />
      </Modal>
    </>
  );
};

export default Dashboard;
