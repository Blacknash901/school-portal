// src/auth/msalInstance.js
import { PublicClientApplication } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";

// Get environment variables with fallbacks
const clientId = process.env.REACT_APP_AZURE_CLIENT_ID;
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID;
const redirectUri =
  process.env.REACT_APP_REDIRECT_URI || window.location.origin;

// Validate required environment variables
if (!clientId) {
  console.error(
    "REACT_APP_AZURE_CLIENT_ID is not set in environment variables"
  );
}
if (!tenantId) {
  console.error(
    "REACT_APP_AZURE_TENANT_ID is not set in environment variables"
  );
}

console.log("🔧 MSAL Config:", {
  clientId: clientId ? `${clientId.substring(0, 8)}...` : "MISSING",
  tenantId: tenantId ? `${tenantId.substring(0, 8)}...` : "MISSING",
  redirectUri: redirectUri,
});

export const msalConfig = {
  auth: {
    clientId: clientId || "",
    authority: `https://login.microsoftonline.com/${tenantId || "common"}`,
    redirectUri: redirectUri,
    postLogoutRedirectUri: redirectUri,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    allowNativeBroker: false, // Disables WAM Broker
    loggerOptions: {
      logLevel: "Info",
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case 0: // Error
            console.error(message);
            return;
          case 1: // Warning
            console.warn(message);
            return;
          case 2: // Info
            console.info(message);
            return;
          case 3: // Verbose
            console.debug(message);
            return;
          default:
            return;
        }
      },
    },
  },
};

export const pca = new PublicClientApplication(msalConfig);

/**
 * Fetch user groups from Microsoft Graph
 * @param {PublicClientApplication} instance
 * @param {AccountInfo} account
 * @returns {Promise<string[]>} array of group display names
 */
export async function getUserGroups(instance, account) {
  console.log("🔍 getUserGroups: Starting group fetch...");

  const client = Client.init({
    authProvider: (done) => {
      instance
        .acquireTokenSilent({
          scopes: ["User.Read", "User.ReadBasic.All"],
          account: account,
        })
        .then((response) => {
          console.log("✅ getUserGroups: Token acquired successfully");
          done(null, response.accessToken);
        })
        .catch((err) => {
          console.error("❌ getUserGroups: Token acquisition failed:", err);
          done(err, null);
        });
    },
  });

  try {
    console.log("📡 getUserGroups: Calling Microsoft Graph API...");
    const res = await client.api("/me/memberOf").get();
    console.log("📦 getUserGroups: Raw response:", res);

    // Filter only groups with displayName
    const groups = res.value
      .filter((g) => g.displayName)
      .map((g) => g.displayName);
    console.log("✅ getUserGroups: Successfully retrieved groups:", groups);

    return groups;
  } catch (err) {
    console.error("❌ getUserGroups: Failed to fetch groups:", err);

    // Fallback: try to get groups from ID token claims
    try {
      const idTokenClaims = account?.idTokenClaims;
      if (idTokenClaims?.groups && Array.isArray(idTokenClaims.groups)) {
        console.log(
          "🔄 getUserGroups: Using groups from ID token:",
          idTokenClaims.groups
        );
        return idTokenClaims.groups;
      }
    } catch (fallbackErr) {
      console.error("❌ getUserGroups: Fallback also failed:", fallbackErr);
    }

    return [];
  }
}
