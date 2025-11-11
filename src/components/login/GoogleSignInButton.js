import React, { useEffect, useRef, useState } from "react";

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
      {/* Google "G" glyph */}
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="#EA4335" d="M12 11.5v3.5h5.1c-.2 1-1.1 3-3.1 4.2l-.1.1 4.5.4C20.3 20 23 16.8 23 12c0-.7-.1-1.4-.2-2H12z" />
        <path fill="#34A853" d="M6.3 14.3l-1.1.9C3.6 12.8 3 10.5 3 8s.6-4.8 2.2-6.2L8 4.9C7.7 5.7 7.6 6.8 7.6 8s.1 2.3.7 3.3z" />
        <path fill="#FBBC05" d="M12 4.5c1.6 0 2.8.6 3.6 1.1l2.5-2.5C16.8 1.1 14.5 0 12 0 7.7 0 4.1 2.3 2.2 5.8l2.5 1.9C6.6 6 9 4.5 12 4.5z" />
        <path fill="#4285F4" d="M23 12c0 .8-.1 1.5-.2 2H12V9.5h6.1c-.4-1.4-1.4-2.6-2.9-3.4l-.1-.1-4.5.4C9.5 7.6 8.3 9.9 8.3 12s1.2 4.4 3.1 5.6c2.1 1.4 4.8 1.4 6.6.2 1.6-1 2.4-2.2 3-3 0 0 0 0 0 0 0 0 0 0 0 0z" />
      </svg>

      <span>{label}</span>
    </button>
  );
}