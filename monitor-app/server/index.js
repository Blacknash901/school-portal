import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prometheusRoutes from "./routes/prometheus.js";
import grafanaRoutes from "./routes/grafana.js";
import servicesRoutes from "./routes/services.js";

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, "..", "dist");
const hasFrontendBuild = fs.existsSync(distPath);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/prometheus", prometheusRoutes);
app.use("/api/grafana", grafanaRoutes);
app.use("/api/services", servicesRoutes);

// Kubernetes routes - optional for EC2 deployment
// Uncomment if running on Kubernetes/EKS
// import kubernetesRoutes from './routes/kubernetes.js';
// app.use('/api/kubernetes', kubernetesRoutes);

if (hasFrontendBuild) {
  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
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
