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

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(
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

    const tokenData = await tokenResponse.json();
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      realmId = "9341454153583585",
    } = tokenData;

    // const companyInfoResponse = await fetch(
    //   `http://localhost:8000/companyInfo?accessToken=${accessToken}&realmId=9341454153583585`
    // )
    //   .then((response) => {
    //     response;
    //     console.log(response);
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching a company information:", error);
    //   });

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
    console.error(
      "Error during token exchange or fetching additional info:",
      error
    );
    throw error;
  }
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
  if (request.action === "getInvoice") {
    const { accessToken } = request;

    // Make a request to your backend server
    fetch(
      `http://localhost:8000/invoice?accessToken=${accessToken}&realmId=9341454153583585`
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
