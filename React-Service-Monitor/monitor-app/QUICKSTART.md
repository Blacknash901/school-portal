# CECRE Monitoring - Quick Start Guide

## Running Locally with Docker Compose

The fastest way to get started:

```bash
# Install dependencies
npm install

# Start all services
npm run docker:up

# Access the app at http://localhost:5173
```

This will start:

- **Frontend** at http://localhost:5173
- **Backend API** at http://localhost:3001
- **Prometheus** at http://localhost:9090
- **Grafana** at http://localhost:3000 (admin/admin123)

## What You Get

### 📊 Dashboard View

- Service status for portal.cecre.net
- Real-time Prometheus metrics
- Kubernetes cluster overview

### 📈 Prometheus Tab

- CPU and Memory usage by pod
- Active alerts
- Scrape targets status
- Custom metrics queries

### 📉 Grafana Tab

- Pre-loaded dashboards
- Dashboard data export
- No need to access Grafana directly

### ☸️ Kubernetes Tab

- Cluster information
- Nodes status
- Pods listing
- Services and Deployments
- Recent events

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Kubernetes deployment instructions.

## Key Features

✅ **Persistent Storage**: All metrics and dashboards saved to EBS volumes
✅ **S3 Backups**: Automated daily backups to S3
✅ **Pre-configured Alerts**: CPU, Memory, Pod crashes
✅ **Auto-scaling Ready**: Runs in Kubernetes with multiple replicas
✅ **No Manual Setup**: Dashboards and datasources pre-loaded

## Environment Variables

Create `.env` file (see `.env.example`):

```bash
VITE_API_URL=http://localhost:3001
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000
```

## Stopping Services

```bash
npm run docker:down
```

## Next Steps

1. Customize monitored URLs in `src/config/urls.js`
2. Add custom Prometheus queries in `src/config/urls.js`
3. Create custom Grafana dashboards
4. Deploy to Kubernetes (see DEPLOYMENT.md)
