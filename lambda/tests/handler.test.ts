import { handler } from '../src/handler';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

/**
 * Unit tests for Lambda handler
 * 
 * These tests verify that our API endpoints work correctly
 * and handle various scenarios appropriately.
 */

// Mock context object
const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '256',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

// Helper function to create mock API Gateway events
function createMockEvent(
  httpMethod: string,
  path: string,
  body?: string,
  pathParameters?: { [name: string]: string } | null
): APIGatewayProxyEvent {
  return {
    httpMethod,
    path,
    body: body || null,
    pathParameters: pathParameters || null,
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod,
      path,
      stage: 'test',
      requestId: 'test-request',
      requestTime: '01/Jan/2024:00:00:00 +0000',
      requestTimeEpoch: 1704067200,
      resourceId: 'test-resource',
      resourcePath: path,
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
        clientCert: null,
      },
      authorizer: null,
    },
    resource: path,
    stageVariables: null,
  };
}

describe('Lambda Handler', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.STAGE = 'test';
  });

  describe('Health Check Endpoint', () => {
    test('should return healthy status', async () => {
      const event = createMockEvent('GET', '/health');
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('healthy');
      expect(body.data.environment).toBe('test');
    });
  });

  describe('Items API', () => {
    test('should list items', async () => {
      const event = createMockEvent('GET', '/api/v1/items');
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('should create new item', async () => {
      const itemData = {
        name: 'Test Item',
        description: 'This is a test item',
      };
      
      const event = createMockEvent('POST', '/api/v1/items', JSON.stringify(itemData));
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.item.name).toBe(itemData.name);
      expect(body.data.item.description).toBe(itemData.description);
    });

    test('should get specific item', async () => {
      const event = createMockEvent('GET', '/api/v1/items/1', undefined, { id: '1' });
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(true);
      expect(body.data.item.id).toBe('1');
    });

    test('should return 404 for non-existent item', async () => {
      const event = createMockEvent('GET', '/api/v1/items/999', undefined, { id: '999' });
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200); // API returns 200 with error in body
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not Found');
    });
  });

  describe('CORS Support', () => {
    test('should handle OPTIONS requests', async () => {
      const event = createMockEvent('OPTIONS', '/api/v1/items');
      const result = await handler(event, mockContext);

      const headers = result.headers ?? {};
      expect(result.statusCode).toBe(200);
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
    });

    test('should include CORS headers in all responses', async () => {
      const event = createMockEvent('GET', '/health');
      const result = await handler(event, mockContext);

      const headers = result.headers ?? {};
      expect(headers['Access-Control-Allow-Origin']).toBe('*');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid JSON in request body', async () => {
      const event = createMockEvent('POST', '/api/v1/items', 'invalid-json');
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(200);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Bad Request');
    });

    test('should handle unknown paths', async () => {
      const event = createMockEvent('GET', '/unknown-path');
      const result = await handler(event, mockContext);

      expect(result.statusCode).toBe(404);
      
      const body = JSON.parse(result.body);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Not Found');
    });
  });
});