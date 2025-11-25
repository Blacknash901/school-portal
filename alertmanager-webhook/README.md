# Alertmanager Webhook Service

A Node.js microservice that receives webhooks from Prometheus Alertmanager and sends email notifications via Microsoft Graph API using Azure AD OAuth2 authentication.

## 🎯 Purpose

This service eliminates the need for SMTP passwords by using Azure AD application authentication with client credentials flow. It's more secure, maintainable, and follows Microsoft's recommended practices.

## 🏗️ Architecture

```
Alertmanager → Webhook Service → Azure AD → Microsoft Graph API → Exchange Online → Email
```

## 🚀 Features

- ✅ OAuth2 authentication (no passwords!)
- ✅ HTML-formatted email alerts
- ✅ Separate handling for critical vs warning alerts
- ✅ Health check endpoint
- ✅ Structured logging
- ✅ Multi-platform Docker image (AMD64/ARM64)

## 📋 Requirements

- Azure AD tenant
- Registered Azure AD application with `Mail.Send` permission
- Node.js 18+ (for local development)
- Docker (for containerized deployment)

## 🔐 Required Environment Variables

The service requires these Azure AD OAuth2 credentials:

| Variable              | Description             | GitHub Secret Name       |
| --------------------- | ----------------------- | ------------------------ |
| `AZURE_TENANT_ID`     | Your Azure AD tenant ID | `AZURE_TENANT_ID`        |
| `AZURE_CLIENT_ID`     | Application (client) ID | `AZURE_CLIENT_ID_AM`     |
| `AZURE_CLIENT_SECRET` | Client secret value     | `AZURE_CLIENT_SECRET_AM` |

**Note:** GitHub Secrets use `_AM` suffix to distinguish Alertmanager credentials from portal app credentials. The Ansible deployment automatically maps these to the correct environment variable names (without suffix) when creating the Kubernetes secret.

```yaml
# Kubernetes secret created by Ansible
apiVersion: v1
kind: Secret
metadata:
  name: alertmanager-webhook-secrets
data:
  AZURE_TENANT_ID: "{{ azure_tenant_id | b64encode }}"
  AZURE_CLIENT_ID: "{{ azure_client_id_am | b64encode }}" # From AZURE_CLIENT_ID_AM
  AZURE_CLIENT_SECRET: "{{ azure_client_secret_am | b64encode }}" # From AZURE_CLIENT_SECRET_AM
```

## 🏃 Local Development

### Setup

```bash
# Install dependencies
npm install

# Create .env file
cat > .env <<EOF
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
EMAIL_TO=portal_status_notification@cecre.net
PORT=8080
EOF

# Start server
npm start
```

### Test Webhook

```bash
# Send test alert
curl -X POST http://localhost:8080/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "alerts": [{
      "status": "firing",
      "labels": {
        "alertname": "HighCPU",
        "severity": "warning",
        "instance": "server-01"
      },
      "annotations": {
        "summary": "High CPU usage detected",
        "description": "CPU usage is above 80%"
      },
      "startsAt": "2025-11-24T10:00:00Z"
    }]
  }'

# Expected response:
{"status":"success","alertsSent":1}
```

### Health Check

```bash
curl http://localhost:8080/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "config": {
    "tenantId": "✓ configured",
    "clientId": "✓ configured",
    "clientSecret": "✓ configured",
    "emailTo": "portal_status_notification@cecre.net"
  }
}
```

## 🐳 Docker Build

### Build Multi-Platform Image

```bash
# Build for both AMD64 and ARM64
docker buildx build --platform linux/amd64,linux/arm64 \
  -t blacknash/alertmanager-webhook:latest \
  --push .
```

### Run Container

```bash
docker run -d \
  -p 8080:8080 \
  -e AZURE_TENANT_ID=your-tenant-id \
  -e AZURE_CLIENT_ID=your-client-id \
  -e AZURE_CLIENT_SECRET=your-client-secret \
  -e EMAIL_TO=portal_status_notification@cecre.net \
  --name alertmanager-webhook \
  blacknash/alertmanager-webhook:latest
```

## 📦 Kubernetes Deployment

The service is deployed automatically via `monitor-app/k8s/alertmanager-deployment.yaml`.

### Manual Deployment

```bash
# Create secrets
kubectl create secret generic alertmanager-webhook-secrets \
  --from-literal=AZURE_TENANT_ID=your-tenant-id \
  --from-literal=AZURE_CLIENT_ID=your-client-id \
  --from-literal=AZURE_CLIENT_SECRET=your-client-secret \
  --from-literal=EMAIL_TO=portal_status_notification@cecre.net \
  -n monitoring

# Deploy
kubectl apply -f ../monitor-app/k8s/alertmanager-deployment.yaml
```

### Check Status

```bash
# Check pod
kubectl get pods -n monitoring | grep alertmanager-webhook

# View logs
kubectl logs -n monitoring deployment/alertmanager-webhook -f
```

## 📧 Email Format

### Warning Alert Example

```
Subject: [CECRE Portal] HighCPU

┌────────────────────────────────────┐
│ HighCPU                            │
├────────────────────────────────────┤
│ Status: 🔥 FIRING                  │
│ Severity: WARNING                  │
│ Summary: High CPU usage detected   │
│ Description: CPU usage above 80%   │
│ Instance: server-01                │
│ Started At: 11/24/2025, 10:00:00   │
├────────────────────────────────────┤
│ Quick Links:                       │
│ • Prometheus                       │
│ • Grafana Dashboard                │
│ • Alertmanager                     │
└────────────────────────────────────┘
```

### Critical Alert Example

```
Subject: 🚨 [CRITICAL] ServiceDown

┌────────────────────────────────────┐
│ 🚨 CRITICAL ALERT                  │
│ ServiceDown                        │
├────────────────────────────────────┤
│ Status: 🔥 FIRING                  │
│ Summary: Service is down           │
│ ... (same format as above)         │
└────────────────────────────────────┘
```

## 🔌 API Endpoints

### POST /webhook

Receives normal alerts from Alertmanager.

**Request:**

```json
{
  "alerts": [
    {
      "status": "firing|resolved",
      "labels": {
        "alertname": "string",
        "severity": "warning|critical"
      },
      "annotations": {
        "summary": "string",
        "description": "string"
      },
      "startsAt": "ISO8601 timestamp"
    }
  ]
}
```

**Response:**

```json
{
  "status": "success",
  "alertsSent": 1
}
```

### POST /webhook/critical

Receives critical alerts (higher priority formatting).

Same request/response format as `/webhook`.

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "config": {
    "tenantId": "✓ configured",
    "clientId": "✓ configured",
    "clientSecret": "✓ configured",
    "emailTo": "portal_status_notification@cecre.net"
  }
}
```

## 🐛 Troubleshooting

### Error: "Missing required environment variables"

Ensure all three Azure AD variables are set:

- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

### Error: "401 Unauthorized"

Causes:

- Incorrect client secret
- Client secret expired
- App not granted API permissions

Fix:

1. Verify client secret in Azure AD
2. Check permissions granted with admin consent
3. Regenerate client secret if needed

### Error: "403 Forbidden"

Causes:

- `Mail.Send` permission not granted
- Admin consent not given

Fix:

1. Go to Azure AD → App registrations → API permissions
2. Verify `Mail.Send` has admin consent (green checkmark)

### Emails not received

Check:

1. Pod logs: `kubectl logs -n monitoring deployment/alertmanager-webhook`
2. Spam/Junk folder
3. Verify `EMAIL_TO` address is correct
4. Check Azure AD audit logs for API calls

## 📊 Monitoring

### Logs

```bash
# Real-time logs
kubectl logs -n monitoring deployment/alertmanager-webhook -f

# Search for errors
kubectl logs -n monitoring deployment/alertmanager-webhook | grep -i error
```

### Metrics

Look for these log messages:

- `✅ Email sent successfully: [subject]` - Success
- `❌ Error sending email: [error]` - Failure
- `📨 Received webhook:` - Alert received
- `🚨 Received CRITICAL webhook:` - Critical alert received

## 📚 Dependencies

- **@azure/identity**: Azure AD authentication
- **@microsoft/microsoft-graph-client**: Microsoft Graph API client
- **express**: HTTP server

## 🔐 Security

- ✅ No passwords stored (OAuth2 client credentials)
- ✅ Secrets managed via Kubernetes secrets
- ✅ TLS encryption for API calls
- ✅ Minimal permissions (`Mail.Send` only)

## 📄 License

MIT License - See main repository LICENSE file.

## 🤝 Contributing

See main repository CONTRIBUTING.md for guidelines.

---

**Part of the CECRE Portal & Monitoring System**
