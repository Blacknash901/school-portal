import React from "react";
import {
  logEvent,
  LOG_TYPES,
  getS3ConfigStatus,
  flushLogsToS3,
} from "../utils/logger";

/**
 * Debug component to test S3 logging
 * Add this temporarily to your app to test logging
 */
export default function S3LoggingDebug() {
  const config = getS3ConfigStatus();

  const testLogging = () => {
    console.log("Testing S3 logging...");
    logEvent(LOG_TYPES.AUTH, "Test authentication log", {
      test: true,
      timestamp: new Date().toISOString(),
    });
  };

  const testAppLogging = () => {
    console.log("Testing app logging...");
    logEvent(LOG_TYPES.APP, "Test app click", {
      appId: "test-app",
      appName: "Test Application",
      test: true,
    });
  };

  const flushLogs = async () => {
    console.log("Flushing logs to S3...");
    await flushLogsToS3();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <h4>S3 Logging Debug</h4>
      <div>
        <strong>Configuration:</strong>
        <ul>
          <li>Bucket: {config.bucketName || "NOT SET"}</li>
          <li>Region: {config.region}</li>
          <li>Configured: {config.configured ? "YES" : "NO"}</li>
          <li>Pending Logs: {config.pendingLogs}</li>
        </ul>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
        <button onClick={testLogging} style={{ padding: "5px" }}>
          Test Auth Log
        </button>
        <button onClick={testAppLogging} style={{ padding: "5px" }}>
          Test App Log
        </button>
        <button onClick={flushLogs} style={{ padding: "5px" }}>
          Flush Logs
        </button>
      </div>
    </div>
  );
}
