import React from "react";
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import QBOAuth from "./components/QBOAuth.jsx";
// import Callback from "./components/Callback.jsx";
// import Customers from "./components/Customers.jsx";
import "./App.css";
function App() {
  const handleConnect = () => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: "startOAuth" });
    } else {
      console.error("chrome.runtime.sendMessage is not available.");
    }
  };
  console.log("hello");
  return (
    <div>
      <h1>QuickBooks Chrome Extension</h1>
      <button onClick={handleConnect}>Connect to QuickBooks</button>
    </div>
  );
}

export default App;
