/**
 * S3 Logging API client
 * Efficiently batches and uploads logs to AWS S3 bucket
 */

const S3_CONFIG = {
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME,
  region: process.env.REACT_APP_S3_REGION || "us-east-1",
  accessKeyId: process.env.REACT_APP_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_S3_SECRET_ACCESS_KEY,
};

// Batch configuration for efficient uploads
const BATCH_CONFIG = {
  maxBatchSize: 50, // Maximum logs per batch
  maxWaitTime: 30000, // 30 seconds max wait time
  immediateUploadTypes: ["AUTH", "ERROR"], // Upload immediately for these types
};

let logBatch = [];
let batchTimeout = null;

/**
 * Generate S3 object key for logs
 * Format: logs/YYYY/MM/DD/app-logs-HH-MM-SS.json
 */
function generateS3Key() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `logs/${year}/${month}/${day}/app-logs-${hour}-${minute}-${second}.json`;
}

/**
 * Upload logs batch to S3
 * @param {Array} logs - Array of log entries
 * @returns {Promise<boolean>} - Success status
 */
async function uploadLogsToS3(logs) {
  if (!logs || logs.length === 0) {
    return true;
  }

  // Silently skip if S3 not configured
  if (
    !S3_CONFIG.bucketName ||
    !S3_CONFIG.accessKeyId ||
    !S3_CONFIG.secretAccessKey
  ) {
    return false;
  }

  try {
    const s3Key = generateS3Key();

    const logData = {
      logs: logs,
      metadata: {
        uploadTimestamp: new Date().toISOString(),
        totalLogs: logs.length,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: sessionStorage.getItem("session-id") || "unknown",
      },
    };

    const response = await fetch("/api/s3-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketName: S3_CONFIG.bucketName,
        region: S3_CONFIG.region,
        key: s3Key,
        data: logData,
        // No credentials needed - server will use IAM role
      }),
    });

    if (!response.ok) {
      // Silently fail - S3 logging is optional
      return false;
    }

    return true;
  } catch (error) {
    // Silently fail - S3 logging is optional
    return false;
  }
}

/**
 * Add log to batch and handle upload timing
 * @param {Object} logEntry - Single log entry
 */
export function addLogToBatch(logEntry) {
  console.log("Adding log to batch:", logEntry.type, logEntry.message);
  logBatch.push(logEntry);

  // Upload immediately for critical events
  if (BATCH_CONFIG.immediateUploadTypes.includes(logEntry.type)) {
    console.log("Immediate upload triggered for:", logEntry.type);
    uploadBatch();
    return;
  }

  // Upload when batch is full
  if (logBatch.length >= BATCH_CONFIG.maxBatchSize) {
    console.log("Batch size reached, uploading:", logBatch.length);
    uploadBatch();
    return;
  }

  // Set timeout for batch upload
  if (!batchTimeout) {
    console.log("Setting batch timeout for", BATCH_CONFIG.maxWaitTime, "ms");
    batchTimeout = setTimeout(() => {
      console.log("Batch timeout reached, uploading:", logBatch.length);
      uploadBatch();
    }, BATCH_CONFIG.maxWaitTime);
  }
}

/**
 * Upload current batch to S3
 */
async function uploadBatch() {
  if (logBatch.length === 0) {
    return;
  }

  const logsToUpload = [...logBatch];
  logBatch = [];

  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }

  const success = await uploadLogsToS3(logsToUpload);

  if (!success) {
    // Store locally as backup
    const localLogs = JSON.parse(
      sessionStorage.getItem("app-logs-backup") || "[]"
    );
    localLogs.push(...logsToUpload);
    sessionStorage.setItem("app-logs-backup", JSON.stringify(localLogs));
  }
}

/**
 * Force upload any pending logs
 */
export async function flushLogsToS3() {
  if (batchTimeout) {
    clearTimeout(batchTimeout);
    batchTimeout = null;
  }
  await uploadBatch();
}

/**
 * Get S3 configuration status
 */
export function getS3ConfigStatus() {
  return {
    configured: !!(
      S3_CONFIG.bucketName &&
      S3_CONFIG.accessKeyId &&
      S3_CONFIG.secretAccessKey
    ),
    bucketName: S3_CONFIG.bucketName,
    region: S3_CONFIG.region,
    pendingLogs: logBatch.length,
  };
}

/**
 * Initialize session ID for tracking
 */
export function initializeSession() {
  if (!sessionStorage.getItem("session-id")) {
    sessionStorage.setItem(
      "session-id",
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );
  }
}
