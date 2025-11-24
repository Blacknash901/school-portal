// src/components/portal/UserPortal.js
import React, { useEffect, useState, useMemo } from "react";
import { useMsal } from "@azure/msal-react";
import UnifiedNews from "../news/UnifiedNews";
import WordPressNews from "../news/WordPressNews";
import { getAppsForRole } from "../../data/apps";
import OrganizedApps from "../app/OrganizedApps";
import UserMenu from "./UserMenu";
import LoginButton from "../login/LoginButton";
import "./UserPortal.css";
import { getUserGroups } from "../../auth/msalInstance";
import { getRoleFromGroups } from "../../utils/roleUtils";
import { logEvent, LOG_TYPES } from "../../utils/logger";
import cecreLogo from "../../assets/images/cecre_logo_test.jpeg";

export default function UserPortal({ roleOverride = null, extras = [] }) {
  const { accounts, inProgress, instance } = useMsal();
  const user = (accounts && accounts[0]) || {};
  const displayName = user?.name ?? user?.username ?? "Usuario";

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("portal-theme") || "light";
    // Apply theme to html element immediately
    document.documentElement.setAttribute("data-theme", savedTheme);
    return savedTheme;
  });

  const [groups, setGroups] = useState(() => {
    try {
      const saved = sessionStorage.getItem("user-groups");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isAuthenticated = !!accounts?.length;

  // --- Role detection ---
  const role = useMemo(() => {
    const detectedRole = getRoleFromGroups(groups, roleOverride);
    console.log("🧭 Detected role:", detectedRole, "from groups:", groups);
    return detectedRole;
  }, [groups, roleOverride]);

  useEffect(() => {
    localStorage.setItem("portal-theme", theme);
    // Apply theme to html element for overscroll background
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Log authentication success when user logs in with role and groups
  useEffect(() => {
    if (isAuthenticated && accounts?.length && role && groups.length > 0) {
      const account = accounts[0];
      logEvent(LOG_TYPES.AUTH, "Microsoft authentication successful", {
        username: account.username,
        name: account.name,
        role: role,
        groups: groups,
      });
    }
  }, [isAuthenticated, role, groups.length]); // Log when auth, role, or groups change

  // Log when user becomes unauthenticated (session expired, logout, etc.)
  useEffect(() => {
    if (!isAuthenticated && accounts?.length === 0) {
      // Only log if we had a previous session (to avoid logging on initial load)
      const hadPreviousSession =
        sessionStorage.getItem("had-session") === "true";
      if (hadPreviousSession) {
        logEvent(LOG_TYPES.AUTH, "User session ended", {
          reason: "session_expired_or_logout",
          timestamp: new Date().toISOString(),
        });
        sessionStorage.removeItem("had-session");
      }
    } else if (isAuthenticated) {
      // Mark that we have an active session
      sessionStorage.setItem("had-session", "true");
    }
  }, [isAuthenticated]);

  // Fetch groups if not cached
  useEffect(() => {
    if (accounts.length && groups.length === 0) {
      console.log("🔹 Fetching groups for", accounts[0].username);
      getUserGroups(instance, accounts[0])
        .then((fetchedGroups) => {
          console.log("✅ Groups fetched:", fetchedGroups);
          setGroups(fetchedGroups);
          sessionStorage.setItem("user-groups", JSON.stringify(fetchedGroups));
        })
        .catch((err) => console.error("❌ Error fetching groups:", err));
    } else {
      console.log("ℹ️ Groups already set:", groups);
    }
  }, [accounts, instance, groups.length]);

  const apps = useMemo(
    () => (isAuthenticated ? getAppsForRole(role, { extraApps: extras }) : []),
    [role, extras, isAuthenticated]
  );

  // 🚨 STOP HERE if not logged in
  if (!isAuthenticated) {
    return <LoginButton />;
  }

  // ✅ Only render this if logged in
  return (
    <div className="portal-container" data-theme={theme}>
      <UserMenu user={user} theme={theme} setTheme={setTheme} />

      {/* Floating watermark site title */}
      <div className="site-title-watermark">
        <span>Centro Educativo</span>
        <span>Cristiano Reformado</span>
      </div>

      <header className="portal-header">
        <div className="welcome-container">
          <img src={cecreLogo} alt="CECRE Logo" className="welcome-logo" />
          <div className="welcome-text">
            <h2 className="welcome-message">Bienvenido al portal de CECRE</h2>
            <p className="welcome-name">{displayName}</p>
          </div>
        </div>
      </header>

      <main className="portal-main">
        <section className="apps-section" aria-label="Aplicaciones">
          <OrganizedApps apps={apps} role={role} />
        </section>

        <section className="news-section" aria-label="Noticias y devocionales">
          <UnifiedNews theme={theme} />
          <WordPressNews
            feedUrl={
              process.env.REACT_APP_WORDPRESS_FEED_URL ||
              "https://devocecre.wordpress.com/feed"
            }
            maxItems={2}
            theme={theme}
          />
        </section>
      </main>
    </div>
  );
}
