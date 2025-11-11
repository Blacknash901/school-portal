import React from "react";
import "./ErrorMessage.css";

export default function ErrorMessage({
  title = "Error",
  message = "Algo salió mal. Por favor, intenta nuevamente.",
  onRetry,
  variant = "error", // error, warning, info
}) {
  const icons = {
    error: "⚠️",
    warning: "⚡",
    info: "ℹ️",
  };

  return (
    <div className={`error-message ${variant}`}>
      <div className="error-icon">{icons[variant]}</div>
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-text">{message}</p>
        {onRetry && (
          <button className="error-retry-btn" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
