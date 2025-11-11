/**
 * Simple local logging system with S3 storage
 * Logs are saved in sessionStorage (per user session) and uploaded to S3.
 * Downloads are only available when errors occur.
 */

import {
  addLogToBatch,
  flushLogsToS3 as flushToS3,
  initializeSession,
  getS3ConfigStatus as getS3Status,
} from "../api/s3Logging";

export const LOG_TYPES = {
  AUTH: "AUTH",
  APP: "APP",
  ERROR: "ERROR",
  SYSTEM: "SYSTEM",
};

// Initialize session tracking
initializeSession();

/**
 * Add a structured log entry
 * @param {string} type - One of LOG_TYPES
 * @param {string} message - Short description
 * @param {object} data - Optional payload
 */
export function logEvent(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  const entry = { timestamp, type, message, ...data };

  // Save to session storage
  const logs = JSON.parse(sessionStorage.getItem("app-logs") || "[]");
  logs.push(entry);
  sessionStorage.setItem("app-logs", JSON.stringify(logs));

  // Add to S3 batch for upload
  addLogToBatch(entry);
}

/**
 * Helper to retrieve all logs (for admin debugging or export)
 */
export function getLogs() {
  return JSON.parse(sessionStorage.getItem("app-logs") || "[]");
}

/**
 * Clear logs manually
 */
export function clearLogs() {
  sessionStorage.removeItem("app-logs");
}

/**
 * Download logs as a JSON file (only for error reporting)
 * @param {string} filename - Optional filename prefix
 */
export function downloadLogs(filename = "error-logs") {
  const logs = getLogs();
  if (logs.length === 0) {
    console.warn("No logs to download");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fullFilename = `${filename}-${timestamp}.json`;

  const dataStr = JSON.stringify(logs, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log(`Downloaded ${logs.length} log entries as ${fullFilename}`);
}

/**
 * Check if S3 logging is available
 * @returns {boolean}
 */
export function isS3LoggingAvailable() {
  const config = getS3Status();
  return config.configured;
}

/**
 * Get S3 configuration status
 * @returns {Object}
 */
export function getS3ConfigStatus() {
  return getS3Status();
}

/**
 * Force upload all pending logs to S3
 * @returns {Promise<boolean>}
 */
export async function flushLogsToS3() {
  return await flushToS3();
}
