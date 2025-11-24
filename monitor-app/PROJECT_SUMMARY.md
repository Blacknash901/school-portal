# CECRE Monitoring System - Project Summary

## Overview

Complete monitoring solution for Kubernetes cluster with integrated Prometheus, Grafana, and service monitoring for portal.cecre.net.

## What Was Built

### 🎨 Frontend (React)

- **Main Dashboard**: Unified view of all monitoring data
- **Service Monitor**: Real-time status of portal.cecre.net
- **Prometheus Metrics**: CPU, Memory, Pods, Alerts display
- **Grafana Dashboard**: Embedded dashboard data from Grafana
- **Kubernetes Monitor**: Cluster, nodes, pods, services, deployments

### 🔧 Backend (Express.js/Node.js)

- **Prometheus API**: Query metrics, alerts, and targets
- **Grafana API**: Fetch dashboards and panel data
- **Kubernetes API**: Cluster information and resource status
- **Service Status**: Health checks for monitored services

### ☸️ Kubernetes Configuration

1. **Prometheus**:

   - Auto-discovery of Kubernetes resources
   - Pre-configured alerts (CPU, Memory, Pod crashes)
   - 30-day metric retention
   - Persistent EBS storage (50Gi)

2. **Grafana**:

   - Auto-configured Prometheus datasource
   - Pre-loaded Kubernetes dashboard
   - Persistent EBS storage (10Gi)
   - API key integration

3. **Monitor Application**:

   - LoadBalancer service
   - Auto-scaling ready (2 replicas)
   - Health checks configured
   - RBAC permissions for K8s API access

4. **Backup System**:

   - Daily S3 backups (CronJob)
   - 30-day retention policy
   - Automated cleanup
   - IAM role-based authentication

5. **Storage**:
   - EBS-backed persistent volumes
   - S3 integration for backups
   - Automatic volume provisioning

## Project Structure

```
monitor-app/
├── src/
│   ├── components/
│   │   ├── ServiceMonitor.jsx       # Service status monitoring
│   │   ├── PrometheusMetrics.jsx    # Prometheus metrics display
│   │   ├── GrafanaDashboard.jsx     # Grafana dashboard integration
│   │   └── KubernetesMonitor.jsx    # K8s cluster monitoring
│   ├── config/
│   │   └── urls.js                   # API endpoints & queries
│   ├── App.jsx                       # Main app with navigation
│   └── main.jsx
├── server/
│   ├── index.js                      # Express server
│   └── routes/
│       ├── prometheus.js             # Prometheus API routes
│       ├── grafana.js                # Grafana API routes
│       ├── kubernetes.js             # Kubernetes API routes
│       └── services.js               # Service monitoring routes
├── k8s/
│   ├── prometheus-config.yaml        # Prometheus config & alerts
│   ├── prometheus-deployment.yaml    # Prometheus deployment
│   ├── grafana-deployment.yaml       # Grafana deployment
│   ├── grafana-dashboard.yaml        # Pre-configured dashboard
│   ├── storage-backup.yaml           # S3 backup CronJob
│   ├── monitor-app-deployment.yaml   # App deployment
│   └── kube-state-metrics.yaml       # Metrics exporter
├── Dockerfile                         # Multi-stage Docker build
├── docker-compose.yml                 # Local development setup
├── deploy.sh                          # K8s deployment script
└── package.json                       # Dependencies & scripts
```

## Key Features Implemented

### ✅ Service Monitoring

- Monitor portal.cecre.net availability
- Latency tracking
- Success/failure metrics

### ✅ Prometheus Integration

- Real-time metrics from cluster
- Pre-configured alerts:
  - High CPU/Memory usage
  - Pod crash looping
  - Service down
  - High error rates
- Automatic scraping configuration
- 30-day data retention

### ✅ Grafana Integration

- Pre-loaded dashboards
- Automatic datasource configuration
- API-based dashboard data export
- No need to access Grafana UI directly

### ✅ Kubernetes Monitoring

- Cluster overview
- Node status and resources
- Pod listing and health
- Service discovery
- Deployment tracking
- Event monitoring

### ✅ Persistent Storage

- EBS volumes for Prometheus (50Gi)
- EBS volumes for Grafana (10Gi)
- Data survives pod restarts
- Volume expansion enabled

### ✅ Automated Backups

- Daily S3 backups at 2 AM
- 30-day backup retention
- Automatic cleanup of old backups
- Backs up both Prometheus and Grafana data

### ✅ Production Ready

- Multi-replica deployment (2 replicas)
- Health checks (liveness & readiness)
- Resource limits configured
- RBAC permissions properly set
- LoadBalancer service
- Non-root container execution

## How to Use

### Quick Start (Local Development)

```bash
./setup.sh
npm run docker:up
# Access at http://localhost:5173
```

### Deploy to Kubernetes

```bash
# Update configurations in k8s/ folder
./deploy.sh
```

### Access Components

- **Monitor App**: Via LoadBalancer or port-forward to port 80
- **Prometheus**: http://prometheus:9090 (internal) or port-forward
- **Grafana**: http://grafana:3000 (internal) or port-forward

## Configuration Required

Before deployment, update these values:

1. **k8s/storage-backup.yaml**:

   - S3 bucket name
   - AWS IAM role ARN

2. **k8s/monitor-app-deployment.yaml**:

   - Container image registry/name

3. **k8s/grafana-deployment.yaml**:

   - Admin password (change from default)

4. **Generate Grafana API key**:
   - Login to Grafana
   - Create API key
   - Update secret: `grafana-api-key`

## Monitoring URLs

The application is configured to monitor:

- **portal.cecre.net**: Main service to monitor
- **Kubernetes cluster**: All resources in the cluster
- **Application itself**: Self-monitoring via metrics endpoint

## Alerts Configured

1. **HighErrorRate**: HTTP 5xx > 5% for 5 minutes
2. **ServiceDown**: Service unreachable for 2 minutes
3. **HighMemoryUsage**: Memory > 90% for 5 minutes
4. **HighCPUUsage**: CPU > 80% for 5 minutes
5. **PodCrashLooping**: Pod restarting frequently

## API Endpoints

All available via `http://monitor-app-url:3001/api/`:

- `/prometheus/*` - Prometheus queries and alerts
- `/grafana/*` - Grafana dashboards
- `/k8s/*` - Kubernetes resources
- `/services/*` - Service status checks

## Next Steps

1. **Deploy to Kubernetes cluster**
2. **Configure S3 bucket and IAM roles**
3. **Build and push Docker image**
4. **Run deployment script**
5. **Generate Grafana API key**
6. **Access the application**
7. **Verify metrics collection**
8. **Test backup job**

## Support Files

- `README.md` - Complete documentation
- `QUICKSTART.md` - Quick start guide
- `DEPLOYMENT.md` - Detailed deployment instructions (to be created)
- `.env.example` - Environment variables template

## Technologies Used

- **Frontend**: React 19, Vite
- **Backend**: Express.js, Node.js 18
- **Monitoring**: Prometheus, Grafana
- **Container**: Docker, Kubernetes
- **Storage**: AWS EBS, S3
- **Metrics**: kube-state-metrics, node-exporter, cAdvisor

## Security Features

- Non-root container user
- RBAC permissions (least privilege)
- Secrets for sensitive data
- Private container registry support
- Encrypted EBS volumes
- S3 bucket encryption support

---

**Project Status**: ✅ Complete and ready for deployment

**Last Updated**: November 23, 2025
