import { useState } from "react";
import ServiceMonitor from "./components/ServiceMonitor";
import PrometheusMetrics from "./components/PrometheusMetrics";
import GrafanaDashboard from "./components/GrafanaDashboard";
import KubernetesMonitor from "./components/KubernetesMonitor";
import "./App.css";

function App() {
  const [activeView, setActiveView] = useState("dashboard");

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>CECRE Monitoring Dashboard</h1>
          <p className="header-subtitle">
            Kubernetes Cluster & Application Monitoring
          </p>
        </div>
      </header>

      <nav className="main-nav">
        <button
          className={activeView === "dashboard" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={activeView === "services" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("services")}
        >
          🌐 Services
        </button>
        <button
          className={activeView === "prometheus" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("prometheus")}
        >
          📈 Prometheus
        </button>
        <button
          className={activeView === "grafana" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("grafana")}
        >
          📉 Grafana
        </button>
        <button
          className={activeView === "kubernetes" ? "nav-btn active" : "nav-btn"}
          onClick={() => setActiveView("kubernetes")}
        >
          ☸️ Kubernetes
        </button>
      </nav>

      <main className="main-content">
        {activeView === "dashboard" && (
          <div className="dashboard-grid">
            <div className="dashboard-section">
              <ServiceMonitor />
            </div>
            <div className="dashboard-section">
              <PrometheusMetrics />
            </div>
          </div>
        )}
        {activeView === "services" && <ServiceMonitor />}
        {activeView === "prometheus" && <PrometheusMetrics />}
        {activeView === "grafana" && <GrafanaDashboard />}
        {activeView === "kubernetes" && <KubernetesMonitor />}
      </main>

      <footer className="app-footer">
        <p>
          CECRE Monitoring System | Last updated: {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
}

export default App;
