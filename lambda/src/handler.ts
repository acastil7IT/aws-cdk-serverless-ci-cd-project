import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

/**
 * DevOps Portfolio API Lambda Handler
 * 
 * This Lambda function demonstrates enterprise-grade API development patterns:
 * - Proper error handling and logging
 * - CORS support for frontend integration
 * - Health check endpoints for monitoring
 * - RESTful API design
 * - Environment-aware configuration
 * 
 * Routes:
 * - GET /health - Health check endpoint
 * - GET /api/v1/items - List items
 * - POST /api/v1/items - Create item
 * - GET /api/v1/items/{id} - Get specific item
 * - PUT /api/v1/items/{id} - Update item
 * - DELETE /api/v1/items/{id} - Delete item
 */

// Types for our API
interface Item {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// In-memory storage for demo purposes
// In production, this would be DynamoDB, RDS, or another persistent store
let items: Item[] = [
  {
    id: '1',
    name: 'Sample Item 1',
    description: 'This is a sample item to demonstrate the API',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Sample Item 2',
    description: 'Another sample item showing CRUD operations',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

/**
 * Main Lambda handler function
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Log the incoming request for debugging
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  try {
    // Extract request information
    const { httpMethod, path, body } = event;
    
    // Create safe pathParameters object - remove undefined values or set to null
    const pathParameters = event.pathParameters 
      ? Object.fromEntries(
          Object.entries(event.pathParameters)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, value as string])
        )
      : null;
    const stage = process.env.STAGE || 'dev';
    
    console.log(`Processing ${httpMethod} request to ${path} in ${stage} environment`);

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // In production, specify exact origins
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Content-Type': 'application/json',
    };

    // Handle preflight OPTIONS requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight successful' }),
      };
    }

    // Route the request
    let response: ApiResponse;

    if (path === '/health') {
      response = await handleHealthCheck();
    } else if (path.startsWith('/api/v1/items')) {
      response = await handleItemsApi(httpMethod, path, pathParameters, body);
    } else {
      response = {
        success: false,
        error: 'Not Found',
        message: `Path ${path} not found`,
      };
      return createResponse(404, response, corsHeaders);
    }

    // Return successful response
    return createResponse(200, response, corsHeaders);

  } catch (error) {
    console.error('Error processing request:', error);
    
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    };

    return createResponse(500, errorResponse, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    });
  }
};

/**
 * Health check endpoint - critical for load balancers and monitoring
 */
async function handleHealthCheck(): Promise<ApiResponse> {
  const stage = process.env.STAGE || 'dev';
  const timestamp = new Date().toISOString();
  
  return {
    success: true,
    data: {
      status: 'healthy',
      environment: stage,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
    message: 'Service is healthy and operational',
  };
}

/**
 * Handle CRUD operations for items
 */
async function handleItemsApi(
  method: string,
  path: string,
  pathParameters: { [name: string]: string } | null,
  body: string | null
): Promise<ApiResponse> {
  
  switch (method) {
    case 'GET':
      if (pathParameters?.id) {
        return getItem(pathParameters.id);
      } else {
        return listItems();
      }
    
    case 'POST':
      return createItem(body);
    
    case 'PUT':
      if (pathParameters?.id) {
        return updateItem(pathParameters.id, body);
      } else {
        return {
          success: false,
          error: 'Bad Request',
          message: 'Item ID is required for PUT requests',
        };
      }
    
    case 'DELETE':
      if (pathParameters?.id) {
        return deleteItem(pathParameters.id);
      } else {
        return {
          success: false,
          error: 'Bad Request',
          message: 'Item ID is required for DELETE requests',
        };
      }
    
    default:
      return {
        success: false,
        error: 'Method Not Allowed',
        message: `HTTP method ${method} is not supported`,
      };
  }
}

/**
 * List all items
 */
async function listItems(): Promise<ApiResponse> {
  console.log(`Listing ${items.length} items`);
  
  return {
    success: true,
    data: {
      items,
      count: items.length,
    },
    message: 'Items retrieved successfully',
  };
}

/**
 * Get a specific item by ID
 */
async function getItem(id: string): Promise<ApiResponse> {
  console.log(`Getting item with ID: ${id}`);
  
  const item = items.find(item => item.id === id);
  
  if (!item) {
    return {
      success: false,
      error: 'Not Found',
      message: `Item with ID ${id} not found`,
    };
  }
  
  return {
    success: true,
    data: { item },
    message: 'Item retrieved successfully',
  };
}

/**
 * Create a new item
 */
async function createItem(body: string | null): Promise<ApiResponse> {
  if (!body) {
    return {
      success: false,
      error: 'Bad Request',
      message: 'Request body is required',
    };
  }
  
  try {
    const { name, description } = JSON.parse(body);
    
    if (!name || !description) {
      return {
        success: false,
        error: 'Bad Request',
        message: 'Name and description are required',
      };
    }
    
    const newItem: Item = {
      id: (items.length + 1).toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    items.push(newItem);
    
    console.log(`Created new item with ID: ${newItem.id}`);
    
    return {
      success: true,
      data: { item: newItem },
      message: 'Item created successfully',
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
    };
  }
}

/**
 * Update an existing item
 */
async function updateItem(id: string, body: string | null): Promise<ApiResponse> {
  if (!body) {
    return {
      success: false,
      error: 'Bad Request',
      message: 'Request body is required',
    };
  }
  
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return {
      success: false,
      error: 'Not Found',
      message: `Item with ID ${id} not found`,
    };
  }
  
  try {
    const { name, description } = JSON.parse(body);
    
    if (name) items[itemIndex].name = name;
    if (description) items[itemIndex].description = description;
    items[itemIndex].updatedAt = new Date().toISOString();
    
    console.log(`Updated item with ID: ${id}`);
    
    return {
      success: true,
      data: { item: items[itemIndex] },
      message: 'Item updated successfully',
    };
    
  } catch (error) {
    return {
      success: false,
      error: 'Bad Request',
      message: 'Invalid JSON in request body',
    };
  }
}

/**
 * Delete an item
 */
async function deleteItem(id: string): Promise<ApiResponse> {
  const itemIndex = items.findIndex(item => item.id === id);
  
  if (itemIndex === -1) {
    return {
      success: false,
      error: 'Not Found',
      message: `Item with ID ${id} not found`,
    };
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  
  console.log(`Deleted item with ID: ${id}`);
  
  return {
    success: true,
    data: { item: deletedItem },
    message: 'Item deleted successfully',
  };
}

/**
 * Create a standardized API Gateway response
 */
function createResponse(
  statusCode: number,
  body: ApiResponse,
  headers: { [header: string]: string }
): APIGatewayProxyResult {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body, null, 2),
  };
}