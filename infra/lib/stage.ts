import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';
import { FrontendStack } from './frontend-stack';

/**
 * Application Stage Definition
 * 
 * This class defines a complete application stage (Dev or Prod).
 * Each stage contains all the infrastructure needed for a complete
 * environment: API Gateway + Lambda + S3 + CloudFront.
 * 
 * This pattern allows us to deploy identical infrastructure
 * to multiple environments with different configurations.
 */

export interface ApplicationStageProps extends cdk.StageProps {
  /** Environment name (dev, prod, etc.) */
  stageName: string;
  
  /** Domain name for the frontend (optional) */
  domainName?: string;
  
  /** Whether to enable detailed monitoring */
  enableDetailedMonitoring?: boolean;
}

export class ApplicationStage extends cdk.Stage {
  /** API Gateway URL for this stage */
  public readonly apiUrl: string;
  
  /** CloudFront distribution URL for this stage */
  public readonly frontendUrl: string;

  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    // Create the API stack (Lambda + API Gateway)
    const apiStack = new ApiStack(this, 'ApiStack', {
      stageName: props.stageName,
      enableDetailedMonitoring: props.enableDetailedMonitoring || false,
      description: `API infrastructure for ${props.stageName} environment`,
    });

    // Create the frontend stack (S3 + CloudFront)
    const frontendStack = new FrontendStack(this, 'FrontendStack', {
      stageName: props.stageName,
      apiUrl: apiStack.apiUrl,
      domainName: props.domainName,
      description: `Frontend infrastructure for ${props.stageName} environment`,
    });

    // Store URLs for external reference
    this.apiUrl = apiStack.apiUrl;
    this.frontendUrl = frontendStack.distributionUrl;

    // Add stage-specific tags
    cdk.Tags.of(this).add('Environment', props.stageName);
    cdk.Tags.of(this).add('Stage', props.stageName.toUpperCase());
  }
}