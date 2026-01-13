import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * Frontend Stack - S3 Static Website + CloudFront CDN
 * 
 * This stack creates:
 * - S3 bucket for static website hosting
 * - CloudFront distribution for global CDN
 * - Automatic deployment of frontend assets
 * - Security headers and HTTPS enforcement
 * 
 * Demonstrates enterprise patterns:
 * - Global content delivery with CloudFront
 * - Security best practices (HTTPS, security headers)
 * - Cost optimization (S3 + CloudFront vs EC2)
 * - Automated asset deployment
 */

export interface FrontendStackProps extends cdk.StackProps {
  /** Environment name (dev, prod, etc.) */
  stageName: string;
  
  /** API Gateway URL to configure in frontend */
  apiUrl: string;
  
  /** Custom domain name (optional) */
  domainName?: string;
}

export class FrontendStack extends cdk.Stack {
  /** CloudFront distribution URL */
  public readonly distributionUrl: string;
  
  /** S3 bucket for static assets */
  public readonly websiteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    // Create S3 bucket for static website hosting
    this.websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `devops-portfolio-frontend-${props.stageName}-${this.account}`,
      
      // Security configuration
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // CloudFront will access via OAI
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true, // Require HTTPS for all requests
      
      // Lifecycle configuration for cost optimization
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
      
      // Cleanup configuration for demo project
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Automatically delete objects when stack is destroyed
      
      // Versioning (optional, useful for rollbacks)
      versioned: props.stageName === 'prod',
    });

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for DevOps Portfolio ${props.stageName} environment`,
    });

    // Grant CloudFront read access to S3 bucket
    this.websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject'],
        resources: [this.websiteBucket.arnForObjects('*')],
        principals: [originAccessIdentity.grantPrincipal],
      })
    );

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `DevOps Portfolio Frontend - ${props.stageName}`,
      
      // Default behavior for S3 origin
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessIdentity(this.websiteBucket, {
          originAccessIdentity,
        }),
        
        // Caching configuration
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        
        // Security headers
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
          comment: `Security headers for ${props.stageName} environment`,
          securityHeadersBehavior: {
            contentTypeOptions: { override: true },
            frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
            referrerPolicy: { 
              referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN, 
              override: true 
            },
            strictTransportSecurity: { 
              accessControlMaxAge: cdk.Duration.seconds(31536000), 
              includeSubdomains: true, 
              override: true 
            },
            xssProtection: { 
              protection: true, 
              modeBlock: true, 
              override: true 
            },
          },
        }),
      },
      
      // Additional behaviors for API proxying (optional)
      additionalBehaviors: {
        '/api/*': {
          origin: new origins.HttpOrigin(cdk.Fn.select(2, cdk.Fn.split('/', props.apiUrl)), {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
          }),
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Don't cache API responses
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        },
      },
      
      // Default root object
      defaultRootObject: 'index.html',
      
      // Error pages configuration
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(5),
        },
      ],
      
      // Geographic restrictions (optional)
      // geoRestriction: cloudfront.GeoRestriction.allowlist(['US', 'CA']), // Example: Allow only US and Canada
      
      // Price class for cost optimization
      priceClass: props.stageName === 'prod' 
        ? cloudfront.PriceClass.PRICE_CLASS_ALL 
        : cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe for dev
      
      // Enable IPv6
      enableIpv6: true,
      
      // Logging configuration (optional, costs extra)
      enableLogging: props.stageName === 'prod',
      logBucket: props.stageName === 'prod' ? new s3.Bucket(this, 'LogsBucket', {
        bucketName: `devops-portfolio-logs-${props.stageName}-${this.account}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }) : undefined,
    });

    // Deploy frontend assets to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, '../../frontend')),
        // Inject API URL into frontend configuration
        s3deploy.Source.jsonData('config.json', {
          apiUrl: props.apiUrl,
          environment: props.stageName,
          version: process.env.CODEBUILD_BUILD_NUMBER || 'local',
        }),
      ],
      destinationBucket: this.websiteBucket,
      distribution,
      distributionPaths: ['/*'], // Invalidate all paths on deployment
      
      // Deployment configuration
      memoryLimit: 512, // MB for deployment Lambda
      ephemeralStorageSize: cdk.Size.mebibytes(1024),
    });

    // Store distribution URL
    this.distributionUrl = `https://${distribution.distributionDomainName}`;

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: this.distributionUrl,
      description: 'CloudFront distribution URL',
      exportName: `${props.stageName}-distribution-url`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${props.stageName}-distribution-id`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.websiteBucket.bucketName,
      description: 'S3 bucket name for static assets',
      exportName: `${props.stageName}-s3-bucket-name`,
    });
  }
}