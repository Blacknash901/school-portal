#!/bin/bash
# Build and Push School Portal for Production
# This script builds with the production IP/domain redirect URI

set -e

VERSION=${1:-"1.0.5"}
PRODUCTION_IP="34.234.31.7"
PRODUCTION_DOMAIN="portal.cecre.net"
DOCKER_REGISTRY="blacknash/cecre"

# Determine redirect URI based on DNS status
if [ "$2" = "ip" ]; then
  REDIRECT_URI="https://${PRODUCTION_IP}:30443"
  echo "🔒 Building with HTTPS on IP address (DNS not ready)"
  echo "🔗 Redirect URI: ${REDIRECT_URI}"
  echo ""
  echo "⚠️  IMPORTANT: Add this to Azure AD redirect URIs:"
  echo "   ${REDIRECT_URI}"
  echo ""
  echo "⚠️  Note: Will use self-signed certificate (browser warning expected)"
elif [ "$2" = "ip-http" ]; then
  REDIRECT_URI="http://${PRODUCTION_IP}:3000"
  echo "⚠️  Building with HTTP on IP address (DNS not ready)"
  echo "🔗 Redirect URI: ${REDIRECT_URI}"
  echo ""
  echo "⚠️  IMPORTANT: Add this to Azure AD redirect URIs:"
  echo "   ${REDIRECT_URI}"
else
  REDIRECT_URI="https://${PRODUCTION_DOMAIN}"
  echo "🌍 Building with production domain"
  echo "🔗 Redirect URI: ${REDIRECT_URI}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

# Check if logged into Docker Hub
echo "🔐 Checking Docker Hub login..."
if ! docker info 2>/dev/null | grep -q "Username"; then
  echo "❌ Not logged into Docker Hub!"
  echo "Please run: docker login"
  exit 1
fi

echo ""
echo "🔨 Building School Portal v${VERSION} for production..."
echo "📦 Registry: ${DOCKER_REGISTRY}"
echo ""

# Read .env and create build args
echo "📋 Reading environment variables from .env..."
BUILD_ARGS=""

while IFS='=' read -r key value; do
  # Skip empty lines and comments
  if [[ -z "$key" || "$key" =~ ^# ]]; then
    continue
  fi
  
  # Only include REACT_APP_ variables as build args
  if [[ "$key" =~ ^REACT_APP_ ]]; then
    # Remove quotes from value if present
    value=$(echo "$value" | sed 's/^"//;s/"$//')
    
    # Override redirect URI and environment
    if [ "$key" = "REACT_APP_REDIRECT_URI" ]; then
      value="$REDIRECT_URI"
      echo "   ✓ $key → ${REDIRECT_URI}"
    elif [ "$key" = "REACT_APP_SENTRY_ENVIRONMENT" ]; then
      value="production"
      echo "   ✓ $key → production"
    else
      echo "   ✓ $key"
    fi
    
    BUILD_ARGS="$BUILD_ARGS --build-arg $key=\"$value\""
  fi
done < .env

echo ""
echo "🏗️  Building multi-architecture Docker image (ARM64 + AMD64)..."
echo ""

# Ensure buildx builder exists and use it
if ! docker buildx inspect multiarch-builder > /dev/null 2>&1; then
  echo "📦 Creating buildx builder 'multiarch-builder'..."
  docker buildx create --name multiarch-builder --driver docker-container --use
  docker buildx inspect --bootstrap
else
  echo "✅ Using existing buildx builder 'multiarch-builder'"
  docker buildx use multiarch-builder
fi

echo ""
echo "🏗️  Building for linux/arm64 and linux/amd64..."
echo "   ✓ ARM64: Mac M1/M2, AWS Graviton (t4g instances)"
echo "   ✓ AMD64: Traditional EC2 (t3 instances), most servers"
echo ""

# Build multi-arch image with buildx (automatically pushes when building multi-arch)
eval "docker buildx build \
  --platform linux/arm64,linux/amd64 \
  --push \
  $BUILD_ARGS \
  -t ${DOCKER_REGISTRY}:${VERSION} \
  -t ${DOCKER_REGISTRY}:latest \
  ."

echo ""
echo "✅ Multi-architecture build complete and pushed!"
echo ""
echo "📦 Available images:"
echo "   - ${DOCKER_REGISTRY}:${VERSION} (ARM64 + AMD64)"
echo "   - ${DOCKER_REGISTRY}:latest (ARM64 + AMD64)"
echo ""
echo "🎯 This image will now work on:"
echo "   ✓ AWS Graviton (t4g) instances - ARM64"
echo "   ✓ Traditional EC2 (t3, t2) instances - AMD64"
echo "   ✓ Mac M1/M2 - ARM64"
echo "   ✓ Most cloud providers - Both architectures"
echo ""

if [ "$2" = "ip" ]; then
  echo "⚠️  IMPORTANT NEXT STEPS:"
  echo ""
  echo "1. Add redirect URI to Azure AD:"
  echo "   - Go to https://portal.azure.com"
  echo "   - Azure Active Directory → App registrations"
  echo "   - Your app → Authentication → Add URI:"
  echo "   - ${REDIRECT_URI}"
  echo ""
  echo "2. Deploy with Ansible:"
  echo "   cd deployment/ansible"
  echo "   ansible-playbook -i inventory.yml playbook.yml"
  echo ""
  echo "3. Access at: ${REDIRECT_URI}"
  echo ""
  echo "4. When DNS is ready, rebuild with:"
  echo "   ./build-production.sh ${VERSION}"
else
  echo "🚢 Ready to deploy!"
  echo ""
  echo "Next steps:"
  echo "1. Make sure Azure AD has redirect URI: ${REDIRECT_URI}"
  echo "2. Deploy with Ansible:"
  echo "   cd deployment/ansible"
  echo "   ansible-playbook -i inventory.yml playbook.yml"
  echo "3. Access at: ${REDIRECT_URI}"
fi

echo ""

