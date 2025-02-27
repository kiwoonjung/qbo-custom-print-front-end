import React, { useEffect } from "react";
import { useState } from "react";
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import QBOAuth from "./components/QBOAuth.jsx";
// import Callback from "./components/Callback.jsx";
// import Customers from "./components/Customers.jsx";
import "./App.css";
import Dashboard from "./components/Dashboard.jsx";
import Login from "./components/Login.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // Check if the user is already logged in
  React.useEffect(() => {
    chrome.storage.local.get(["accessToken"], (result) => {
      if (result.accessToken) {
        setIsLoggedIn(true);
      }
    });
  }, []);

  // Handle the OAuth flow
  const handleConnect = () => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: "startOAuth" }, (response) => {
        if (response.success) {
          setIsLoggedIn(true); // Update login state
        } else {
          console.error("OAuth failed", response.error);
        }
      });
    } else {
      console.error("chrome.runtime.sendMessage is not available");
    }
  };

  const handleLogout = () => {
    chrome.storage.local.remove(
      ["accessToken", "refreshToken", "realmId"],
      () => {
        setIsLoggedIn(false); // Update login state
      }
    );
  };

  return (
    <div>
      {isLoggedIn ? (
        <Dashboard handleLogout={handleLogout} />
      ) : (
        <Login handleConnect={handleConnect} />
      )}
    </div>
  );
}

export default App;
