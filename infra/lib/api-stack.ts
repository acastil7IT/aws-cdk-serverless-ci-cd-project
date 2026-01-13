import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

/**
 * API Stack - Lambda Functions + API Gateway
 * 
 * This stack creates:
 * - Lambda function with our application code
 * - API Gateway REST API with proper CORS configuration
 * - CloudWatch log groups for monitoring
 * - IAM roles with least-privilege access
 * 
 * Demonstrates enterprise patterns:
 * - Proper error handling and logging
 * - Security best practices (CORS, throttling)
 * - Cost optimization (ARM64, appropriate memory sizing)
 */

export interface ApiStackProps extends cdk.StackProps {
  /** Environment name (dev, prod, etc.) */
  stageName: string;
  
  /** Whether to enable detailed monitoring and X-Ray tracing */
  enableDetailedMonitoring?: boolean;
}

export class ApiStack extends cdk.Stack {
  /** API Gateway URL */
  public readonly apiUrl: string;
  
  /** Lambda function for external reference */
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create CloudWatch log group for Lambda function
    // Explicit log group creation allows us to set retention and control costs
    const logGroup = new logs.LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/aws/lambda/devops-portfolio-api-${props.stageName}`,
      retention: props.stageName === 'prod' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK, // Cost optimization: shorter retention for dev
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Safe for demo project
    });

    // Create IAM role for Lambda with least-privilege permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Lambda execution role for ${props.stageName} API`,
      managedPolicies: [
        // Basic Lambda execution permissions
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        // Custom policy for CloudWatch logging
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'ApiFunction', {
      functionName: `devops-portfolio-api-${props.stageName}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64, // Cost optimization: ARM64 is cheaper
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda')),
      role: lambdaRole,
      
      // Performance and cost optimization
      memorySize: 256, // Minimal memory for simple API
      timeout: cdk.Duration.seconds(30),
      
      // Environment variables
      environment: {
        STAGE: props.stageName,
        LOG_LEVEL: props.stageName === 'prod' ? 'INFO' : 'DEBUG',
        NODE_ENV: props.stageName === 'prod' ? 'production' : 'development',
      },
      
      // Monitoring configuration
      logGroup: logGroup,
      tracing: props.enableDetailedMonitoring 
        ? lambda.Tracing.ACTIVE 
        : lambda.Tracing.DISABLED,
      
      // Security
      reservedConcurrentExecutions: props.stageName === 'prod' ? 100 : 10, // Prevent runaway costs
      
      description: `API Lambda function for ${props.stageName} environment - DevOps Portfolio Project`,
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `devops-portfolio-api-${props.stageName}`,
      description: `REST API for DevOps Portfolio Project - ${props.stageName} environment`,
      
      // CORS configuration for frontend integration
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // In production, specify exact origins
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
      
      // API Gateway configuration
      deployOptions: {
        stageName: props.stageName,
        // Enable access logging
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiAccessLogGroup', {
            logGroupName: `/aws/apigateway/devops-portfolio-${props.stageName}`,
            retention: props.stageName === 'prod' 
              ? logs.RetentionDays.ONE_MONTH 
              : logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          })
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: false,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      
      // Enable CloudWatch metrics
      cloudWatchRole: true,
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(this.lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      proxy: true, // Enable Lambda proxy integration
    });

    // Add API routes
    
    // Health check endpoint - critical for load balancers and monitoring
    const healthResource = api.root.addResource('health');
    healthResource.addMethod('GET', lambdaIntegration, {
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // API v1 endpoints
    const v1Resource = api.root.addResource('api').addResource('v1');
    
    // Example endpoint for demonstration
    const itemsResource = v1Resource.addResource('items');
    itemsResource.addMethod('GET', lambdaIntegration);
    itemsResource.addMethod('POST', lambdaIntegration);
    
    // Individual item endpoint
    const itemResource = itemsResource.addResource('{id}');
    itemResource.addMethod('GET', lambdaIntegration);
    itemResource.addMethod('PUT', lambdaIntegration);
    itemResource.addMethod('DELETE', lambdaIntegration);

    // Store API URL for cross-stack reference
    this.apiUrl = api.url;

    // CloudFormation outputs for pipeline and monitoring
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiUrl,
      description: 'API Gateway endpoint URL',
      exportName: `${props.stageName}-api-gateway-url`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda function name',
      exportName: `${props.stageName}-lambda-function-name`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda function ARN',
      exportName: `${props.stageName}-lambda-function-arn`,
    });
  }
}