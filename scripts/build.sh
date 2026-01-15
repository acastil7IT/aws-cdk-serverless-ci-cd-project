#!/bin/bash
set -euo pipefail

# CloudOps Platform - Build Script
# This script runs linting, tests, and builds the TypeScript code

echo "=========================================="
echo "CloudOps Platform - Build Script"
echo "=========================================="
echo ""

# Print environment info
echo "Environment Information:"
echo "  OS: $(uname -s)"
echo "  Kernel: $(uname -r)"
echo "  Node: $(node -v)"
echo "  NPM: $(npm -v)"
echo "  CDK: $(cdk --version)"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
npm ci
cd lambda && npm ci && cd ..
echo "✓ Dependencies installed"
echo ""

# Step 2: Run linting
echo "Step 2: Running ESLint..."
if npm run lint; then
    echo "✓ Linting passed"
else
    echo "✗ Linting failed"
    exit 1
fi
echo ""

# Step 3: Run tests
echo "Step 3: Running tests..."
if npm test; then
    echo "✓ Tests passed"
else
    echo "✗ Tests failed"
    exit 1
fi
echo ""

# Step 4: Build TypeScript
echo "Step 4: Building TypeScript..."
npm run build
echo "✓ Build completed"
echo ""

# Step 5: Synthesize CDK
echo "Step 5: Synthesizing CDK templates..."
cdk synth --quiet
echo "✓ CDK synthesis completed"
echo ""

# Print build artifacts
echo "Build Artifacts:"
echo "  Infrastructure: $(ls -lh cdk.out/*.template.json | wc -l) CloudFormation templates"
echo "  Lambda: $(ls -lh lambda/dist/*.js | wc -l) JavaScript files"
echo ""

echo "=========================================="
echo "Build completed successfully!"
echo "=========================================="
