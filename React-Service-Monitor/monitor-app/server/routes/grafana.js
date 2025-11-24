import express from "express";
import axios from "axios";

const router = express.Router();

const GRAFANA_URL = process.env.GRAFANA_URL || "http://grafana:3000";
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY || "";

// Create axios instance with auth
const grafanaClient = axios.create({
  baseURL: GRAFANA_URL,
  headers: GRAFANA_API_KEY
    ? {
        Authorization: `Bearer ${GRAFANA_API_KEY}`,
      }
    : {},
  timeout: 15000,
});

// Get all dashboards
router.get("/dashboards", async (req, res) => {
  try {
    const response = await grafanaClient.get("/api/search", {
      params: { type: "dash-db" },
    });

    res.json(response.data);
  } catch (error) {
    console.error("Grafana dashboards error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Grafana dashboards",
      message: error.message,
    });
  }
});

// Get specific dashboard by UID
router.get("/dashboard/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const response = await grafanaClient.get(`/api/dashboards/uid/${uid}`);

    res.json(response.data);
  } catch (error) {
    console.error("Grafana dashboard error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Grafana dashboard",
      message: error.message,
    });
  }
});

// Create dashboard snapshot
router.post("/snapshot", async (req, res) => {
  try {
    const { dashboard } = req.body;
    const response = await grafanaClient.post("/api/snapshots", {
      dashboard,
      name: `Snapshot ${new Date().toISOString()}`,
      expires: 0, // Never expires
    });

    res.json(response.data);
  } catch (error) {
    console.error("Grafana snapshot error:", error.message);
    res.status(500).json({
      error: "Failed to create Grafana snapshot",
      message: error.message,
    });
  }
});

// Get dashboard panels data
router.post("/dashboard/:uid/data", async (req, res) => {
  try {
    const { uid } = req.params;
    const { from, to } = req.body;

    // Get dashboard definition
    const dashResponse = await grafanaClient.get(`/api/dashboards/uid/${uid}`);
    const dashboard = dashResponse.data.dashboard;

    // Extract panel queries and fetch data
    const panelData = [];

    for (const panel of dashboard.panels || []) {
      if (panel.targets) {
        for (const target of panel.targets) {
          if (target.expr) {
            // This is a Prometheus query
            const queryParams = {
              query: target.expr,
              start: from || Math.floor(Date.now() / 1000) - 3600,
              end: to || Math.floor(Date.now() / 1000),
              step: "15s",
            };

            try {
              const prometheusUrl =
                process.env.PROMETHEUS_URL || "http://prometheus:9090";
              const dataResponse = await axios.get(
                `${prometheusUrl}/api/v1/query_range`,
                {
                  params: queryParams,
                  timeout: 10000,
                }
              );

              panelData.push({
                panelId: panel.id,
                panelTitle: panel.title,
                data: dataResponse.data,
              });
            } catch (err) {
              console.error(
                `Error fetching data for panel ${panel.id}:`,
                err.message
              );
            }
          }
        }
      }
    }

    res.json({
      dashboard: {
        uid: dashboard.uid,
        title: dashboard.title,
      },
      panels: panelData,
    });
  } catch (error) {
    console.error("Grafana dashboard data error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Grafana dashboard data",
      message: error.message,
    });
  }
});

// Proxy to Grafana (for embedding)
router.get("/embed/*", async (req, res) => {
  try {
    const path = req.params[0];
    const response = await grafanaClient.get(`/${path}`, {
      params: req.query,
    });

    res.send(response.data);
  } catch (error) {
    console.error("Grafana embed error:", error.message);
    res.status(500).json({
      error: "Failed to fetch Grafana content",
      message: error.message,
    });
  }
});

export default router;
