# Linux Workflow Documentation

## Overview

This project is developed, built, and deployed entirely from a Linux command-line environment (Ubuntu). This document demonstrates the Linux administration skills and CLI workflows used throughout the development and deployment process.

## Why Linux?

**Production Environment Alignment**
- AWS Lambda runs on Amazon Linux 2
- Most CI/CD systems run on Linux containers
- Production servers typically run Linux distributions
- Developing on Linux ensures environment parity

**DevOps Best Practices**
- Scriptable and automatable workflows
- Powerful command-line tools (grep, awk, sed, jq)
- SSH-based remote server management
- Container and orchestration compatibility

**Professional Development**
- Industry-standard for cloud infrastructure
- Required skill for DevOps/SRE roles
- Better performance for development tools
- Native Docker and Kubernetes support

## Linux Tools Used

### Core System Tools
- `bash` - Shell scripting and command execution
- `ssh` - Secure remote access (for EC2 if needed)
- `curl` - API testing and HTTP requests
- `jq` - JSON parsing and manipulation
- `grep/awk/sed` - Text processing and log analysis

### Development Tools
- `npm` - Node.js package management
- `tsc` - TypeScript compilation
- `git` - Version control
- `zip` - Archive creation for deployments

### AWS Tools
- `aws-cli` - AWS service interaction
- `cdk` - Infrastructure as Code deployment

## Complete Deployment Workflow

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/acastil7IT/aws-cdk-serverless-ci-cd.git
cd aws-cdk-serverless-ci-cd

# Install dependencies
npm install
cd lambda && npm install && cd ..

# Configure AWS credentials
aws configure
# Enter: Access Key, Secret Key, Region (us-east-2), Output format (json)

# Bootstrap CDK (one-time per account/region)
cdk bootstrap aws://ACCOUNT-ID/us-east-2
```

### 2. Development Workflow

```bash
# Make code changes using vim/nano/vscode
vim lambda/src/handler.ts

# Build TypeScript
npm run build

# Run tests
npm test

# Check for errors
npm run lint

# View build output
ls -la lambda/dist/
```

### 3. Infrastructure Deployment

```bash
# Synthesize CloudFormation templates
npm run synth

# View generated templates
ls -la cdk.out/
cat cdk.out/DevOpsPortfolio-Dev-ApiStack.template.json | jq .

# Deploy pipeline stack
npm run deploy:pipeline

# Check deployment status
aws cloudformation describe-stacks \
  --stack-name DevOpsPortfolioPipelineStack \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus'
```

### 4. Package and Upload Source

```bash
# Create deployment package
zip -r source.zip . \
  -x "node_modules/*" \
  -x "lambda/node_modules/*" \
  -x "cdk.out/*" \
  -x ".git/*" \
  -x "*.zip"

# Verify package contents
unzip -l source.zip | head -20

# Check package size
ls -lh source.zip

# Upload to S3 source bucket
aws s3 cp source.zip \
  s3://devops-portfolio-source-v2-951578307466/source.zip \
  --region us-east-2

# Verify upload
aws s3 ls s3://devops-portfolio-source-v2-951578307466/ --region us-east-2
```

### 5. Trigger Pipeline

```bash
# Start pipeline execution
aws codepipeline start-pipeline-execution \
  --name devops-portfolio-pipeline \
  --region us-east-2

# Get execution ID from output
EXECUTION_ID="<execution-id-from-output>"

# Monitor pipeline status
aws codepipeline get-pipeline-state \
  --name devops-portfolio-pipeline \
  --region us-east-2 \
  --query "stageStates[].{Stage:stageName,Status:latestExecution.status}" \
  --output table
```

### 6. Monitor Logs

```bash
# View Lambda logs (real-time)
aws logs tail /aws/lambda/devops-portfolio-api-dev \
  --region us-east-2 \
  --since 10m \
  --follow

# Search for errors in logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/devops-portfolio-api-dev \
  --region us-east-2 \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# View CodeBuild logs
aws codebuild batch-get-builds \
  --ids <build-id> \
  --region us-east-2 \
  --query 'builds[0].logs.deepLink'
```

### 7. Test Deployed API

```bash
# Test health endpoint
curl -s https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/health | jq .

# Test items endpoint
curl -s https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/api/v1/items | jq .

# Create new item
curl -X POST \
  https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Created from Linux CLI"}' | jq .

# Measure API response time
time curl -s https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/health > /dev/null
```

### 8. CloudFront Cache Management

```bash
# List CloudFront distributions
aws cloudfront list-distributions \
  --region us-east-1 \
  --query "DistributionList.Items[].{ID:Id,Domain:DomainName,Comment:Comment}" \
  --output table

# Create cache invalidation
aws cloudfront create-invalidation \
  --distribution-id E18GPR3WSBJ9DL \
  --paths "/*" \
  --region us-east-1

# Check invalidation status
aws cloudfront get-invalidation \
  --distribution-id E18GPR3WSBJ9DL \
  --id <invalidation-id> \
  --region us-east-1
```

### 9. Database Operations

```bash
# List DynamoDB tables
aws dynamodb list-tables --region us-east-2

# Describe table
aws dynamodb describe-table \
  --table-name cloudops-data-dev \
  --region us-east-2 \
  --query 'Table.{Name:TableName,Status:TableStatus,Items:ItemCount}'

# Scan table (view all items)
aws dynamodb scan \
  --table-name cloudops-data-dev \
  --region us-east-2 | jq .

# Query specific item
aws dynamodb get-item \
  --table-name cloudops-data-dev \
  --key '{"id":{"S":"<item-id>"}}' \
  --region us-east-2
```

### 10. Monitoring and Metrics

```bash
# Get Lambda metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=devops-portfolio-api-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-2

# Get API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=devops-portfolio-api-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-2

# Check for Lambda errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=devops-portfolio-api-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-2
```

### 11. Cleanup and Maintenance

```bash
# Remove old build artifacts
rm -rf cdk.out/ lambda/dist/ node_modules/ lambda/node_modules/

# Clean npm cache
npm cache clean --force

# Remove old source packages
rm -f source.zip

# View disk usage
du -sh .
df -h

# Check running processes
ps aux | grep node
```

### 12. Troubleshooting

```bash
# Check AWS CLI configuration
aws configure list
aws sts get-caller-identity

# Verify CDK version
cdk --version
node --version
npm --version

# Check network connectivity
ping -c 3 aws.amazon.com
curl -I https://aws.amazon.com

# View environment variables
env | grep AWS
echo $PATH

# Check file permissions
ls -la lambda/dist/
chmod +x scripts/*.sh  # if using shell scripts
```

## Automation Scripts

### Quick Deploy Script

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e  # Exit on error

echo "Building application..."
npm run build

echo "Creating source package..."
zip -r source.zip . \
  -x "node_modules/*" \
  -x "lambda/node_modules/*" \
  -x "cdk.out/*" \
  -x ".git/*" \
  -x "*.zip"

echo "Uploading to S3..."
aws s3 cp source.zip \
  s3://devops-portfolio-source-v2-951578307466/source.zip \
  --region us-east-2

echo "Starting pipeline..."
aws codepipeline start-pipeline-execution \
  --name devops-portfolio-pipeline \
  --region us-east-2

echo "Deployment initiated successfully!"
```

### Log Monitoring Script

```bash
#!/bin/bash
# monitor-logs.sh - Real-time log monitoring

FUNCTION_NAME="devops-portfolio-api-dev"
REGION="us-east-2"

echo "Monitoring logs for $FUNCTION_NAME..."
aws logs tail /aws/lambda/$FUNCTION_NAME \
  --region $REGION \
  --follow \
  --format short
```

## Linux Skills Demonstrated

### File System Operations
- Creating and managing directory structures
- File permissions and ownership
- Archive creation and extraction
- Disk space management

### Process Management
- Running background processes
- Process monitoring and control
- Resource usage analysis
- Service management

### Network Operations
- HTTP requests and API testing
- Network connectivity verification
- Port and service checking
- SSL/TLS certificate validation

### Text Processing
- Log file analysis with grep/awk/sed
- JSON parsing with jq
- Pattern matching and filtering
- Data transformation

### Shell Scripting
- Bash script creation
- Error handling and validation
- Environment variable management
- Conditional logic and loops

### AWS CLI Mastery
- Service interaction and automation
- Resource querying and filtering
- Batch operations
- Output formatting and parsing

## Best Practices

1. **Always use version control** - Commit changes before deployment
2. **Test locally first** - Run `npm test` before deploying
3. **Monitor logs** - Watch CloudWatch logs during deployment
4. **Use environment variables** - Never hardcode credentials
5. **Automate repetitive tasks** - Create shell scripts for common operations
6. **Document commands** - Keep this file updated with new workflows
7. **Use proper error handling** - Check exit codes and handle failures
8. **Maintain clean workspace** - Regularly clean build artifacts

## Conclusion

This Linux-based workflow demonstrates professional DevOps practices including:
- Command-line proficiency
- AWS service automation
- CI/CD pipeline management
- Infrastructure as Code deployment
- Monitoring and troubleshooting
- Security and best practices

All operations are scriptable, repeatable, and suitable for production environments.
