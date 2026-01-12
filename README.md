# DevOps Portfolio Project - AWS CDK CI/CD Pipeline

A production-ready serverless application demonstrating Infrastructure as Code (IaC) and CI/CD best practices using AWS CDK v2, designed to showcase enterprise DevOps skills while staying within AWS free tier limits.

## 🏗️ Architecture Overview

This project demonstrates a complete serverless application lifecycle with automated deployment pipelines:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Developer     │───▶│  GitHub/CodeStar │───▶│  CDK Pipeline   │
│   Commits Code  │    │   Source Repo    │    │   (CodePipeline)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                       ┌─────────────────────────────────────────┐
                       │            Pipeline Stages              │
                       │  1. Source → 2. Build → 3. Dev Deploy  │
                       │  4. Manual Approval → 5. Prod Deploy   │
                       └─────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Deployed Infrastructure                      │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐   │
│  │ CloudFront  │───▶│  API Gateway │───▶│ Lambda Function │   │
│  │ + S3 Static │    │   REST API   │    │  (Node.js/Python)│   │
│  │   Website   │    │              │    │                 │   │
│  └─────────────┘    └──────────────┘    └─────────────────┘   │
│                                                   │             │
│                                                   ▼             │
│                                          ┌─────────────────┐   │
│                                          │  CloudWatch     │   │
│                                          │  Logs & Metrics │   │
│                                          └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Business Value

This project simulates real enterprise scenarios:
- **Zero-downtime deployments** through blue/green deployment patterns
- **Environment promotion** with manual approval gates (Dev → Prod)
- **Infrastructure as Code** ensuring consistent, repeatable deployments
- **Automated testing** and validation in the pipeline
- **Cost optimization** using serverless architecture
- **Security best practices** with least-privilege IAM roles

## 🚀 What This Demonstrates

### DevOps Skills
- Infrastructure as Code (CDK v2)
- CI/CD pipeline automation
- Multi-environment management
- Security and compliance practices
- Monitoring and observability

### AWS Services Used (Free Tier Safe)
- **AWS CDK v2** - Infrastructure as Code
- **CodePipeline** - CI/CD orchestration
- **Lambda** - Serverless compute
- **API Gateway** - REST API management
- **S3** - Static website hosting
- **CloudFront** - Global CDN
- **CloudWatch** - Logging and monitoring
- **IAM** - Security and access control

## 📁 Project Structure

```
devops-portfolio-project/
├── README.md                    # This file
├── package.json                 # CDK dependencies
├── cdk.json                     # CDK configuration
├── tsconfig.json               # TypeScript configuration
├── .gitignore                  # Git ignore rules
├── infra/                      # CDK Infrastructure code
│   ├── bin/
│   │   └── app.ts              # CDK app entry point
│   ├── lib/
│   │   ├── pipeline-stack.ts   # CI/CD pipeline definition
│   │   ├── api-stack.ts        # API Gateway + Lambda
│   │   ├── frontend-stack.ts   # S3 + CloudFront
│   │   └── stage.ts            # Environment stage definition
│   └── test/                   # Infrastructure tests
├── lambda/                     # Lambda function code
│   ├── src/
│   │   └── handler.ts          # Lambda handler
│   ├── package.json            # Lambda dependencies
│   └── tests/                  # Lambda tests
└── frontend/                   # Static website files
    ├── index.html              # Main page
    ├── style.css               # Styling
    └── script.js               # Frontend logic
```

## 🛠️ Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ installed
- AWS CDK v2 installed globally: `npm install -g aws-cdk`

### Bootstrap & Deploy
```bash
# 1. Clone and setup
git clone <your-repo>
cd devops-portfolio-project
npm install

# 2. Bootstrap CDK (one-time setup)
cdk bootstrap

# 3. Deploy the pipeline
cdk deploy PipelineStack

# 4. Push code to trigger pipeline
git add .
git commit -m "Initial deployment"
git push origin main
```

## 🔄 Pipeline Behavior

1. **Source Stage**: Triggered by code push to main branch
2. **Build Stage**: 
   - Synthesizes CDK code
   - Runs unit tests
   - Validates infrastructure
3. **Dev Deploy**: Automatically deploys to development environment
4. **Manual Approval**: Pipeline pauses for human review
5. **Prod Deploy**: Deploys to production after approval

## 💰 Cost Considerations

This project is designed to stay within AWS free tier:
- Lambda: 1M free requests/month
- API Gateway: 1M free requests/month
- S3: 5GB free storage
- CloudFront: 50GB free data transfer
- CodePipeline: 1 free pipeline/month

Estimated monthly cost: **$0-5** (well within free tier limits)

## 🔐 Security Features

- Least-privilege IAM roles for all services
- API Gateway with throttling and CORS
- CloudFront with security headers
- Lambda environment variable encryption
- VPC endpoints for private communication (optional)

## 📊 Monitoring & Observability

- CloudWatch Logs for all Lambda functions
- API Gateway access logging
- CloudFront access logs
- Custom CloudWatch metrics and alarms
- X-Ray tracing for distributed debugging

## 🎓 Learning Outcomes

After building this project, you'll understand:
- How to structure enterprise-grade CDK projects
- CI/CD pipeline design and implementation
- Multi-environment deployment strategies
- AWS security best practices
- Serverless architecture patterns
- Infrastructure monitoring and alerting

## 🔧 Customization Ideas

- Add DynamoDB for data persistence
- Implement API authentication with Cognito
- Add automated testing with Jest/Pytest
- Include infrastructure security scanning
- Add blue/green deployment strategies
- Implement feature flags and canary deployments

---

*This project demonstrates production-ready DevOps practices suitable for enterprise environments while maintaining cost efficiency through serverless architecture.*