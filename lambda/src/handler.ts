import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || '';
const STAGE = process.env.STAGE || 'dev';

interface Item {
  id: string;
  type: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Main Lambda handler
 * Routes requests to appropriate handlers based on HTTP method and path
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const path = event.path;
  const method = event.httpMethod;

  try {
    // Health check endpoint
    if (path === '/health' && method === 'GET') {
      return handleHealthCheck();
    }

    // Items endpoints
    if (path === '/api/v1/items' && method === 'GET') {
      return await handleGetItems();
    }

    if (path === '/api/v1/items' && method === 'POST') {
      return await handleCreateItem(event);
    }

    if (path.startsWith('/api/v1/items/') && method === 'GET') {
      const id = path.split('/').pop();
      return await handleGetItem(id!);
    }

    if (path.startsWith('/api/v1/items/') && method === 'PUT') {
      const id = path.split('/').pop();
      return await handleUpdateItem(id!, event);
    }

    if (path.startsWith('/api/v1/items/') && method === 'DELETE') {
      const id = path.split('/').pop();
      return await handleDeleteItem(id!);
    }

    // Route not found
    return createResponse(404, {
      success: false,
      message: 'Route not found',
      path,
      method,
    });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, {
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Health check endpoint
 * Returns system status and metadata
 */
function handleHealthCheck(): APIGatewayProxyResult {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  return createResponse(200, {
    success: true,
    data: {
      status: 'healthy',
      environment: STAGE,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime,
      memory: {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external,
        arrayBuffers: memory.arrayBuffers,
      },
      table: TABLE_NAME,
    },
    message: 'Service is healthy and operational',
  });
}

/**
 * Get all items from DynamoDB
 */
async function handleGetItems(): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type',
      },
      ExpressionAttributeValues: {
        ':type': 'item',
      },
    });

    const result = await docClient.send(command);
    const items = (result.Items || []) as Item[];

    // Sort by creation date (newest first)
    items.sort((a, b) => b.createdAt - a.createdAt);

    return createResponse(200, {
      success: true,
      data: {
        items,
        count: items.length,
      },
      message: 'Items retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting items:', error);
    throw error;
  }
}

/**
 * Get a single item by ID
 */
async function handleGetItem(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return createResponse(404, {
        success: false,
        message: 'Item not found',
      });
    }

    return createResponse(200, {
      success: true,
      data: {
        item: result.Item,
      },
      message: 'Item retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

/**
 * Create a new item
 */
async function handleCreateItem(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    
    if (!body.name || !body.description) {
      return createResponse(400, {
        success: false,
        message: 'Missing required fields: name and description',
      });
    }

    const now = Date.now();
    const item: Item = {
      id: randomUUID(),
      type: 'item',
      name: body.name,
      description: body.description,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    });

    await docClient.send(command);

    return createResponse(201, {
      success: true,
      data: {
        item,
      },
      message: 'Item created successfully',
    });
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

/**
 * Update an existing item
 */
async function handleUpdateItem(id: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const body = JSON.parse(event.body || '{}');
    
    if (!body.name && !body.description) {
      return createResponse(400, {
        success: false,
        message: 'At least one field (name or description) must be provided',
      });
    }

    // Check if item exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });
    const existing = await docClient.send(getCommand);

    if (!existing.Item) {
      return createResponse(404, {
        success: false,
        message: 'Item not found',
      });
    }

    // Build update expression
    const updates: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (body.name) {
      updates.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = body.name;
    }

    if (body.description) {
      updates.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = body.description;
    }

    updates.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = Date.now();

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${updates.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(updateCommand);

    return createResponse(200, {
      success: true,
      data: {
        item: result.Attributes,
      },
      message: 'Item updated successfully',
    });
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

/**
 * Delete an item
 */
async function handleDeleteItem(id: string): Promise<APIGatewayProxyResult> {
  try {
    // Check if item exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });
    const existing = await docClient.send(getCommand);

    if (!existing.Item) {
      return createResponse(404, {
        success: false,
        message: 'Item not found',
      });
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });

    await docClient.send(deleteCommand);

    return createResponse(200, {
      success: true,
      message: 'Item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    throw error;
  }
}

/**
 * Create a standardized API response
 */
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}
