/**
 * Main Entry Point for CECRE Monitoring Application
 *
 * Renders the root React application with StrictMode enabled for additional
 * development checks and warnings. The app is mounted to the DOM element with id 'root'.
 *
 * @module main
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Create React root and render the application in strict mode
// StrictMode helps identify potential problems in the application
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
