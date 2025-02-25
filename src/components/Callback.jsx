import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Buffer } from "buffer";

const Callback = () => {
  const location = useLocation();
  const naviate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const authorizationCode = queryParams.get("code");

    if (authorizationCode) {
      // Exchange the authorization code for an access token
      getAccessToken(authorizationCode)
        .then(({ accessToken, companyId }) => {
          // Save tokens and companyId (e.g., in state or localStorage)
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("companyId", companyId);
          naviate.push("/dashboard"); // Redirect to a dashboard or other page
        })
        .catch((error) => {
          console.error("Error fetching access token:", error);
        });
    }
  }, [location, naviate]);

  const getAccessToken = async (authorizationCode) => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
    const redirectUri = "http://localhost:3000/callback";

    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", authorizationCode);
    params.append("redirect_uri", redirectUri);

    const response = await axios.post(
      "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    // const refreshAccessToken = async () => {
    //   const refreshToken = localStorage.getItem("refreshToken");
    //   const clientId = "YOUR_CLIENT_ID";
    //   const clientSecret = "YOUR_CLIENT_SECRET";

    //   const params = new URLSearchParams();
    //   params.append("grant_type", "refresh_token");
    //   params.append("refresh_token", refreshToken);

    //   const response = await axios.post(
    //     "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    //     params,
    //     {
    //       headers: {
    //         "Content-Type": "application/x-www-form-urlencoded",
    //         Authorization: `Basic ${Buffer.from(
    //           `${clientId}:${clientSecret}`
    //         ).toString("base64")}`,
    //       },
    //     }
    //   );

    //   const { access_token, refresh_token } = response.data;
    //   localStorage.setItem("accessToken", access_token);
    //   localStorage.setItem("refreshToken", refresh_token);
    // };

    const { access_token, refresh_token, realmId } = response.data;
    return { accessToken: access_token, companyId: realmId };
  };

  return <div>Loading...</div>;
};

export default Callback;
