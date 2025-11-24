import React, { useState, useEffect, useRef } from "react";
import { useMsal } from "@azure/msal-react";
import { logEvent, LOG_TYPES } from "../../utils/logger";

export default function UserMenu({ user, theme, setTheme }) {
  const { instance } = useMsal();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close dropdown on click outside
  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleSignOut = async () => {
    setOpen(false);

    // Log logout attempt
    logEvent(LOG_TYPES.AUTH, "User logout initiated", {
      username: user?.username,
      name: user?.name,
      logoutMethod: "redirect", // Will be updated based on actual method used
    });

    try {
      await instance.logoutRedirect();
      // Log successful redirect logout
      logEvent(LOG_TYPES.AUTH, "User logout successful (redirect)", {
        username: user?.username,
        name: user?.name,
        logoutMethod: "redirect",
      });
    } catch (redirectError) {
      try {
        await instance.logoutPopup();
        // Log successful popup logout
        logEvent(LOG_TYPES.AUTH, "User logout successful (popup)", {
          username: user?.username,
          name: user?.name,
          logoutMethod: "popup",
        });
      } catch (popupError) {
        // Log fallback logout
        logEvent(LOG_TYPES.AUTH, "User logout successful (fallback)", {
          username: user?.username,
          name: user?.name,
          logoutMethod: "fallback",
          errors: {
            redirectError: redirectError?.message,
            popupError: popupError?.message,
          },
        });
        window.location.assign(
          "https://login.microsoftonline.com/common/oauth2/v2.0/logout"
        );
      }
    }
  };

  const openMyAccount = () => {
    setOpen(false);
    window.open(
      "https://myaccount.microsoft.com",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const initials = (user?.name || user?.username || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
        title="Account menu"
        type="button"
      >
        <div style={{ textAlign: "right", lineHeight: 1 }}>
          <div className="user-name"></div>
          <div className="user-role" style={{ marginTop: 4 }}></div>
        </div>

        <span className="user-initials">{initials}</span>

        <svg
          className="caret"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
          style={{ marginLeft: 8 }}
        >
          <path d="M7 10l5 5 5-5z" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <button
            type="button"
            className="user-menu-item"
            onClick={openMyAccount}
          >
            Mi cuenta
          </button>

          <div
            className="user-menu-item theme-row"
            role="group"
            aria-label="Theme"
          >
            <span>Modo oscuro</span>
            <button
              type="button"
              className={`theme-toggle-button ${theme === "dark" ? "on" : ""}`}
              aria-pressed={theme === "dark"}
              title="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <span className="switch-knob" />
            </button>
          </div>

          <button
            type="button"
            className="user-menu-item signout"
            onClick={handleSignOut}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
