import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyTheme } from "./lib/theme";

// "System" has to follow the OS when it flips mid-visit; an explicit
// choice ignores this because applyTheme re-reads what is stored.
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => applyTheme());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
