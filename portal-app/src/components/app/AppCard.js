import React from "react";
import { logEvent, LOG_TYPES } from "../../utils/logger";

/**
 * AppCard - small presentational card for an app entry
 * Props:
 *   - app: { id, name, url, target?, color?, icon? }
 *   - editMode: boolean - if true, prevents navigation
 */
function AppCard({ app, editMode = false }) {
  const bg = app.color || "#f0f0f0";
  const isImage =
    typeof app.icon === "string" &&
    (app.icon.startsWith("http") ||
      app.icon.startsWith("/") ||
      app.icon.endsWith(".svg") ||
      app.icon.endsWith(".png") ||
      app.icon.endsWith(".jpg"));

  function sanitizeUrl(url) {
    if (!url) return null;
    const trimmed = String(url).trim();
    if (!trimmed || trimmed === "#") return null;
    // keep absolute/known schemes
    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)) return trimmed;
    // allow internal routes (starting with /)
    if (trimmed.startsWith("/")) return trimmed;
    // otherwise assume https
    return `https://${trimmed}`;
  }

  const hrefValue = sanitizeUrl(app.url);

  const handleAppClick = () => {
    logEvent(LOG_TYPES.APP, "App clicked", {
      appId: app.id,
      appName: app.name,
      appUrl: app.url,
      appCategory: app.category,
    });
  };

  const content = (
    <>
      <div
        className={`app-icon ${!isImage ? "emoji" : ""}`}
        style={{
          background: isImage ? "transparent" : bg,
        }}
        draggable={false}
      >
        {isImage ? (
          <img
            src={app.icon} // this can now be an import string or full URL
            alt={`${app.name} icon`}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            draggable={false}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <span>{app.icon || app.name.slice(0, 1)}</span>
        )}
      </div>

      <div className="app-name" draggable={false}>
        {app.name}
      </div>
    </>
  );

  if (!hrefValue) {
    // render a disabled card when no valid URL
    return (
      <div
        className="app-card disabled"
        aria-label={app.name}
        title="Link not available"
      >
        {content}
      </div>
    );
  }

  // valid link — use plain anchor with noopener/noreferrer
  return (
    <a
      className="app-card"
      href={hrefValue}
      target={app.target || "_blank"}
      rel="noopener noreferrer"
      aria-label={app.name}
      onClick={(e) => {
        if (editMode) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        handleAppClick();
      }}
      draggable={false}
      style={{
        cursor: editMode ? "move" : "pointer",
      }}
    >
      {content}
    </a>
  );
}

export default React.memo(AppCard);
