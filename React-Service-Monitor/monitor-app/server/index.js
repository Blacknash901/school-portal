import express from "express";
import cors from "cors";
import axios from "axios";
import { createProxyMiddleware } from "http-proxy-middleware";
import k8s from "@kubernetes/client-node";
import prometheusRoutes from "./routes/prometheus.js";
import grafanaRoutes from "./routes/grafana.js";
import servicesRoutes from "./routes/services.js";

const app = express();
const PORT = process.env.PORT || 3001;

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Monitor API server running on port ${PORT}`);
});
