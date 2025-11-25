/**
 * Service Monitor Component
 *
 * Monitors the uptime and latency of configured service URLs by performing
 * periodic health checks. Displays service status, response times, and historical
 * metrics in a visual dashboard.
 *
 * Features:
 * - Real-time health checks every 30 seconds
 * - Latency measurement and history (last 10 checks)
 * - Success/failure count tracking
 * - Visual status indicators (UP/DOWN)
 * - Average latency calculation
 * - Manual refresh capability
 *
 * @component
 */

import { useState, useEffect, useCallback } from "react";
import { MONITOR_URLS } from "../config/urls";
import "./ServiceMonitor.css";

const ServiceMonitor = () => {
  // Store current status of all monitored services
  const [services, setServices] = useState([]);

  // Track historical metrics for each service
  const [metrics, setMetrics] = useState({
    successCount: {}, // Count of successful checks per URL
    failureCount: {}, // Count of failed checks per URL
    latencyHistory: {}, // Array of last 10 latency measurements per URL
  });

  /**
   * Check the health of a single URL
   * Uses HEAD request with no-cors mode for local testing
   * Measures latency using performance.now()
   *
   * @param {string} url - The URL to check
   * @returns {Object} Service status object with url, status, latency, timestamp
   */
  const checkUrl = async (url) => {
    const startTime = performance.now();
    try {
      const response = await fetch(url, {
        method: "HEAD",
        mode: "no-cors", // Using no-cors for local testing
        cache: "no-cache",
      });
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);

      return {
        url,
        status: "UP",
        statusCode: response.status || "OK",
        latency: parseFloat(duration),
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (error) {
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      return {
        url,
        status: "DOWN",
        statusCode: "ERROR",
        latency: parseFloat(duration),
        error: error.message,
        timestamp: new Date().toLocaleTimeString(),
      };
    }
  };

  /**
   * Check all configured services in parallel
   * Updates both current service status and historical metrics
   * Maintains last 10 latency measurements per service
   */
  const checkAllServices = useCallback(async () => {
    console.log("Checking all services...");
    // Check all URLs concurrently for faster results
    const results = await Promise.all(MONITOR_URLS.map((url) => checkUrl(url)));

    setServices(results);

    // Update historical metrics (success/failure counts and latency)
    setMetrics((prev) => {
      const newMetrics = { ...prev };

      results.forEach((result) => {
        const url = result.url;

        // Update success/failure counts
        if (result.status === "UP") {
          newMetrics.successCount[url] =
            (newMetrics.successCount[url] || 0) + 1;
        } else {
          newMetrics.failureCount[url] =
            (newMetrics.failureCount[url] || 0) + 1;
        }

        // Update latency history (keep last 10 measurements)
        if (!newMetrics.latencyHistory[url]) {
          newMetrics.latencyHistory[url] = [];
        }
        newMetrics.latencyHistory[url].push(result.latency);
        if (newMetrics.latencyHistory[url].length > 10) {
          newMetrics.latencyHistory[url].shift();
        }
      });

      return newMetrics;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!isMounted) return;
      await checkAllServices();
    };

    // Initial check
    run();

    // Check every 30 seconds
    const interval = setInterval(run, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [checkAllServices]);

  const getAverageLatency = (url) => {
    const history = metrics.latencyHistory[url] || [];
    if (history.length === 0) return 0;
    const sum = history.reduce((acc, val) => acc + val, 0);
    return (sum / history.length).toFixed(2);
  };

  const getStatusClass = (status) => {
    return status === "UP" ? "status-up" : "status-down";
  };

  return (
    <div className="service-monitor">
      <header className="monitor-header">
        <h1>🔍 Service Status Monitor</h1>
        <p className="subtitle">
          Real-time uptime monitoring for your services
        </p>
        <button onClick={checkAllServices} className="refresh-btn">
          🔄 Refresh Now
        </button>
      </header>

      <div className="metrics-summary">
        <div className="metric-card">
          <h3>Total Services</h3>
          <p className="metric-value">{MONITOR_URLS.length}</p>
        </div>
        <div className="metric-card">
          <h3>Services Up</h3>
          <p className="metric-value success">
            {services.filter((s) => s.status === "UP").length}
          </p>
        </div>
        <div className="metric-card">
          <h3>Services Down</h3>
          <p className="metric-value error">
            {services.filter((s) => s.status === "DOWN").length}
          </p>
        </div>
      </div>

      <div className="services-list">
        {services.map((service, index) => (
          <div
            key={index}
            className={`service-card ${getStatusClass(service.status)}`}
          >
            <div className="service-header">
              <span className={`status-badge ${service.status.toLowerCase()}`}>
                {service.status === "UP" ? "✓" : "✗"} {service.status}
              </span>
              <span className="timestamp">{service.timestamp}</span>
            </div>

            <div className="service-url">
              <strong>URL:</strong> {service.url}
            </div>

            <div className="service-details">
              <div className="detail-item">
                <span className="label">Status Code:</span>
                <span className="value">{service.statusCode}</span>
              </div>
              <div className="detail-item">
                <span className="label">Current Latency:</span>
                <span className="value">{service.latency}s</span>
              </div>
              <div className="detail-item">
                <span className="label">Avg Latency:</span>
                <span className="value">{getAverageLatency(service.url)}s</span>
              </div>
            </div>

            <div className="service-metrics">
              <div className="metric-small">
                <span className="label">Success:</span>
                <span className="value">
                  {metrics.successCount[service.url] || 0}
                </span>
              </div>
              <div className="metric-small">
                <span className="label">Failures:</span>
                <span className="value">
                  {metrics.failureCount[service.url] || 0}
                </span>
              </div>
              <div className="metric-small">
                <span className="label">Checks:</span>
                <span className="value">
                  {(metrics.successCount[service.url] || 0) +
                    (metrics.failureCount[service.url] || 0)}
                </span>
              </div>
            </div>

            {service.error && (
              <div className="error-message">
                <strong>Error:</strong> {service.error}
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="monitor-footer">
        <p>
          Auto-refresh every 30 seconds | Last check:{" "}
          {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
};

export default ServiceMonitor;
