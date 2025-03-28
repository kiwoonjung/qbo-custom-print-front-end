document.addEventListener("DOMContentLoaded", async function () {
  // Function to retrieve stored invoice data from Chrome Storage
  async function getStoredData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], function (result) {
        resolve(result[key] || null);
      });
    });
  }

  // Populate HTML with invoice data
  getStoredData("invoiceData").then((invoiceData) => {
    if (!invoiceData) {
      console.error("No invoice data found.");
      return;
    }

    // console.log("Loaded Invoice Data:", invoiceData);

    const slipNumElement = document.querySelector(".slip-no");
    slipNumElement.innerHTML = invoiceData.Invoice.DocNumber;

    const shipDateElement = document.querySelector(".ship-date");
    shipDateElement.innerHTML = invoiceData.Invoice.ShipDate
      ? invoiceData.Invoice.ShipDate
      : "";

    const poNumElement = document.querySelector(".po-number");

    const poNumberField = invoiceData.Invoice.CustomField.find(
      (field) => field.Name === "P.O. Number"
    );

    // Accessing the StringValue correctly
    poNumElement.innerHTML =
      poNumberField && poNumberField.StringValue
        ? poNumberField.StringValue
        : "";

    chrome.storage.local.get("shippingAddress", function (data) {
      const shipToNameElement = document.querySelector(".ship-to-address");
      // Replace newline characters with <br> tags
      const formattedAddress = data.shippingAddress.replace(/\n/g, "<br>");
      shipToNameElement.innerHTML = formattedAddress;
    });

    const carrierNameElement = document.querySelector(".carrier-to-content");
    carrierNameElement.innerHTML = invoiceData.Invoice.ShipMethodRef
      ? invoiceData.Invoice.ShipMethodRef.name
      : "";

    const carrierBottomNameElement = document.querySelector(".carrier-name");
    carrierBottomNameElement.innerHTML = invoiceData.Invoice.ShipMethodRef
      ? invoiceData.Invoice.ShipMethodRef.name
      : "";

    const shippingTrackNumber = document.querySelector(
      ".carrier-to-track-number"
    );
    shippingTrackNumber.innerHTML = invoiceData.Invoice.TrackingNum
      ? invoiceData.Invoice.TrackingNum
      : "";

    chrome.storage.local.get("shippingAddress", function (data) {
      const consigneeNameElement = document.querySelector(".consignee-name");
      // Split the address by newline and take the first line
      const firstLine = data.shippingAddress.split("\n")[0];
      consigneeNameElement.innerHTML = firstLine;
    });

    // Ensure the item-table-container exists
    const itemTableContainer = document.querySelector(".item-table-container");

    if (!itemTableContainer) {
      console.error("Error: .item-table-container not found in the DOM.");
      return;
    }

    // Get table body element
    const tableBody = itemTableContainer.querySelector("tbody");

    if (!tableBody) {
      console.error("Error: <tbody> not found inside .item-table-container.");
      return;
    }

    // Find all SalesItemLineDetail items
    const lineItems = invoiceData.Invoice.Line.filter(
      (lineItem) => lineItem.DetailType === "SalesItemLineDetail"
    );

    if (lineItems.length === 0) {
      console.warn("No valid SalesItemLineDetail found in invoice data.");
      return;
    }

    // // Clear existing table rows before adding new items
    // tableBody.innerHTML = "";

    // Loop through each line item and append data to table
    lineItems.forEach((lineItem) => {
      const row = document.createElement("tr");
      row.classList.add("item-row-container");

      row.innerHTML = `
        <td class="item-text text-left">${
          lineItem.SalesItemLineDetail.ItemRef.name
        }</td>
        <td class="item-text text-left">${lineItem.Description || "N/A"}</td>
        <td class="item-text text-right">${
          lineItem.SalesItemLineDetail.Qty
        }</td>
        <td class="item-text" style="padding-right: 0">
          <input type="text" class="item-weight text-right" />
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Function to add an empty row if needed
    function addEmptyRowIfNeeded() {
      const itemRows = document.querySelectorAll(".item-row-container");
      let totalHeight = 0;

      itemRows.forEach((row) => {
        totalHeight += row.offsetHeight;
      });

      const remainingHeight = 299 - totalHeight;

      if (remainingHeight > 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.classList.add("item-row-container");
        emptyRow.style.height = `${remainingHeight}px`;

        emptyRow.innerHTML = `
          <th class="item-table-header code" style="border-right: 1px solid black;"></th>
          <th class="item-table-header desc" style="border-right: 1px solid black;"></th>
          <th class="item-table-header qty" style="border-right: 1px solid black;"></th>
          <th class="item-table-header weight"></th>
        `;

        tableBody.appendChild(emptyRow);
      }
    }

    addEmptyRowIfNeeded();
    // Give some time for DOM to render then calculate heights
    // setTimeout(() => {}, 100);
  });
});
