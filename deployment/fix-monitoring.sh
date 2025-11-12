#!/bin/bash
# ============================================================================
# Fix Monitoring Issues
# ============================================================================
#
# This script fixes:
# 1. Grafana dashboard JSON structure (remove nested "dashboard" wrapper)
# 2. Reset Grafana admin password to "admin"
# 3. Verify Prometheus is scraping correctly
#
# USAGE:
#   Run on the production server:
#   cd /opt/school-portal && bash fix-monitoring.sh
#
# ============================================================================

set -e

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║              🔧  FIXING MONITORING STACK  🔧                         ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# Step 1: Redeploy Grafana with fixed dashboard
# ============================================================================
echo "📊 Step 1: Redeploying Grafana with fixed dashboard..."
echo ""

microk8s kubectl delete configmap grafana-dashboard-school-portal -n monitoring --ignore-not-found=true
microk8s kubectl apply -f /opt/school-portal/monitoring/grafana-deployment.yaml

echo "✅ Grafana ConfigMaps updated"
echo ""

# ============================================================================
# Step 2: Restart Grafana to pick up changes
# ============================================================================
echo "🔄 Step 2: Restarting Grafana..."
echo ""

microk8s kubectl rollout restart deployment grafana -n monitoring
microk8s kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=120s

echo "✅ Grafana restarted"
echo ""

# ============================================================================
# Step 3: Reset Grafana admin password
# ============================================================================
echo "🔑 Step 3: Resetting Grafana admin password..."
echo ""

GRAFANA_POD=$(microk8s kubectl get pods -n monitoring -l app=grafana -o jsonpath='{.items[0].metadata.name}')

microk8s kubectl exec -n monitoring "$GRAFANA_POD" -- grafana-cli admin reset-admin-password admin

echo "✅ Grafana admin password reset to 'admin'"
echo ""

# ============================================================================
# Step 4: Check Prometheus targets
# ============================================================================
echo "🔍 Step 4: Checking Prometheus targets..."
echo ""

sleep 5  # Wait for Prometheus to scrape

TARGETS=$(curl -s http://localhost:30090/api/v1/targets | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"')

echo "Prometheus Targets:"
echo "$TARGETS"
echo ""

# ============================================================================
# Step 5: Verify Grafana dashboards
# ============================================================================
echo "📈 Step 5: Verifying Grafana dashboards..."
echo ""

DASHBOARDS=$(curl -s -u admin:admin http://localhost:30300/api/search | jq -r '.[] | .title')

if [ -z "$DASHBOARDS" ]; then
  echo "⚠️  No dashboards found yet. This is normal - wait 10-20 seconds for provisioning."
else
  echo "Available dashboards:"
  echo "$DASHBOARDS"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                                                                      ║"
echo "║                  ✅  MONITORING FIX COMPLETE!  ✅                    ║"
echo "║                                                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Grafana:"
echo "   URL: http://$(hostname -I | awk '{print $1}'):30300"
echo "   Login: admin / admin"
echo "   Dashboard: 'School Portal Monitoring'"
echo ""
echo "🔍 Prometheus:"
echo "   URL: http://$(hostname -I | awk '{print $1}'):30090"
echo ""
echo "⏱️  Note: Dashboards may take 10-20 seconds to appear after Grafana restart"
echo ""
echo "🔧 If you still don't see dashboards, run:"
echo "   microk8s kubectl logs -n monitoring -l app=grafana --tail=20"
echo ""

