/**
 * Prometheus Metrics Component
 *
 * Displays real-time metrics from Prometheus server including:
 * - CPU usage by pod
 * - Memory usage by pod
 * - Pod and node counts
 * - HTTP request rates
 * - Active alerts and their status
 * - Scrape targets and their health
 *
 * Fetches data from the backend API which proxies to Prometheus.
 * Auto-refreshes every 30 seconds to show current cluster state.
 *
 * @component
 */

import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../config/urls";
import "./PrometheusMetrics.css";

const PrometheusMetrics = () => {
  // Store fetched metrics data from Prometheus queries
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]); // Active Prometheus alerts
  const [targets, setTargets] = useState([]); // Prometheus scrape targets
  const [loading, setLoading] = useState(true); // Loading state for UI
  const [error, setError] = useState(null); // Error message if fetch fails

  /**
   * Fetch metrics, alerts, and targets from Prometheus API
   * Executes multiple PromQL queries in parallel for efficiency
   * Queries include: CPU usage, memory usage, pod count, node count, HTTP requests
   */
  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Define PromQL queries for different metrics
      // Each query is executed against Prometheus to get current cluster state
      const queries = {
        cpuUsage: "sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)",
        memoryUsage: "sum(container_memory_usage_bytes) by (pod)",
        podCount: "count(kube_pod_info)",
        nodeCount: "count(kube_node_info)",
        httpRequests: "sum(rate(http_requests_total[5m]))",
      };

      const metricPromises = Object.entries(queries).map(
        async ([key, query]) => {
          try {
            const response = await fetch(API_ENDPOINTS.PROMETHEUS_QUERY, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query }),
            });
            const data = await response.json();
            return { key, data: data.data?.result || [] };
          } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            return { key, data: [] };
          }
        }
      );

      const results = await Promise.all(metricPromises);
      const metricsData = results.reduce((acc, { key, data }) => {
        acc[key] = data;
        return acc;
      }, {});

      setMetrics(metricsData);

      // Fetch alerts
      const alertsResponse = await fetch(API_ENDPOINTS.PROMETHEUS_ALERTS);
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.data?.alerts || []);

      // Fetch targets
      const targetsResponse = await fetch(API_ENDPOINTS.PROMETHEUS_TARGETS);
      const targetsData = await targetsResponse.json();
      setTargets(targetsData.data?.activeTargets || []);

      setError(null);
    } catch (err) {
      console.error("Error fetching Prometheus metrics:", err);
      setError("Failed to fetch metrics from Prometheus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatMetricValue = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (num > 1000000000) return `${(num / 1000000000).toFixed(2)} GB`;
    if (num > 1000000) return `${(num / 1000000).toFixed(2)} MB`;
    if (num > 1000) return `${(num / 1000).toFixed(2)} KB`;
    return num.toFixed(2);
  };

  if (loading && !metrics) {
    return (
      <div className="prometheus-metrics">
        <div className="metrics-header">
          <h2>Prometheus Metrics</h2>
        </div>
        <div className="loading">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prometheus-metrics">
        <div className="metrics-header">
          <h2>Prometheus Metrics</h2>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="prometheus-metrics">
      <div className="metrics-header">
        <h2>Prometheus Metrics</h2>
        <button onClick={fetchMetrics} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="metrics-summary">
        <div className="metric-card">
          <div className="metric-label">Pods</div>
          <div className="metric-value">
            {metrics?.podCount?.[0]?.value?.[1] || "0"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Nodes</div>
          <div className="metric-value">
            {metrics?.nodeCount?.[0]?.value?.[1] || "0"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Active Alerts</div>
          <div className="metric-value alert-count">
            {alerts.filter((a) => a.state === "firing").length}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">HTTP Req/s</div>
          <div className="metric-value">
            {metrics?.httpRequests?.[0]?.value?.[1]
              ? parseFloat(metrics.httpRequests[0].value[1]).toFixed(2)
              : "0"}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Active Alerts</h3>
          <div className="alerts-list">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item alert-${alert.state}`}>
                <div className="alert-header">
                  <span className="alert-name">{alert.labels?.alertname}</span>
                  <span className={`alert-status status-${alert.state}`}>
                    {alert.state}
                  </span>
                </div>
                <div className="alert-labels">
                  {Object.entries(alert.labels || {}).map(
                    ([key, value]) =>
                      key !== "alertname" && (
                        <span key={key} className="label-tag">
                          {key}: {value}
                        </span>
                      )
                  )}
                </div>
                {alert.annotations?.description && (
                  <div className="alert-description">
                    {alert.annotations.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CPU Usage by Pod */}
      {metrics?.cpuUsage?.length > 0 && (
        <div className="metrics-section">
          <h3>CPU Usage by Pod</h3>
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Pod</th>
                  <th>CPU Usage</th>
                </tr>
              </thead>
              <tbody>
                {metrics.cpuUsage.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.metric?.pod || "Unknown"}</td>
                    <td>{formatMetricValue(item.value?.[1])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Memory Usage by Pod */}
      {metrics?.memoryUsage?.length > 0 && (
        <div className="metrics-section">
          <h3>Memory Usage by Pod</h3>
          <div className="metrics-table">
            <table>
              <thead>
                <tr>
                  <th>Pod</th>
                  <th>Memory Usage</th>
                </tr>
              </thead>
              <tbody>
                {metrics.memoryUsage.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.metric?.pod || "Unknown"}</td>
                    <td>{formatMetricValue(item.value?.[1])}B</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Targets Section */}
      <div className="targets-section">
        <h3>Scrape Targets ({targets.length})</h3>
        <div className="targets-grid">
          {targets.slice(0, 10).map((target, idx) => (
            <div key={idx} className={`target-item target-${target.health}`}>
              <div className="target-job">{target.labels?.job}</div>
              <div className="target-instance">{target.labels?.instance}</div>
              <div className={`target-health health-${target.health}`}>
                {target.health}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrometheusMetrics;
