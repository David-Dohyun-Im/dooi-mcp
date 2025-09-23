/**
 * Stdio transport wrapper for MCP server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from '../../core/logger.js';

export class DooiTransport {
  private server: Server;
  private transport: StdioServerTransport;

  constructor(server: Server) {
    this.server = server;
    this.transport = new StdioServerTransport();
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting dooi-mcp server with stdio transport');
      await this.server.connect(this.transport);
      logger.info('Dooi-mcp server started successfully');
    } catch (error) {
      logger.error('Failed to start dooi-mcp server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('Stopping dooi-mcp server');
      await this.server.close();
      logger.info('Dooi-mcp server stopped');
    } catch (error) {
      logger.error('Error stopping dooi-mcp server:', error);
      throw error;
    }
  }

  getServer(): Server {
    return this.server;
  }

  getTransport(): StdioServerTransport {
    return this.transport;
  }
}
