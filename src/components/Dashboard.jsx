import { useState } from "react";

const Dashboard = ({ handleLogout }) => {
  const [invoices, setInvoices] = useState([]);

  const handleGetData = async () => {
    try {
      const { accessToken } = await new Promise((resolve) => {
        chrome.storage.local.get(["accessToken"], resolve);
      });

      if (!accessToken) {
        console.error("Access token is missing.");
        return;
      }

      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "getInvoices", accessToken },
          resolve
        );
      });

      console.log("Response from background script:", response);

      if (response && response.success) {
        console.log("Invoices:", response.data.QueryResponse.Invoice);
        setInvoices(response.data.QueryResponse.Invoice || []);
      } else {
        console.error(
          "Error fetching invoices:",
          response?.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };
  return (
    <>
      <h1>Welcome to QBO Custom Print</h1>
      <p>You are logged in!</p>
      <button onClick={handleLogout}>Logout</button>
      <button onClick={handleGetData}>Get Data</button>
    </>
  );
};

export default Dashboard;
