#!/bin/bash
set -euo pipefail

# CloudOps Platform - Deploy Script
# Uploads package to S3 and triggers CI/CD pipeline

echo "=========================================="
echo "CloudOps Platform - Deploy Script"
echo "=========================================="
echo ""

# Configuration
SOURCE_ZIP="source.zip"
BUCKET="devops-portfolio-source-v2-951578307466"
REGION="us-east-2"
PIPELINE="devops-portfolio-pipeline"

# Check if package exists
if [ ! -f "$SOURCE_ZIP" ]; then
    echo "✗ Package not found: $SOURCE_ZIP"
    echo "Run ./scripts/package.sh first"
    exit 1
fi
echo "✓ Package found: $SOURCE_ZIP"
echo ""

# Upload to S3
echo "Uploading to S3..."
echo "  Bucket: s3://$BUCKET"
echo "  Region: $REGION"
echo ""

if aws s3 cp "$SOURCE_ZIP" "s3://$BUCKET/$SOURCE_ZIP" --region "$REGION"; then
    echo "✓ Upload successful"
else
    echo "✗ Upload failed"
    exit 1
fi
echo ""

# Trigger pipeline
echo "Triggering CI/CD pipeline..."
echo "  Pipeline: $PIPELINE"
echo ""

EXECUTION_ID=$(aws codepipeline start-pipeline-execution \
    --name "$PIPELINE" \
    --region "$REGION" \
    --query 'pipelineExecutionId' \
    --output text)

if [ -n "$EXECUTION_ID" ]; then
    echo "✓ Pipeline triggered successfully"
    echo ""
    echo "Execution ID: $EXECUTION_ID"
    echo ""
    echo "Monitor pipeline:"
    echo "  CLI: aws codepipeline get-pipeline-state --name $PIPELINE --region $REGION"
    echo "  Console: https://$REGION.console.aws.amazon.com/codesuite/codepipeline/pipelines/$PIPELINE/view"
else
    echo "✗ Failed to trigger pipeline"
    exit 1
fi
echo ""

echo "=========================================="
echo "Deployment initiated successfully!"
echo "=========================================="
