/**
 * Main MCP server entry point for dooi-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  InitializeRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { DooiTransport } from './adapters/mcp/transport.js';
import { handleToolCall, tools } from './capabilities/tools/index.js';
import { getDooiResources, getResourceContent } from './capabilities/resources/index.js';
import { getDooiPrompts, executePrompt } from './capabilities/prompts/index.js';
import { logger } from './core/logger.js';
import { createError, ErrorCode } from './core/errors.js';

// Create MCP server
const server = new Server(
  {
    name: 'dooi-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {
        listChanged: true
      },
      resources: {
        subscribe: false,
        listChanged: true
      },
      prompts: {
        listChanged: true
      }
    }
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing available tools');
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    logger.debug(`Calling tool: ${name}`, args);
    const result = await handleToolCall(name, args);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  } catch (error) {
    logger.error(`Tool call failed: ${name}`, error);
    
    // Handle known errors
    if (error instanceof Error && 'code' in error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              code: (error as any).code,
              message: error.message,
              details: (error as any).details,
              actionable: (error as any).actionable
            }, null, 2)
          }
        ],
        isError: true
      };
    }
    
    // Handle unknown errors
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            code: ErrorCode.INTERNAL_ERROR,
            message: 'Internal server error',
            details: { originalError: error instanceof Error ? error.message : String(error) }
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Register initialization
server.setRequestHandler(InitializeRequestSchema, async (request) => {
  logger.debug('Server initialization request', request.params);
  return {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {
        listChanged: true
      },
      resources: {
        subscribe: false,
        listChanged: true
      },
      prompts: {
        listChanged: true
      }
    },
    serverInfo: {
      name: 'dooi-mcp',
      version: '1.0.0'
    }
  };
});

// Handle notifications
(server as any).onnotification = async (notification: any) => {
  logger.debug('Received notification:', notification.method);
  if (notification.method === 'notifications/initialized') {
    logger.debug('Client initialized notification received');
  }
};

// Register resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  logger.debug('Listing available resources');
  try {
    const resources = await getDooiResources();
    return { resources };
  } catch (error) {
    logger.error('Failed to list resources', error);
    return { resources: [] };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  try {
    logger.debug(`Reading resource: ${uri}`);
    const resource = await getResourceContent(uri);
    
    if (!resource) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              message: `Resource not found: ${uri}`
            }, null, 2)
          }
        ],
        isError: true
      };
    }
    
    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: resource.content || ''
        }
      ]
    };
  } catch (error) {
    logger.error(`Failed to read resource: ${uri}`, error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            message: `Failed to read resource: ${uri}`,
            details: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Register prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  logger.debug('Listing available prompts');
  try {
    const prompts = getDooiPrompts();
    return { prompts };
  } catch (error) {
    logger.error('Failed to list prompts', error);
    return { prompts: [] };
  }
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    logger.debug(`Getting prompt: ${name}`, args);
    const content = await executePrompt(name, args || {});
    
    return {
      description: `Execute the ${name} prompt`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: content
          }
        }
      ]
    };
  } catch (error) {
    logger.error(`Failed to get prompt: ${name}`, error);
    return {
      description: `Error executing ${name} prompt`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Error executing prompt: ${error instanceof Error ? error.message : String(error)}`
          }
        }
      ]
    };
  }
});

// Start server
async function main() {
  try {
    const transport = new DooiTransport(server);
    await transport.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully');
      await transport.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      await transport.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
  });
}
