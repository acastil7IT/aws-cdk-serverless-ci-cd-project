# CloudOps Platform - Quick Start Guide

## What You Have

A production-ready serverless platform with:
- ✅ REST API with DynamoDB database
- ✅ Modern monitoring dashboard
- ✅ Automated CI/CD pipeline
- ✅ Multi-environment deployment (Dev/Prod)
- ✅ Complete Linux workflows

## Live URLs

### Development Environment
- **Frontend**: https://d2m4s9gmzvqzl4.cloudfront.net
- **API**: https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev

### Production Environment
- **Frontend**: https://dd5mu6dtzqvkg.cloudfront.net
- **API**: https://zxicvv0br0.execute-api.us-east-2.amazonaws.com/prod

## Quick Test Commands

### Test API Health
```bash
curl https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/health | jq .
```

### Create an Item
```bash
curl -X POST https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"My First Item","description":"Created from CLI"}' | jq .
```

### List All Items
```bash
curl https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/api/v1/items | jq .
```

### View Database
```bash
aws dynamodb scan --table-name cloudops-data-dev --region us-east-2 | jq .
```

## Deploy Changes

### Full Deployment
```bash
# 1. Make your changes
vim lambda/src/handler.ts

# 2. Build
npm run build

# 3. Package
zip -r source.zip . -x "node_modules/*" "lambda/node_modules/*" "cdk.out/*" ".git/*" "*.zip"

# 4. Upload
aws s3 cp source.zip s3://devops-portfolio-source-v2-951578307466/source.zip --region us-east-2

# 5. Trigger pipeline
aws codepipeline start-pipeline-execution --name devops-portfolio-pipeline --region us-east-2
```

### Monitor Pipeline
```bash
aws codepipeline get-pipeline-state \
  --name devops-portfolio-pipeline \
  --region us-east-2 \
  --query "stageStates[].{Stage:stageName,Status:latestExecution.status}" \
  --output table
```

### View Logs
```bash
aws logs tail /aws/lambda/devops-portfolio-api-dev --region us-east-2 --follow
```

## Project Structure

```
cloudops-platform/
├── frontend/           # Web dashboard
│   ├── index.html
│   ├── style.css
│   └── script.js
├── lambda/            # API backend
│   ├── src/
│   │   └── handler.ts # Main Lambda function
│   └── package.json
├── infra/             # Infrastructure as Code
│   ├── lib/
│   │   ├── api-stack.ts      # API + Lambda + DynamoDB
│   │   ├── frontend-stack.ts # S3 + CloudFront
│   │   └── pipeline-stack.ts # CI/CD pipeline
│   └── bin/
│       └── app.ts     # CDK app entry point
└── docs/
    ├── README.md
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    ├── LINUX_WORKFLOW.md
    └── PROJECT_SUMMARY.md
```

## Key Features

### 1. Real Database
- DynamoDB tables: `cloudops-data-dev` and `cloudops-data-prod`
- Full CRUD operations
- Automatic scaling
- Encrypted at rest

### 2. CI/CD Pipeline
- Automatic deployment on code push
- Multi-stage: Source → Build → Dev → Approval → Prod
- Manual approval gate for production
- Automated testing and validation

### 3. Monitoring
- CloudWatch Logs for all Lambda invocations
- API Gateway access logs
- Health check endpoint
- System metrics

### 4. Security
- Least-privilege IAM roles
- HTTPS only
- Encrypted data
- CORS configured
- No secrets in code

## Common Tasks

### Add a New API Endpoint
1. Edit `lambda/src/handler.ts`
2. Add route handling in the main handler
3. Implement the function
4. Build and deploy

### Update Frontend
1. Edit files in `frontend/`
2. Build and deploy
3. Invalidate CloudFront cache if needed

### Add Infrastructure
1. Edit CDK stacks in `infra/lib/`
2. Run `cdk synth` to validate
3. Deploy via pipeline

### View Database Items
```bash
# List all items
aws dynamodb scan --table-name cloudops-data-dev --region us-east-2

# Get specific item
aws dynamodb get-item \
  --table-name cloudops-data-dev \
  --key '{"id":{"S":"<item-id>"}}' \
  --region us-east-2
```

### Clear CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id E18GPR3WSBJ9DL \
  --paths "/*" \
  --region us-east-1
```

## Troubleshooting

### Pipeline Failed
```bash
# Check pipeline status
aws codepipeline get-pipeline-state --name devops-portfolio-pipeline --region us-east-2

# View CodeBuild logs
aws logs tail /aws/codebuild/devops-portfolio-build --region us-east-2
```

### API Errors
```bash
# View Lambda logs
aws logs tail /aws/lambda/devops-portfolio-api-dev --region us-east-2 --since 10m

# Test API directly
curl -v https://5g11lq38pa.execute-api.us-east-2.amazonaws.com/dev/health
```

### Database Issues
```bash
# Check table status
aws dynamodb describe-table --table-name cloudops-data-dev --region us-east-2

# View table items
aws dynamodb scan --table-name cloudops-data-dev --region us-east-2 | jq .Items
```

## Cost Management

### Current Costs
- **Expected**: $0-5/month (within free tier)
- **Lambda**: 1M free requests/month
- **API Gateway**: 1M free requests/month
- **DynamoDB**: 25GB free storage
- **CloudFront**: 50GB free data transfer

### Monitor Costs
```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

## Next Steps

### Extend Functionality
- Add user authentication (AWS Cognito)
- Implement file uploads (S3)
- Add email notifications (SES)
- Create scheduled tasks (EventBridge)
- Add WebSocket support (API Gateway WebSocket)

### Improve Monitoring
- Create CloudWatch dashboards
- Set up SNS alerts
- Add X-Ray tracing
- Implement custom metrics

### Enhance Security
- Add WAF rules
- Implement rate limiting
- Use Secrets Manager
- Add VPC endpoints

## Documentation

- **README.md** - Project overview
- **ARCHITECTURE.md** - System architecture
- **DEPLOYMENT.md** - Deployment guide
- **LINUX_WORKFLOW.md** - Linux commands and workflows
- **PROJECT_SUMMARY.md** - Complete project summary

## Support

- **Repository**: https://github.com/acastil7IT/aws-cdk-serverless-ci-cd
- **AWS Console**: https://console.aws.amazon.com
- **CDK Docs**: https://docs.aws.amazon.com/cdk/

---

**You now have a complete, production-ready serverless platform!**
