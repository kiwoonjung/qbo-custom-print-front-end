const clientId = import.meta.env.VITE_CLIENT_ID;
console.log("Service worker is running!");
console.log("Client Id", import.meta.env.VITE_CLIENT_ID);
const redirectUri = chrome.identity.getRedirectURL(); // Automatically generates a redirect URI for your extension

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
  const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
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

  // Store the tokens securely (e.g., in chrome.storage.local)
  chrome.storage.local.set({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    realmId: data.realmId,
  });
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startOAuth") {
    console.log("hello");
    // Start the OAuth flow
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        // Handle the OAuth flow
      }
    );
  }
});
