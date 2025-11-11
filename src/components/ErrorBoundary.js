import React from "react";
import { downloadLogs } from "../utils/logger";

/**
 * Error boundary component that shows download option when errors occur
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log to our logging system
    if (window.logEvent) {
      window.logEvent("ERROR", "React Error Boundary caught error", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleDownloadLogs = () => {
    downloadLogs("error-report");
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            margin: "20px",
            border: "1px solid #ff6b6b",
            borderRadius: "8px",
            backgroundColor: "#fff5f5",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <h2 style={{ color: "#d63031", marginTop: 0 }}>
            ¡Oops! Algo salió mal
          </h2>

          <p style={{ color: "#636e72", marginBottom: "20px" }}>
            Ha ocurrido un error inesperado. Por favor, descarga los logs y
            envíalos al administrador para que podamos solucionarlo.
          </p>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={this.handleDownloadLogs}
              style={{
                padding: "10px 20px",
                backgroundColor: "#0078d4",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              📥 Descargar logs de error
            </button>

            <button
              onClick={this.handleRetry}
              style={{
                padding: "10px 20px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔄 Intentar de nuevo
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              🔄 Recargar página
            </button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <details style={{ marginTop: "20px" }}>
              <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                Detalles técnicos (solo en desarrollo)
              </summary>
              <pre
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "10px",
                  borderRadius: "4px",
                  overflow: "auto",
                  fontSize: "12px",
                  marginTop: "10px",
                }}
              >
                {this.state.error && this.state.error.toString()}
                <br />
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
