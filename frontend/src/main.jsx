import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "antd/dist/reset.css";
import "./styles/calendar.css";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
