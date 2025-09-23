/**
 * Main MCP server entry point for dooi-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { DooiTransport } from './adapters/mcp/transport.js';
import { handleToolCall, tools } from './capabilities/tools/index.js';
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
      tools: {}
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
