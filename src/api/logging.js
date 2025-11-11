/**
 * Server-side logging API client
 * Sends logs to the server for centralized storage and analysis
 */

const LOGGING_API_URL = process.env.REACT_APP_LOGGING_API_URL || "/api/logs";

/**
 * Send logs to the server
 * @param {Array} logs - Array of log entries
 * @returns {Promise<boolean>} - Success status
 */
export async function sendLogsToServer(logs) {
  if (!logs || logs.length === 0) return true;

  try {
    const response = await fetch(LOGGING_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        logs: logs,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to send logs to server:", error);
    return false;
  }
}

/**
 * Send a single log entry to the server immediately
 * @param {Object} logEntry - Single log entry
 * @returns {Promise<boolean>} - Success status
 */
export async function sendLogEntry(logEntry) {
  return sendLogsToServer([logEntry]);
}

/**
 * Batch send logs to server (for efficiency)
 * @param {Array} logs - Array of log entries
 * @param {number} batchSize - Number of logs to send at once
 * @returns {Promise<boolean>} - Success status
 */
export async function batchSendLogs(logs, batchSize = 10) {
  if (!logs || logs.length === 0) return true;

  const batches = [];
  for (let i = 0; i < logs.length; i += batchSize) {
    batches.push(logs.slice(i, i + batchSize));
  }

  let allSuccessful = true;
  for (const batch of batches) {
    const success = await sendLogsToServer(batch);
    if (!success) allSuccessful = false;
  }

  return allSuccessful;
}
