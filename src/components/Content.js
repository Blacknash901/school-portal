// src/components/Content.js
import React from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import UserPortal from "./portal/UserPortal";

export default function Content() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Log what's happening
  console.log("🔍 Content render:", {
    isAuthenticated,
    inProgress,
  });

  // Show loading screen while MSAL is initializing or handling redirects
  if (
    inProgress === InteractionStatus.Startup ||
    inProgress === InteractionStatus.HandleRedirect ||
    inProgress === InteractionStatus.Login
  ) {
    const savedTheme = localStorage.getItem("portal-theme") || "light";
    const isDark = savedTheme === "dark";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#1b2533" : "#fafafa",
          color: isDark ? "#9ea9b6" : "#666",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid",
              borderColor: "currentColor transparent currentColor transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          />
          <p style={{ marginTop: 16, fontSize: 14 }}>Cargando...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Render main portal
  return <UserPortal isAuthenticated={isAuthenticated} />;
}
