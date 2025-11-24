#!/bin/bash
set -e

# Configuration
REGISTRY="blacknash/monitor"
VERSION="${1:-latest}"

echo "🔨 Building monitor app for ARM64 and AMD64..."

# Build multi-platform image and push to Docker Hub
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag ${REGISTRY}:${VERSION} \
  --tag ${REGISTRY}:latest \
  --push \
  .

echo "✅ Monitor app built and pushed to ${REGISTRY}:${VERSION}"
echo "Platforms: linux/amd64, linux/arm64"
