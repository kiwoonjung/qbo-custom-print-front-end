import { useState, useRef } from "react";
import { Button } from "@mui/material";
import { jsPDF } from "jspdf";

const Dashboard = ({ handleLogout }) => {
  const [invoice, setInvoice] = useState([]);

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
          { action: "getInvoice", accessToken },
          resolve
        );
      });

      // console.log("Response from background script:", response);

      // if (response && response.success) {
      //   console.log("Invoice:", response.data.QueryResponse.Invoice);
      //   setInvoice(response.data.QueryResponse.Invoice || []);
      // } else {
      //   console.error(
      //     "Error fetching invoice:",
      //     response?.error || "Unknown error"
      //   );
      // }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    }
  };

  const handlePrintBOL = async () => {};
  return (
    <>
      <p class="text-2xl pb-4">Welcome to QBO Custom Print</p>
      <p class="pb-4">You are logged in!</p>
      <div class="flex justify-center gap-2">
        {/* <Button variant="contained" color="success" onClick={handleGetData}>
          Get Data
        </Button> */}
        <Button variant="contained" color="success" onClick={handleGetData}>
          Get Data
        </Button>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </>
  );
};

export default Dashboard;
