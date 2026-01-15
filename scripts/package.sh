#!/bin/bash
set -eo pipefail

# CloudOps Platform - Package Script
# Creates deployment package for CI/CD pipeline

echo "=========================================="
echo "CloudOps Platform - Package Script"
echo "=========================================="
echo ""

# Configuration
SOURCE_ZIP="source.zip"
BUCKET="devops-portfolio-source-v2-951578307466"
REGION="us-east-2"

# Clean old package
if [ -f "$SOURCE_ZIP" ]; then
    echo "Removing old package..."
    rm -f "$SOURCE_ZIP"
    echo "✓ Old package removed"
fi
echo ""

# Create package
echo "Creating deployment package..."
zip -r "$SOURCE_ZIP" . \
    -x "node_modules/*" \
    -x "lambda/node_modules/*" \
    -x "cdk.out/*" \
    -x ".git/*" \
    -x "*.zip" \
    -x ".vscode/*" \
    -x "*.log" \
    > /dev/null 2>&1

echo "✓ Package created"
echo ""

# Show package info
PACKAGE_SIZE=$(ls -lh "$SOURCE_ZIP" | awk '{print $5}')
PACKAGE_FILES=$(unzip -l "$SOURCE_ZIP" | tail -1 | awk '{print $2}')

echo "Package Information:"
echo "  File: $SOURCE_ZIP"
echo "  Size: $PACKAGE_SIZE"
echo "  Files: $PACKAGE_FILES"
echo ""

# Verify package contents (basic check)
echo "Verifying package contents..."
FILE_COUNT=$(unzip -l "$SOURCE_ZIP" | tail -1 | awk '{print $2}')
if [ "$FILE_COUNT" -gt 50 ]; then
    echo "  ✓ Package contains $FILE_COUNT files"
else
    echo "  ✗ Package seems incomplete ($FILE_COUNT files)"
    exit 1
fi
echo ""

echo "=========================================="
echo "Package created successfully!"
echo "Ready to upload to S3: s3://$BUCKET/$SOURCE_ZIP"
echo "=========================================="
