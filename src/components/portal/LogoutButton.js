import React from "react";
import { useMsal } from "@azure/msal-react";
import { logEvent, LOG_TYPES } from "../../utils/logger";

export default function LogoutButton() {
  const { instance, accounts } = useMsal();
  const user = (accounts && accounts[0]) || {};

  const handleLogout = async () => {
    // Log logout attempt
    logEvent(LOG_TYPES.AUTH, "User logout initiated (LogoutButton)", {
      username: user?.username,
      name: user?.name,
      logoutMethod: "popup",
    });

    try {
      await instance.logoutPopup();
      // Log successful popup logout
      logEvent(LOG_TYPES.AUTH, "User logout successful (LogoutButton popup)", {
        username: user?.username,
        name: user?.name,
        logoutMethod: "popup",
      });
    } catch (error) {
      // Log logout error
      logEvent(LOG_TYPES.ERROR, "User logout failed (LogoutButton)", {
        username: user?.username,
        name: user?.name,
        logoutMethod: "popup",
        error: error?.message,
      });
    }
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 20px",
        borderRadius: 8,
        border: "none",
        backgroundColor: "#d83b01",
        color: "white",
        cursor: "pointer",
        fontSize: 16,
      }}
    >
      Sign out
    </button>
  );
}
