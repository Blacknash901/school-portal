import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prometheusRoutes from "./routes/prometheus.js";
import grafanaRoutes from "./routes/grafana.js";
import servicesRoutes from "./routes/services.js";
import kubernetesRoutes from "./routes/kubernetes.js";

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_PATH = process.env.BASE_PATH || ""; // Support /monitor base path in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "..", "dist");
const hasFrontendBuild = fs.existsSync(distPath);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (always at root for k8s probes)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount API routes with base path if configured
const apiPath = BASE_PATH ? `${BASE_PATH}/api` : "/api";
app.use(`${apiPath}/prometheus`, prometheusRoutes);
app.use(`${apiPath}/grafana`, grafanaRoutes);
app.use(`${apiPath}/services`, servicesRoutes);
app.use(`${apiPath}/kubernetes`, kubernetesRoutes);

if (hasFrontendBuild) {
  // Serve static files with base path
  if (BASE_PATH) {
    app.use(BASE_PATH, express.static(distPath));
  } else {
    app.use(express.static(distPath));
  }

  // Catch-all route for SPA (but only for HTML requests, not static assets)
  app.get("*", (req, res, next) => {
    // Skip API routes and static assets (js, css, images, fonts, etc.)
    if (
      req.path.includes("/api") ||
      req.path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  console.warn("Frontend build not found. Serving API-only responses.");
}

// Error handling middleware
app.use((err, req, res, _next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Monitor API server running on port ${PORT}`);
});
