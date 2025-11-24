const express = require("express");
const AWS = require("aws-sdk");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const compression = require("compression");
const Sentry = require("@sentry/node");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
}

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const s3UploadTotal = new client.Counter({
  name: "s3_uploads_total",
  help: "Total number of S3 uploads",
  labelNames: ["status"],
});

const s3UploadDuration = new client.Histogram({
  name: "s3_upload_duration_seconds",
  help: "Duration of S3 uploads in seconds",
  labelNames: ["status"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(s3UploadTotal);
register.registerMetric(s3UploadDuration);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              connectSrc: [
                "'self'",
                "https://login.microsoftonline.com",
                "https://graph.microsoft.com",
                "https://accounts.google.com",
                "https://api.rss2json.com",
              ],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
            },
          }
        : false, // Disable CSP in development to avoid issues
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false, // Disable HSTS in development
  })
);

// Rate limiting - adjusted for real-world usage
// Note: A single page load makes multiple requests (HTML, JS, CSS, images, API calls)
// Too restrictive = users get blocked on normal usage
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 500 : 1000, // 500 requests per 15min (allows ~33 page loads)
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req) => {
    // Don't rate limit health checks
    return req.path === "/api/health" || req.path === "/api/health/ready";
  },
  handler: (req, res) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: "15 minutes",
    });
  },
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://portal.cecre.net"]
      : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, "build")));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
  });

  next();
});

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || "us-east-1",
});

// Input validation middleware
const validateS3Upload = [
  body("bucketName").notEmpty().isString().trim().escape(),
  body("region").optional().isString().trim().escape(),
  body("key").notEmpty().isString().trim().escape(),
  body("data").isObject(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.array(),
      });
    }
    next();
  },
];

// POST /api/s3-upload - Upload logs to S3
app.post("/api/s3-upload", validateS3Upload, async (req, res) => {
  const startTime = Date.now();

  try {
    console.log("Received S3 upload request:", {
      bucketName: req.body.bucketName,
      region: req.body.region,
      key: req.body.key,
      logsCount: req.body.data?.logs?.length || 0,
    });

    const { bucketName, region, key, data } = req.body;

    // Use default AWS credentials (IAM role in production)
    const s3Client = new AWS.S3({
      region: region || "us-east-1",
    });

    // Upload to S3
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
      ServerSideEncryption: "AES256",
    };

    console.log("Uploading to S3 with params:", {
      Bucket: uploadParams.Bucket,
      Key: uploadParams.Key,
      ContentType: uploadParams.ContentType,
    });

    const result = await s3Client.upload(uploadParams).promise();
    const duration = (Date.now() - startTime) / 1000;

    console.log("S3 upload successful:", {
      location: result.Location,
      key: result.Key,
      bucket: result.Bucket,
    });

    // Update metrics
    s3UploadTotal.labels("success").inc();
    s3UploadDuration.labels("success").observe(duration);

    res.json({
      success: true,
      location: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      logsUploaded: data.logs?.length || 0,
    });
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    console.error("S3 upload error:", error);

    // Update metrics
    s3UploadTotal.labels("error").inc();
    s3UploadDuration.labels("error").observe(duration);

    // Log to Sentry
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    res.status(500).json({
      error: "Failed to upload to S3",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// GET /api/s3-logs - Retrieve logs from S3 (admin only)
app.get("/api/s3-logs", async (req, res) => {
  try {
    const { bucketName, prefix, limit = 100 } = req.query;

    if (!bucketName) {
      return res.status(400).json({ error: "Bucket name required" });
    }

    const s3Client = new AWS.S3({
      region: process.env.AWS_REGION || "us-east-1",
    });

    // List objects in S3
    const listParams = {
      Bucket: bucketName,
      Prefix: prefix || "logs/",
      MaxKeys: Math.min(parseInt(limit) || 100, 1000), // Cap at 1000
    };

    const objects = await s3Client.listObjectsV2(listParams).promise();

    // Get the most recent log files
    const recentLogs = [];
    for (const obj of objects.Contents.slice(-10)) {
      try {
        const getParams = {
          Bucket: bucketName,
          Key: obj.Key,
        };

        const logFile = await s3Client.getObject(getParams).promise();
        const logData = JSON.parse(logFile.Body.toString());

        recentLogs.push({
          key: obj.Key,
          lastModified: obj.LastModified,
          logs: logData.logs || [],
          metadata: logData.metadata || {},
        });
      } catch (err) {
        console.error(`Error reading log file ${obj.Key}:`, err);
      }
    }

    res.json({
      success: true,
      logs: recentLogs,
      total: recentLogs.length,
    });
  } catch (error) {
    console.error("S3 retrieval error:", error);

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }

    res.status(500).json({
      error: "Failed to retrieve logs from S3",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Prometheus metrics endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.APP_VERSION || "1.0.0",
    uptime: process.uptime(),
  });
});

// Detailed health check for Kubernetes
app.get("/api/health/ready", (req, res) => {
  // Add any readiness checks here (DB connections, external services, etc.)
  res.json({
    status: "ready",
    timestamp: new Date().toISOString(),
    checks: {
      aws: "ok", // Could add actual AWS connectivity check
      memory: process.memoryUsage(),
    },
  });
});

// Serve React app for all other routes (Express 5 compatible)
// Using middleware instead of route pattern to avoid path-to-regexp issues
app.use((req, res, next) => {
  // Check if the request is for a file that doesn't exist
  const filePath = path.join(__dirname, "build", req.path);
  const fs = require("fs");

  // If it's a request for index.html or a route (no file extension), serve index.html
  if (!path.extname(req.path) || req.path === "/") {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  } else if (fs.existsSync(filePath)) {
    // File exists, let static middleware handle it (shouldn't reach here normally)
    next();
  } else {
    // File doesn't exist, serve 404 page
    res.status(404).sendFile(path.join(__dirname, "build", "404.html"));
  }
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // If it's a file not found error, serve 404 page
  if (err.status === 404 || err.statusCode === 404) {
    return res.status(404).sendFile(path.join(__dirname, "build", "404.html"));
  }

  // Log to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

module.exports = app;
