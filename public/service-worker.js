// ✅ Check if the user is already authenticated before starting OAuth
chrome.storage.local.get(["accessToken", "refreshToken", "realmId"], (data) => {
  if (data.accessToken && data.realmId) {
    console.log("✅ User is already authenticated with QuickBooks.");
    return; // Stop OAuth process if user is already logged in
  }
  startOAuthFlow();
});

async function startOAuthFlow() {
  try {
    const response = await fetch(
      "https://qbo-custom-print-back-end.vercel.app/auth/get-client-id"
    );
    if (!response.ok)
      throw new Error(`Failed to fetch clientId: ${response.statusText}`);

    const { clientId } = await response.json();
    const redirectUri = chrome.identity.getRedirectURL();
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&state=chrome_extension`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          console.error("OAuth failed:", chrome.runtime.lastError);
          return;
        }

        const urlParams = new URLSearchParams(new URL(redirectUrl).search);
        const authorizationCode = urlParams.get("code");

        if (authorizationCode) {
          exchangeCodeForToken(authorizationCode, redirectUri);
        } else {
          console.error("Authorization code not found in redirect URL");
        }
      }
    );
  } catch (error) {
    console.error("Failed to start OAuth flow:", error);
  }
}

async function exchangeCodeForToken(authorizationCode, redirectUri) {
  try {
    const response = await fetch(
      "https://qbo-custom-print-back-end.vercel.app/auth/exchange-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authorizationCode, redirectUri }),
      }
    );

    if (!response.ok)
      throw new Error(
        `Failed to exchange code for token: ${response.statusText}`
      );

    const { access_token, refresh_token, realmId } = await response.json();
    chrome.storage.local.set({
      accessToken: access_token,
      refreshToken: refresh_token,
      realmId,
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
  }
}

// ✅ Logout function
function logout() {
  chrome.storage.local.remove(
    ["accessToken", "refreshToken", "realmId"],
    () => {
      console.log("🚀 User logged out successfully!");
    }
  );
}

// ✅ Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "startOAuth":
      startOAuthFlow();
      return true;

    case "logout":
      logout();
      sendResponse({ success: true });
      return true;

    case "getInvoice":
      fetchInvoice(request, sendResponse);
      return true;

    case "getCurrentTabURL":
      getCurrentTabURL(sendResponse);
      return true;
  }
});

async function fetchInvoice(request, sendResponse) {
  try {
    const { accessToken, realmId, invoiceId } = request;
    const response = await fetch(
      `https://qbo-custom-print-back-end.vercel.app/invoice?accessToken=${accessToken}&realmId=${realmId}&invoiceId=${invoiceId}`
    );

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: getCurrentTabDOMElement,
        });
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });
    sendResponse({ success: true, data });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    sendResponse({ success: false, error: error.message });
  }
}

function getCurrentTabURL(sendResponse) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    sendResponse(
      tabs[0] ? { url: tabs[0].url } : { error: "No active tab found" }
    );
  });
}

function getCurrentTabDOMElement() {
  const shippingAddress = document.getElementById("shippingAddress")?.value;
  console.log("DOM Element Retrieved:", shippingAddress);

  chrome.storage.local.set({ shippingAddress }, () => {
    console.log("Stored shippingAddress data:", shippingAddress);
  });
}
