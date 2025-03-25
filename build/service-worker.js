// ✅ Check if the user is already authenticated before starting OAuth
chrome.storage.local.get(["accessToken", "refreshToken", "realmId"], (data) => {
  if (data.accessToken && data.realmId) {
    console.log("✅ User is already authenticated with QuickBooks.");
    return; // ✅ Stop OAuth process if user is already logged in
  }

  // If no access token, start the OAuth flow
  startOAuthFlow();
});

function startOAuthFlow() {
  fetch("https://qbo-custom-print-back-end.vercel.app/auth/get-client-id")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch clientId: ${response.statusText}`);
      }
      return response.json();
    })
    .then((data) => {
      const clientId = data.clientId;
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
    })
    .catch((error) => {
      console.error("Failed to fetch clientId:", error);
    });
}

const exchangeCodeForToken = async (authorizationCode, redirectUri) => {
  try {
    const response = await fetch(
      "https://qbo-custom-print-back-end.vercel.app/auth/exchange-code",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: authorizationCode, redirectUri }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to exchange code for token: ${response.statusText}`
      );
    }

    const tokenData = await response.json();
    const { access_token, refresh_token, realmId } = tokenData;

    // ✅ Store tokens securely in Chrome Storage
    chrome.storage.local.set({
      accessToken: access_token,
      refreshToken: refresh_token,
      realmId,
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
  }
};

// ✅ Logout: Remove tokens from storage when user disconnects
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
  if (request.action === "startOAuth") {
    startOAuthFlow();
    return true;
  }

  if (request.action === "logout") {
    logout();
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "getInvoice") {
    const { accessToken, realmId, invoiceId } = request;

    fetch(
      `https://qbo-custom-print-back-end.vercel.app/invoice?accessToken=${accessToken}&realmId=${realmId}&invoiceId=${invoiceId}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
          let currentTab = tabs[0];
          if (currentTab) {
            chrome.scripting.executeScript(
              {
                target: { tabId: currentTab.id },
                function: getCurrentTabDOMElement,
              },
              (result) => {
                console.log(result);
              }
            );
          } else {
            sendResponse({ error: "No active tab found" });
          }
        });
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching invoice:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (request.action === "getCurrentTabURL") {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      let currentTab = tabs[0];
      if (currentTab) {
        sendResponse({ url: currentTab.url });
      } else {
        sendResponse({ error: "No active tab found" });
      }
    });

    return true;
  }
});

function getCurrentTabDOMElement() {
  console.log(
    "DOM Element Retrieved:",
    document.getElementById("shippingAddress")?.value
  );

  chrome.storage.local.set(
    { shippingAddress: document.getElementById("shippingAddress")?.value },
    () => {
      console.log(
        "Stored shippingAddress data:",
        document.getElementById("shippingAddress")?.value
      );
    }
  );
}
