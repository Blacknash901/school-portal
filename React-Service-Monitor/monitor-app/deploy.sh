#!/bin/bash

# CECRE Monitoring Deployment Script

set -e

echo "🚀 Starting CECRE Monitoring Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

# Check if we're connected to a cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Not connected to a Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"

# Create namespace
echo -e "${YELLOW}Creating monitoring namespace...${NC}"
kubectl apply -f k8s/prometheus-config.yaml

# Deploy Prometheus
echo -e "${YELLOW}Deploying Prometheus...${NC}"
kubectl apply -f k8s/prometheus-deployment.yaml

# Wait for Prometheus to be ready
echo -e "${YELLOW}Waiting for Prometheus to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s

# Deploy Grafana
echo -e "${YELLOW}Deploying Grafana...${NC}"
kubectl apply -f k8s/grafana-deployment.yaml
kubectl apply -f k8s/grafana-dashboard.yaml

# Wait for Grafana to be ready
echo -e "${YELLOW}Waiting for Grafana to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

# Deploy backup configuration
echo -e "${YELLOW}Deploying backup configuration...${NC}"
kubectl apply -f k8s/storage-backup.yaml

# Deploy monitor app
echo -e "${YELLOW}Deploying monitor application...${NC}"
kubectl apply -f k8s/monitor-app-deployment.yaml

# Wait for monitor app to be ready
echo -e "${YELLOW}Waiting for monitor app to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=monitor-app -n monitoring --timeout=300s

echo -e "${GREEN}✓ All components deployed successfully!${NC}"

# Get service URLs
echo -e "\n${YELLOW}Service Information:${NC}"
echo "===================="

MONITOR_APP_URL=$(kubectl get svc monitor-app -n monitoring -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending...")
echo -e "Monitor App: ${GREEN}http://${MONITOR_APP_URL}${NC}"

# Port forward instructions
echo -e "\n${YELLOW}To access services locally, run:${NC}"
echo "kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo "kubectl port-forward -n monitoring svc/monitor-app 8080:80"

# Check pod status
echo -e "\n${YELLOW}Pod Status:${NC}"
kubectl get pods -n monitoring

echo -e "\n${GREEN}✓ Deployment complete!${NC}"
