// HTTPS-enabled server for School Portal
const https = require("https");
const http = require("express")();
const fs = require("fs");
const path = require("path");

// Import the main Express app from server.js
// Since server.js calls app.listen(), we need to export the app instead
// For now, we'll duplicate the necessary code

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const cors = require("cors");
const Sentry = require("@sentry/node");
const client = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);

// Load certificates
const certPath =
  process.env.CERT_PATH || path.join(__dirname, "certs", "cert.pem");
const keyPath =
  process.env.KEY_PATH || path.join(__dirname, "certs", "key.pem");

// Check if certificates exist
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error("❌ Certificates not found!");
  console.error(`   Cert: ${certPath}`);
  console.error(`   Key: ${keyPath}`);
  console.error("\n💡 Generate certificates:");
  console.error("   openssl req -x509 -newkey rsa:4096 -nodes \\");
  console.error("     -keyout certs/key.pem -out certs/cert.pem \\");
  console.error('     -days 365 -subj "/C=CR/ST=SanJose/O=CECRE/CN=localhost"');
  process.exit(1);
}

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || "development",
  });
}

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
        : false,
    hsts:
      process.env.NODE_ENV === "production"
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
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
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [process.env.FRONTEND_URL || "https://portal.cecre.net"]
      : true, // Allow all in development
  credentials: true,
};

app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// Prometheus metrics endpoint (MUST be first, before any other middleware)
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Health check endpoints (before static files)
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Metrics tracking middleware
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

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from React build
app.use(express.static(path.join(__dirname, "build")));

// Serve React app for all other routes
app.use((req, res, next) => {
  const filePath = path.join(__dirname, "build", req.path);

  // If it's a request for index.html or a route (no file extension), serve index.html
  if (!path.extname(req.path) || req.path === "/") {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  } else if (fs.existsSync(filePath)) {
    next();
  } else {
    // File doesn't exist, serve 404 page if it exists
    const notFoundPath = path.join(__dirname, "build", "404.html");
    if (fs.existsSync(notFoundPath)) {
      res.status(404).sendFile(notFoundPath);
    } else {
      res.status(404).send("404 - Page Not Found");
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  // If it's a file not found error, serve 404 page
  if (err.status === 404 || err.statusCode === 404) {
    const notFoundPath = path.join(__dirname, "build", "404.html");
    if (fs.existsSync(notFoundPath)) {
      return res.status(404).sendFile(notFoundPath);
    }
  }

  // Log to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : "Internal Server Error",
    ...(isDevelopment && { stack: err.stack }),
  });
});

// HTTPS Options
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

// Create HTTPS server
https.createServer(httpsOptions, app).listen(HTTPS_PORT, "0.0.0.0", () => {
  console.log("");
  console.log("🔒 ===== HTTPS SERVER READY =====");
  console.log(`🌐 Local: https://localhost:${HTTPS_PORT}`);
  console.log(`📱 Network: https://YOUR_IP:${HTTPS_PORT}`);
  console.log(`🏢 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");
  console.log("⚠️  Note: Self-signed certificate will show browser warning");
  console.log('   Click "Advanced" → "Proceed to localhost" to continue');
  console.log("================================");
  console.log("");
});

// Optional: HTTP to HTTPS redirect (except for /metrics for Prometheus)
const redirectApp = express();

// Allow /metrics endpoint on HTTP for Prometheus scraping
redirectApp.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Redirect all other HTTP traffic to HTTPS
redirectApp.use((req, res) => {
  const host = req.headers.host?.split(":")[0];
  res.redirect(301, `https://${host}:${HTTPS_PORT}${req.url}`);
});

redirectApp.listen(PORT, "0.0.0.0", () => {
  console.log(
    `↗️  HTTP redirect: http://0.0.0.0:${PORT} → https://...:${HTTPS_PORT}`
  );
  console.log(
    `📊 Metrics available: http://0.0.0.0:${PORT}/metrics (HTTP only, for Prometheus)`
  );
  console.log("");
});
