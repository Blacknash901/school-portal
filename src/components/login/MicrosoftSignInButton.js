import React from "react";
import { useMsal } from "@azure/msal-react";
import { logEvent, LOG_TYPES } from "../../utils/logger";

/**
 * Branded Microsoft sign-in button using MSAL.
 * Uses popup for better compatibility.
 */
const loginRequest = {
  scopes: ["User.Read", "User.ReadBasic.All"],
};

export default function MicrosoftSignInButton({
  label = "Sign in with Microsoft",
  className,
  style,
}) {
  const { instance, inProgress } = useMsal();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    // Prevent multiple simultaneous login attempts
    if (inProgress !== "none" || isLoggingIn) {
      console.warn("⚠️ Login already in progress, ignoring click");
      return;
    }

    setIsLoggingIn(true);

    // Log button click
    logEvent(LOG_TYPES.AUTH, "Microsoft sign-in button clicked");

    try {
      console.log("🚀 Starting login redirect...");
      // Use redirect instead of popup - more reliable
      await instance.loginRedirect({
        ...loginRequest,
        prompt: "select_account",
      });
      // Note: This won't return - page will redirect to Microsoft
    } catch (err) {
      setIsLoggingIn(false);

      // Log error with more details
      console.error("❌ Login failed:", {
        errorCode: err?.errorCode,
        errorMessage: err?.errorMessage,
        subError: err?.subError,
        fullError: err,
      });

      logEvent(LOG_TYPES.ERROR, "Microsoft authentication failed", {
        error: err?.message,
        errorCode: err?.errorCode,
        subError: err?.subError,
      });

      alert(`Login error: ${err?.errorMessage || err?.message}`);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={inProgress !== "none" || isLoggingIn}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#ffffff",
        cursor:
          inProgress !== "none" || isLoggingIn ? "not-allowed" : "pointer",
        fontWeight: 600,
        color: "#222",
        opacity: inProgress !== "none" || isLoggingIn ? 0.6 : 1,
        ...style,
      }}
      aria-label={label}
      type="button"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="1" y="1" width="10" height="10" fill="#F35325" />
        <rect x="13" y="1" width="10" height="10" fill="#81BC06" />
        <rect x="1" y="13" width="10" height="10" fill="#05A6F0" />
        <rect x="13" y="13" width="10" height="10" fill="#FFBA08" />
      </svg>

      <span>
        {isLoggingIn || inProgress !== "none" ? "Signing in..." : label}
      </span>
    </button>
  );
}
