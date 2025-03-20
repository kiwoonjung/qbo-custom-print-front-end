// Dealing with Textarea Height

document.addEventListener("DOMContentLoaded", function () {
  // Simulated backend response
  const textValue = `a. No carrier is liable for loss, damage, or delay to any goods under the Bill of Lading unless notice thereof, setting out particulars of the origin, \n\ndestination, and date of shipment of the goods, and the estimated amount claimed in respect of.`;

  // Replace \n with <br> and insert it into the <p> tag
  document.getElementById("itemText").innerHTML = textValue.replace(
    /\n/g,
    "<br>"
  );

  async function getStoredData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], function (result) {
        resolve(result[key]);
      });
    });
  }

  getStoredData("invoiceData").then((value) => {
    console.log("Stored Value:", value);
  });
});

console.log("hello");
