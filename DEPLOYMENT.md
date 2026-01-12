# Deployment Guide

This guide walks you through deploying the DevOps Portfolio Project to AWS using CDK v2.

## Prerequisites

### Required Software
- **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
- **AWS CLI v2**: Install from [AWS CLI Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK v2**: Install globally with `npm install -g aws-cdk`
- **Git**: For version control

### AWS Account Setup
1. **Create AWS Account**: Sign up at [aws.amazon.com](https://aws.amazon.com) if you don't have one
2. **Create IAM User**: Create an IAM user with programmatic access and appropriate permissions
3. **Configure AWS CLI**: Run `aws configure` and enter your credentials

### Required AWS Permissions
Your IAM user needs these permissions (or use AdministratorAccess for simplicity):
- CloudFormation full access
- IAM full access
- Lambda full access
- API Gateway full access
- S3 full access
- CloudFront full access
- CodePipeline full access
- CodeBuild full access
- CloudWatch Logs full access

## Step-by-Step Deployment

### 1. Clone and Setup Project
```bash
# Clone the repository
git clone <your-repository-url>
cd devops-portfolio-project

# Install dependencies
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..
```

### 2. Bootstrap CDK (One-time setup)
```bash
# Bootstrap CDK in your AWS account and region
cdk bootstrap

# Verify bootstrap was successful
aws cloudformation describe-stacks --stack-name CDKToolkit
```

### 3. Build and Test
```bash
# Build the project
npm run build

# Run tests (optional)
npm test

# Synthesize CDK templates to verify everything is correct
cdk synth
```

### 4. Deploy the Pipeline
```bash
# Deploy the CI/CD pipeline stack
cdk deploy DevOpsPortfolioPipelineStack

# Note the outputs - you'll need the S3 bucket name for source uploads
```

### 5. Upload Source Code (For S3 Source)
```bash
# Create a source archive
zip -r source.zip . -x "node_modules/*" "cdk.out/*" ".git/*"

# Upload to the source bucket (replace BUCKET_NAME with actual bucket name from step 4)
aws s3 cp source.zip s3://BUCKET_NAME/source.zip
```

### 6. Monitor Pipeline Execution
1. Go to AWS Console → CodePipeline
2. Find your pipeline: `devops-portfolio-pipeline`
3. Watch the pipeline execute through all stages
4. Approve the manual approval step when prompted

## Alternative: GitHub Integration

To use GitHub instead of S3 source:

### 1. Create GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Create a token with `repo` permissions
3. Store in AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "your-github-token"
```

### 2. Update Pipeline Configuration
Uncomment the GitHub source action in `infra/lib/pipeline-stack.ts` and update:
- `githubOwner`: Your GitHub username
- `githubRepo`: Repository name
- `githubBranch`: Branch to track (usually `main`)

### 3. Redeploy Pipeline
```bash
cdk deploy DevOpsPortfolioPipelineStack
```

## Verification

### 1. Check Pipeline Status
```bash
# List all stacks
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# Check pipeline status
aws codepipeline get-pipeline-state --name devops-portfolio-pipeline
```

### 2. Test the Application
After successful deployment, you'll have:
- **Dev Environment**: `https://dev-cloudfront-url.cloudfront.net`
- **Prod Environment**: `https://prod-cloudfront-url.cloudfront.net`

Test the health endpoint:
```bash
curl https://your-api-gateway-url/health
```

### 3. View Logs
```bash
# View Lambda logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/devops-portfolio"

# View recent log events
aws logs tail /aws/lambda/devops-portfolio-api-dev --follow
```

## Cost Monitoring

### Expected Costs (Free Tier)
- **Lambda**: Free for first 1M requests/month
- **API Gateway**: Free for first 1M requests/month
- **S3**: Free for first 5GB storage
- **CloudFront**: Free for first 50GB data transfer
- **CodePipeline**: $1/month per pipeline (first pipeline free)

### Monitor Costs
```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Failed
```bash
# Check if you have the right permissions
aws sts get-caller-identity

# Try bootstrapping with explicit region
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

#### 2. Pipeline Deployment Failed
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name DevOpsPortfolioPipelineStack

# Check CodeBuild logs
aws logs tail /aws/codebuild/devops-portfolio-build --follow
```

#### 3. Lambda Function Errors
```bash
# Check Lambda function logs
aws logs tail /aws/lambda/devops-portfolio-api-dev --follow

# Test Lambda function directly
aws lambda invoke \
  --function-name devops-portfolio-api-dev \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  response.json
```

#### 4. API Gateway Issues
```bash
# Test API Gateway directly
curl -X GET https://your-api-id.execute-api.region.amazonaws.com/dev/health

# Check API Gateway logs
aws logs tail /aws/apigateway/devops-portfolio-dev --follow
```

### Getting Help
- Check AWS CloudFormation console for detailed error messages
- Review CloudWatch logs for runtime errors
- Use `cdk diff` to see what changes will be made
- Use `cdk doctor` to check for common configuration issues

## Cleanup

To avoid ongoing costs, clean up resources when done:

```bash
# Delete application stacks (in order)
aws cloudformation delete-stack --stack-name DevOpsPortfolio-Prod
aws cloudformation delete-stack --stack-name DevOpsPortfolio-Dev
aws cloudformation delete-stack --stack-name DevOpsPortfolioPipelineStack

# Empty and delete S3 buckets manually if needed
aws s3 rm s3://bucket-name --recursive
aws s3 rb s3://bucket-name

# Delete CDK bootstrap stack (optional, affects other CDK projects)
# aws cloudformation delete-stack --stack-name CDKToolkit
```

## Next Steps

After successful deployment:
1. **Customize the application** with your own business logic
2. **Add monitoring and alerting** with CloudWatch alarms
3. **Implement proper authentication** with AWS Cognito
4. **Add a database layer** with DynamoDB
5. **Set up custom domain names** with Route 53
6. **Implement blue/green deployments** for zero-downtime updates

This project provides a solid foundation for building production-ready serverless applications with proper DevOps practices!