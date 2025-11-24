import express from "express";
import axios from "axios";

const router = express.Router();

const SERVICES_TO_MONITOR = [
  { name: "Portal CECRE", url: "https://portal.cecre.net" },
];

// Check service status
router.get("/status", async (req, res) => {
  try {
    const results = await Promise.all(
      SERVICES_TO_MONITOR.map(async (service) => {
        const startTime = Date.now();
        try {
          const response = await axios.get(service.url, {
            timeout: 10000,
            validateStatus: () => true, // Accept any status
          });

          const latency = Date.now() - startTime;

          return {
            name: service.name,
            url: service.url,
            status:
              response.status >= 200 && response.status < 400 ? "UP" : "DOWN",
            statusCode: response.status,
            latency,
            timestamp: new Date().toISOString(),
          };
        } catch (error) {
          const latency = Date.now() - startTime;
          return {
            name: service.name,
            url: service.url,
            status: "DOWN",
            statusCode: 0,
            latency,
            error: error.message,
            timestamp: new Date().toISOString(),
          };
        }
      })
    );

    res.json({ services: results });
  } catch (error) {
    console.error("Service status error:", error.message);
    res.status(500).json({
      error: "Failed to check service status",
      message: error.message,
    });
  }
});

// Health check for specific URL
router.post("/check", async (req, res) => {
  const startTime = Date.now();
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true,
    });

    const latency = Date.now() - startTime;

    res.json({
      url,
      status: response.status >= 200 && response.status < 400 ? "UP" : "DOWN",
      statusCode: response.status,
      latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latency = Date.now() - startTime;
    res.json({
      url: req.body.url,
      status: "DOWN",
      statusCode: 0,
      latency,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
