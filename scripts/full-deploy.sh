#!/bin/bash
set -euo pipefail

# CloudOps Platform - Full Deploy Script
# Runs build, package, and deploy in sequence

echo "=========================================="
echo "CloudOps Platform - Full Deployment"
echo "=========================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Step 1: Build
echo "Step 1/3: Building..."
if bash "$SCRIPT_DIR/build.sh"; then
    echo "✓ Build completed"
else
    echo "✗ Build failed"
    exit 1
fi
echo ""

# Step 2: Package
echo "Step 2/3: Packaging..."
if bash "$SCRIPT_DIR/package.sh"; then
    echo "✓ Package created"
else
    echo "✗ Package failed"
    exit 1
fi
echo ""

# Step 3: Deploy
echo "Step 3/3: Deploying..."
if bash "$SCRIPT_DIR/deploy.sh"; then
    echo "✓ Deployment initiated"
else
    echo "✗ Deployment failed"
    exit 1
fi
echo ""

echo "=========================================="
echo "Full deployment completed successfully!"
echo "=========================================="
