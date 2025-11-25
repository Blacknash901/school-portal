const express = require("express");
const { ClientSecretCredential } = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const {
  TokenCredentialAuthenticationProvider,
} = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials");

const app = express();
app.use(express.json());

// Azure AD Configuration from environment variables
const tenantId = process.env.AZURE_TENANT_ID;
const clientId = process.env.AZURE_CLIENT_ID;
const clientSecret = process.env.AZURE_CLIENT_SECRET;
const emailTo = process.env.EMAIL_TO || "portal_status_notification@cecre.net";

if (!tenantId || !clientId || !clientSecret) {
  console.error(
    "ERROR: Missing required environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)"
  );
  process.exit(1);
}

// Initialize Microsoft Graph client
const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
const authProvider = new TokenCredentialAuthenticationProvider(credential, {
  scopes: ["https://graph.microsoft.com/.default"],
});
const graphClient = Client.initWithMiddleware({ authProvider });

/**
 * Format alert as HTML email
 */
function formatAlertEmail(alert, isCritical = false) {
  const status = alert.status === "firing" ? "🔥 FIRING" : "✅ RESOLVED";
  const severity = alert.labels.severity || "unknown";
  const alertname = alert.labels.alertname || "Unknown Alert";
  const summary = alert.annotations.summary || "No summary available";
  const description =
    alert.annotations.description || "No description available";
  const instance = alert.labels.instance || "N/A";
  const startsAt = new Date(alert.startsAt).toLocaleString();

  const criticalStyle = isCritical
    ? "background-color: #ff0000; color: white; padding: 20px;"
    : "";
  const criticalPrefix = isCritical ? "🚨 [CRITICAL] " : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="${criticalStyle}">
        <h1>${criticalPrefix}${alertname}</h1>
      </div>
      <div style="padding: 20px; background-color: #f5f5f5;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Status:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Severity:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${severity.toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Summary:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${summary}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Description:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${description}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #ddd;">Instance:</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${instance}</td>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Started At:</td>
            <td style="padding: 10px;">${startsAt}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 15px; background-color: white; border-left: 4px solid #007bff;">
          <p><strong>Quick Links:</strong></p>
          <ul>
            <li><a href="https://portal.cecre.net/prometheus">Prometheus</a></li>
            <li><a href="https://portal.cecre.net/grafana">Grafana Dashboard</a></li>
            <li><a href="https://portal.cecre.net/alertmanager">Alertmanager</a></li>
          </ul>
        </div>
      </div>
      <div style="padding: 10px; text-align: center; font-size: 12px; color: #666;">
        CECRE Portal Monitoring System | Automated Alert
      </div>
    </div>
  `;
}

/**
 * Send email via Microsoft Graph API
 */
async function sendEmail(subject, htmlContent) {
  const message = {
    subject: subject,
    body: {
      contentType: "HTML",
      content: htmlContent,
    },
    toRecipients: [
      {
        emailAddress: {
          address: emailTo,
        },
      },
    ],
  };

  try {
    // Send email using the service account
    // Note: The Azure AD app needs Mail.Send permission and the service account must have a mailbox
    await graphClient.api("/users/" + emailTo + "/sendMail").post({ message });

    console.log(`✅ Email sent successfully: ${subject}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
}

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      tenantId: tenantId ? "✓ configured" : "✗ missing",
      clientId: clientId ? "✓ configured" : "✗ missing",
      clientSecret: clientSecret ? "✓ configured" : "✗ missing",
      emailTo: emailTo,
    },
  });
});

/**
 * Webhook endpoint for Alertmanager (normal alerts)
 */
app.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("📨 Received webhook:", JSON.stringify(payload, null, 2));

    if (!payload.alerts || payload.alerts.length === 0) {
      return res.status(400).json({ error: "No alerts in payload" });
    }

    // Process each alert
    for (const alert of payload.alerts) {
      const alertname = alert.labels.alertname || "Unknown Alert";
      const subject = `[CECRE Portal] ${alertname}`;
      const htmlContent = formatAlertEmail(alert, false);

      await sendEmail(subject, htmlContent);
    }

    res.json({ status: "success", alertsSent: payload.alerts.length });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Webhook endpoint for critical alerts
 */
app.post("/webhook/critical", async (req, res) => {
  try {
    const payload = req.body;
    console.log(
      "🚨 Received CRITICAL webhook:",
      JSON.stringify(payload, null, 2)
    );

    if (!payload.alerts || payload.alerts.length === 0) {
      return res.status(400).json({ error: "No alerts in payload" });
    }

    // Process each alert
    for (const alert of payload.alerts) {
      const alertname = alert.labels.alertname || "Unknown Alert";
      const subject = `🚨 [CRITICAL] ${alertname}`;
      const htmlContent = formatAlertEmail(alert, true);

      await sendEmail(subject, htmlContent);
    }

    res.json({ status: "success", criticalAlertsSent: payload.alerts.length });
  } catch (error) {
    console.error("Error processing critical webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Alertmanager webhook server running on port ${PORT}`);
  console.log(`📧 Sending emails to: ${emailTo}`);
  console.log(`🔐 Using Azure AD Tenant: ${tenantId}`);
});
