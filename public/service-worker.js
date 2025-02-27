const clientId = "ABsM995q0AersWbrlUgxLSpii2n7qSZqQhabDf9KKAyTBxbtOx";
console.log("Service worker is running!");

const redirectUri = chrome.identity.getRedirectURL(); // Automatically generates a redirect URI for your extension
console.log("redirectUri", redirectUri);

const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&state=chrome_extension`;

chrome.identity.launchWebAuthFlow(
  {
    url: authUrl,
    interactive: true,
  },
  (redirectUrl) => {
    if (chrome.runtime.lastError) {
      console.error("OAuth failed:", chrome.runtime.lastError);
      return;
    }

    // Extract the authorization code from the redirect URL
    const urlParams = new URLSearchParams(new URL(redirectUrl).search);
    const authorizationCode = urlParams.get("code");

    if (authorizationCode) {
      // Exchange the authorization code for an access token
      exchangeCodeForToken(authorizationCode);
    }
  }
);

const exchangeCodeForToken = async (authorizationCode) => {
  const clientSecret = "FaO2w7vUh0NtHExUAi6tt0DuoHSgkgztSIlCzcpK";
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", authorizationCode);
  params.append("redirect_uri", redirectUri);

  const response = await fetch(
    "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: params,
    }
  );

  const data = await response.json();
  console.log("Access Token:", data.access_token);
  console.log("Refresh Token:", data.refresh_token);
  console.log("Realm ID:", data.realmId);
  console.log("Data", data);

  // Store the tokens securely (e.g., in chrome.storage.local)
  chrome.storage.local.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    realmId: data.realmId,
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startOAuth") {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError });
          return;
        }

        // Extract the authorization code and exchange it for tokens
        const urlParams = new URLSearchParams(new URL(redirectUrl).search);
        const authorizationCode = urlParams.get("code");

        if (authorizationCode) {
          exchangeCodeForToken(authorizationCode)
            .then(() => {
              sendResponse({ success: true });
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
        } else {
          sendResponse({
            success: false,
            error: "No authorization code found",
          });
        }
      }
    );

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getInvoices") {
    const { accessToken } = request;

    // Construct the URL for fetching invoices
    const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/9341454153583585/query?query=SELECT * FROM Invoice&minorversion=75`;

    // Use fetch to make the API request
    fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching invoices:", error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});
