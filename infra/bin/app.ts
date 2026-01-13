#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

/**
 * CDK App Entry Point
 * 
 * This is the main entry point for our CDK application.
 * It creates the CI/CD pipeline stack that will manage deployments
 * to both Dev and Prod environments.
 */

const app = new cdk.App();

// Create the CI/CD pipeline stack
// This stack contains the CodePipeline that will deploy our application
// to multiple environments (Dev and Prod) with manual approval gates
new PipelineStack(app, 'DevOpsPortfolioPipelineStack', {
  env: {
    // Pipeline stack should be deployed in a specific region
    // This is where the CI/CD pipeline infrastructure will live
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'CI/CD Pipeline for DevOps Portfolio Project - demonstrates enterprise deployment practices',
  
  // Tags for cost tracking and organization
  tags: {
    Project: 'DevOpsPortfolio',
    Environment: 'Pipeline',
    Owner: 'DevOps-Team',
    CostCenter: 'Engineering',
  },
});

// Create Dev environment stacks
const devApiStack = new ApiStack(app, 'DevOpsPortfolio-Dev-ApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stageName: 'dev',
  enableDetailedMonitoring: false,
  description: 'API infrastructure for Dev environment',
});

new FrontendStack(app, 'DevOpsPortfolio-Dev-FrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stageName: 'dev',
  apiUrl: devApiStack.apiUrl,
  description: 'Frontend infrastructure for Dev environment',
});

// Create Prod environment stacks
const prodApiStack = new ApiStack(app, 'DevOpsPortfolio-Prod-ApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stageName: 'prod',
  enableDetailedMonitoring: true,
  description: 'API infrastructure for Prod environment',
});

new FrontendStack(app, 'DevOpsPortfolio-Prod-FrontendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stageName: 'prod',
  apiUrl: prodApiStack.apiUrl,
  description: 'Frontend infrastructure for Prod environment',
});

// Add global tags to all resources
cdk.Tags.of(app).add('Project', 'DevOpsPortfolio');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Repository', 'devops-portfolio-project');