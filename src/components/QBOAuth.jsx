import React from "react";

const QBOAuth = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const redirectUri = encodeURIComponent("http://localhost:5173/callback");
  const scope = encodeURIComponent("com.intuit.quickbooks.accounting");
  const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${redirectUri}&state=react_app`;
  return (
    <div>
      <a href={authUrl}>Connect to QuickBooks</a>
    </div>
  );
};

export default QBOAuth;
