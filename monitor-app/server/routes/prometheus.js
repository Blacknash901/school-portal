import express from "express";
import axios from "axios";

const router = express.Router();

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || "http://prometheus:9090";

// Query Prometheus
router.post("/query", async (req, res) => {
  try {
    const { query, time } = req.body;
    const params = { query };
    if (time) params.time = time;

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
      params,
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Prometheus query error:", error.message);
    res.status(500).json({
      error: "Failed to query Prometheus",
      message: error.message,
    });
  }
});

// Query range from Prometheus
router.post("/query_range", async (req, res) => {
  try {
    const { query, start, end, step } = req.body;
    const params = { query, start, end, step: step || "15s" };

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params,
      timeout: 15000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Prometheus query_range error:", error.message);
    res.status(500).json({
      error: "Failed to query Prometheus range",
      message: error.message,
    });
  }
});

// Get active alerts
router.get("/alerts", async (req, res) => {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/alerts`, {
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Prometheus alerts error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Prometheus alerts",
      message: error.message,
    });
  }
});

// Get targets
router.get("/targets", async (req, res) => {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/targets`, {
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Prometheus targets error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Prometheus targets",
      message: error.message,
    });
  }
});

// Get metrics metadata
router.get("/metadata", async (req, res) => {
  try {
    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/metadata`, {
      timeout: 10000,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Prometheus metadata error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Prometheus metadata",
      message: error.message,
    });
  }
});

export default router;
