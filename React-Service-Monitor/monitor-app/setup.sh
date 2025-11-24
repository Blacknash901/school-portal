#!/bin/bash

# Make the deploy script executable
chmod +x deploy.sh

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Choose how to run the application:"
echo ""
echo "1️⃣  Local Development (Docker Compose - Recommended):"
echo "   npm run docker:up"
echo "   Then visit: http://localhost:5173"
echo ""
echo "2️⃣  Development Mode (without Docker):"
echo "   npm run dev:all"
echo ""
echo "3️⃣  Deploy to Kubernetes:"
echo "   ./deploy.sh"
echo ""
echo "📖 For more information:"
echo "   - Quick Start: cat QUICKSTART.md"
echo "   - Full Docs: cat README.md"
echo ""
