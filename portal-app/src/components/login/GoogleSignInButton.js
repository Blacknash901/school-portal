import React, { useEffect, useRef, useState } from "react";
import googleImage from "../../assets/images/google.png";

/**
 * GoogleSignInButton
 * - Uses Google Identity Services (accounts.google.com/gsi/client)
 * - Requests an access token via initTokenClient and fetches basic userinfo
 * - Requires REACT_APP_GOOGLE_CLIENT_ID to be set in your environment
 *
 * Note: client-side token flow is suitable for basic profile-only uses.
 * For sensitive scopes or server-side verification, use the authorization code flow + backend.
 */
export default function GoogleSignInButton({
  clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID,
  scope = "openid email profile",
  label = "Sign in with Google",
  onSuccess = () => {},
  onError = () => {},
  className,
  style,
}) {
  const tokenClientRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!clientId) {
      // eslint-disable-next-line no-console
      console.warn("GoogleSignInButton: REACT_APP_GOOGLE_CLIENT_ID is not set");
      return;
    }

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      setLoaded(true);
      return;
    }

    // load the Google Identity Services script
    const id = "google-identity";
    if (document.getElementById(id)) {
      // wait a short while for it to initialize
      const t = setTimeout(() => setLoaded(Boolean(window.google && window.google.accounts)), 300);
      return () => clearTimeout(t);
    }

    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.id = id;
    s.async = true;
    s.defer = true;
    s.onload = () => setLoaded(Boolean(window.google && window.google.accounts));
    s.onerror = () => {
      // eslint-disable-next-line no-console
      console.error("Failed to load Google Identity script");
      onError(new Error("Google script load failed"));
    };
    document.head.appendChild(s);

    return () => {
      // keep the script (no cleanup) — allowed to persist
    };
  }, [clientId, onError]);

  const ensureTokenClient = () => {
    if (!clientId || !loaded) return null;
    if (tokenClientRef.current) return tokenClientRef.current;

    try {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: async (tokenResponse) => {
          if (!tokenResponse || !tokenResponse.access_token) {
            onError(new Error("No access token returned"));
            return;
          }
          try {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await res.json();
            onSuccess({ tokenResponse, profile });
          } catch (err) {
            onError(err);
          }
        },
      });
      return tokenClientRef.current;
    } catch (err) {
      onError(err);
      return null;
    }
  };

  const handleClick = () => {
    if (!clientId) {
      onError(new Error("Google client id missing"));
      return;
    }
    const client = ensureTokenClient();
    if (!client) {
      onError(new Error("Google token client not available"));
      return;
    }
    // request access token; prompt will open a popup
    client.requestAccessToken({ prompt: "consent" });
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.08)",
        background: "#fff",
        cursor: "pointer",
        fontWeight: 600,
        color: "#222",
        ...style,
      }}
      aria-label={label}
      type="button"
    >
      <img
        src={googleImage}
        alt="Google"
        width="20"
        height="20"
        style={{ display: "block" }}
      />

      <span>{label}</span>
    </button>
  );
}