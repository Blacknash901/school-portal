/**
 * Grafana Dashboard Component
 *
 * Displays Grafana dashboards and their panel data within the monitoring app.
 * Allows users to select from available dashboards and view their metrics.
 *
 * Features:
 * - List all available Grafana dashboards
 * - Select and display individual dashboard panels
 * - Fetch time-series data for dashboard panels
 * - Display metric labels and current values
 * - Auto-refresh capability
 *
 * @component
 */

import { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../config/urls";
import "./GrafanaDashboard.css";

const GrafanaDashboard = () => {
  // List of available Grafana dashboards
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null); // Currently selected dashboard definition
  const [dashboardData, setDashboardData] = useState(null); // Panel data for selected dashboard
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error message

  /**
   * Select a dashboard by UID and fetch its definition and panel data
   * Fetches data for the last hour by default
   *
   * @param {string} uid - Unique identifier of the dashboard in Grafana
   */
  const selectDashboard = useCallback(async (uid) => {
    try {
      setLoading(true);

      // Fetch dashboard definition
      const dashResponse = await fetch(
        `${API_ENDPOINTS.GRAFANA_DASHBOARD}/${uid}`
      );
      const dashData = await dashResponse.json();
      setSelectedDashboard(dashData);

      // Fetch dashboard panel data
      const now = Math.floor(Date.now() / 1000);
      const from = now - 3600; // Last hour

      const dataResponse = await fetch(
        `${API_ENDPOINTS.GRAFANA_DASHBOARD}/${uid}/data`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: now }),
        }
      );
      const panelData = await dataResponse.json();
      setDashboardData(panelData);

      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch list of all available Grafana dashboards
   * Auto-selects the first dashboard if any are available
   */
  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.GRAFANA_DASHBOARDS);
      const data = await response.json();
      setDashboards(data);

      // Auto-select first dashboard if available
      if (data.length > 0) {
        selectDashboard(data[0].uid);
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching Grafana dashboards:", err);
      setError("Failed to fetch dashboards from Grafana");
    } finally {
      setLoading(false);
    }
  }, [selectDashboard]);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const renderPanelData = (panel) => {
    if (!panel.data?.data?.result) {
      return <div className="no-data">No data available</div>;
    }

    const results = panel.data.data.result;

    if (results.length === 0) {
      return <div className="no-data">No data points</div>;
    }

    return (
      <div className="panel-data">
        {results.slice(0, 5).map((result, idx) => {
          const metric = result.metric;
          const values = result.values || [result.value];
          const latestValue = values[values.length - 1];

          return (
            <div key={idx} className="metric-row">
              <div className="metric-labels">
                {Object.entries(metric).map(([key, value]) => (
                  <span key={key} className="metric-tag">
                    {key}: {value}
                  </span>
                ))}
              </div>
              <div className="metric-current-value">
                {latestValue?.[1]
                  ? parseFloat(latestValue[1]).toFixed(2)
                  : "N/A"}
              </div>
            </div>
          );
        })}
        {results.length > 5 && (
          <div className="more-metrics">+{results.length - 5} more metrics</div>
        )}
      </div>
    );
  };

  if (loading && dashboards.length === 0) {
    return (
      <div className="grafana-dashboard">
        <div className="dashboard-header">
          <h2>Grafana Dashboards</h2>
        </div>
        <div className="loading">Loading dashboards...</div>
      </div>
    );
  }

  if (error && dashboards.length === 0) {
    return (
      <div className="grafana-dashboard">
        <div className="dashboard-header">
          <h2>Grafana Dashboards</h2>
        </div>
        <div className="error">{error}</div>
        <div className="info-message" style={{ marginTop: "20px" }}>
          <p>
            Grafana may still be starting up or dashboards need to be created.
          </p>
          <p>
            Access Grafana directly at:{" "}
            <a href="/grafana" target="_blank" rel="noopener noreferrer">
              https://portal.cecre.net/grafana
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (!loading && dashboards.length === 0) {
    return (
      <div className="grafana-dashboard">
        <div className="dashboard-header">
          <h2>Grafana Dashboards</h2>
          <button onClick={fetchDashboards} className="refresh-btn">
            Refresh
          </button>
        </div>
        <div className="info-message">
          <h3>No Dashboards Found</h3>
          <p>No Grafana dashboards are currently configured.</p>
          <p>
            Access Grafana directly to create dashboards:{" "}
            <a href="/grafana" target="_blank" rel="noopener noreferrer">
              https://portal.cecre.net/grafana
            </a>
          </p>
          <p>Default credentials: admin / admin123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grafana-dashboard">
      <div className="dashboard-header">
        <h2>Grafana Dashboards</h2>
        <button onClick={fetchDashboards} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="dashboard-selector">
        <label htmlFor="dashboard-select">Select Dashboard:</label>
        <select
          id="dashboard-select"
          value={selectedDashboard?.dashboard?.uid || ""}
          onChange={(e) => selectDashboard(e.target.value)}
        >
          {dashboards.map((dash) => (
            <option key={dash.uid} value={dash.uid}>
              {dash.title}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Loading dashboard data...</div>}

      {!loading && dashboardData && (
        <div className="dashboard-content">
          <h3>{dashboardData.dashboard?.title}</h3>

          {dashboardData.panels && dashboardData.panels.length > 0 ? (
            <div className="panels-grid">
              {dashboardData.panels.map((panel) => (
                <div key={panel.panelId} className="panel-card">
                  <div className="panel-title">{panel.panelTitle}</div>
                  {renderPanelData(panel)}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-panels">
              No panel data available for this dashboard
            </div>
          )}
        </div>
      )}

      {!loading && !dashboardData && selectedDashboard && (
        <div className="info-message">Select a dashboard to view its data</div>
      )}
    </div>
  );
};

export default GrafanaDashboard;
