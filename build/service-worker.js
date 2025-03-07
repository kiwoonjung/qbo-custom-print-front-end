console.log("Service worker is running!");

// Fetch the clientId from your backend
fetch("http://localhost:8000/auth/get-client-id")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Failed to fetch clientId: ${response.statusText}`);
    }
    return response.json();
  })
  .then((data) => {
    const clientId = data.clientId;
    const redirectUri = chrome.identity.getRedirectURL(); // Automatically generates a redirect URI for your extension
    console.log("redirectUri", redirectUri);

    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${redirectUri}&state=chrome_extension`;

    // Launch the OAuth flow
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
          // Send the authorization code to the backend for token exchange
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

// Function to send the authorization code to the backend for token exchange
const exchangeCodeForToken = async (authorizationCode, redirectUri) => {
  console.log("authorizationCode", authorizationCode);
  try {
    const response = await fetch("http://localhost:8000/auth/exchange-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code: authorizationCode, redirectUri }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to exchange code for token: ${response.statusText}`
      );
    }

    const tokenData = await response.json();
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      realmId,
    } = tokenData;

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    console.log("Realm ID:", realmId);

    // Store tokens and additional info securely
    chrome.storage.local.set({
      accessToken,
      refreshToken,
      realmId,
    });
  } catch (error) {
    console.error("Error during token exchange:", error);
  }
};

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startOAuth") {
    // Fetch the clientId and initiate the OAuth flow
    fetch("https://your-backend-server.com/get-client-id")
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
          {
            url: authUrl,
            interactive: true,
          },
          (redirectUrl) => {
            if (chrome.runtime.lastError) {
              sendResponse({ success: false, error: chrome.runtime.lastError });
              return;
            }

            // Extract the authorization code and exchange it for tokens
            const urlParams = new URLSearchParams(new URL(redirectUrl).search);
            const authorizationCode = urlParams.get("code");

            if (authorizationCode) {
              exchangeCodeForToken(authorizationCode, redirectUri)
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
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getInvoice") {
    const { accessToken } = request;

    // Make a request to your backend server
    fetch(
      `http://localhost:8000/invoice?accessToken=${accessToken}&realmId=9341454187481835`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Parse the response as JSON
      })
      .then((data) => {
        console.log("Response Data:", data); // Log the response data
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching invoice:", error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});
