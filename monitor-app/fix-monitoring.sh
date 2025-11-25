#!/bin/bash
# Quick fix script for monitoring stack issues

set -e

echo "🔍 Checking current pod status..."
/snap/bin/microk8s kubectl get pods -n monitoring

echo ""
echo "🧹 Cleaning up old/duplicate deployments..."

# Delete duplicate prometheus deployment if it exists
/snap/bin/microk8s kubectl delete deployment prometheus-6d9df7d994 -n monitoring --ignore-not-found=true

# Delete failed pods to trigger fresh restart
echo "Deleting failed pods..."
/snap/bin/microk8s kubectl delete pod alertmanager-66b7b68785-65vhh -n monitoring --ignore-not-found=true
/snap/bin/microk8s kubectl delete pod alertmanager-webhook-5889ccb648-5g84m -n monitoring --ignore-not-found=true
/snap/bin/microk8s kubectl delete pod kube-state-metrics-6989687895-8f7xw -n monitoring --ignore-not-found=true

echo ""
echo "🔄 Reapplying monitoring stack with fixes..."

# Reapply kube-state-metrics with fixed probes
/snap/bin/microk8s kubectl apply -f /home/ubuntu/monitor-app/k8s/kube-state-metrics.yaml

# Reapply alertmanager with fixed route-prefix and resources
/snap/bin/microk8s kubectl apply -f /home/ubuntu/monitor-app/k8s/alertmanager-deployment.yaml

# Reapply ingress with fixed configuration
/snap/bin/microk8s kubectl apply -f /home/ubuntu/monitor-app/k8s/monitoring-ingress.yaml

echo ""
echo "⏳ Waiting for pods to stabilize (30 seconds)..."
sleep 30

echo ""
echo "📊 Current pod status:"
/snap/bin/microk8s kubectl get pods -n monitoring

echo ""
echo "🔍 Checking Ingress configuration:"
/snap/bin/microk8s kubectl get ingress -n monitoring

echo ""
echo "✅ Done! Check the status above."
echo ""
echo "To test access:"
echo "  - Prometheus: https://portal.cecre.net/prometheus"
echo "  - Grafana: https://portal.cecre.net/grafana"
echo "  - Alertmanager: https://portal.cecre.net/alertmanager"
echo "  - Monitor App: https://portal.cecre.net/monitor"
echo ""
echo "To check logs:"
echo "  kubectl logs -n monitoring -l app=kube-state-metrics"
echo "  kubectl logs -n monitoring -l app=alertmanager-webhook"
echo "  kubectl logs -n monitoring -l app=alertmanager"
