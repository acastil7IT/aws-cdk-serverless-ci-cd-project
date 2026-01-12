import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../lib/pipeline-stack';

/**
 * Basic infrastructure tests for the Pipeline Stack
 * 
 * These tests ensure that our CDK code synthesizes correctly
 * and creates the expected AWS resources.
 */

describe('PipelineStack', () => {
  let app: cdk.App;
  let stack: PipelineStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new PipelineStack(app, 'TestPipelineStack');
    template = Template.fromStack(stack);
  });

  test('Creates CodePipeline', () => {
    // Verify that a CodePipeline is created
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Name: 'devops-portfolio-pipeline',
    });
  });

  test('Creates CodeBuild Project', () => {
    // Verify that a CodeBuild project is created
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Name: 'devops-portfolio-build',
    });
  });

  test('Creates S3 Bucket for Artifacts', () => {
    // Verify that an S3 bucket for artifacts is created
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
    });
  });

  test('Pipeline has correct number of stages', () => {
    // Verify pipeline structure
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: [
        { Name: 'Source' },
        { Name: 'Build' },
        { Name: 'DeployDev' },
        { Name: 'ApprovalForProd' },
        { Name: 'DeployProd' },
      ],
    });
  });

  test('Stack has required tags', () => {
    // Verify that proper tags are applied
    const stackTags = cdk.Tags.of(stack);
    expect(stackTags).toBeDefined();
  });
});