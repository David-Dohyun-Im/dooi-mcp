/**
 * Tool name→handler mapping and export for dooi-mcp server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../core/logger.js';

// Import tool handlers
import { handleList } from './list.js';
import { handleFetch } from './fetch.js';
import { handleResolveUses } from './resolveUses.js';
import { handleFetchBatch } from './fetchBatch.js';
import { handleInstall } from './install.js';
import { handleTextEdit } from './textEdit.js';
import { handleInstallDeps } from './installDeps.js';
import { handleApplyComponent } from './workflow/applyComponent.js';
import { handleApplyTemplate } from './workflow/applyTemplate.js';

// Tool registry
export const toolHandlers = new Map<string, (args: unknown) => Promise<unknown>>([
  ['dooi.list', handleList],
  ['dooi.fetch', handleFetch],
  ['dooi.resolve.uses', handleResolveUses],
  ['dooi.fetchBatch', handleFetchBatch],
  ['dooi.install', handleInstall],
  ['dooi.textEdit', handleTextEdit],
  ['dooi.installDeps', handleInstallDeps],
  ['dooi.workflow.applyComponent', handleApplyComponent],
  ['dooi.workflow.applyTemplate', handleApplyTemplate]
]);

// Tool definitions for MCP server
export const tools: Tool[] = [
  {
    name: 'dooi.list',
    description: 'Enumerate available templates/components from dooi-ui',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'dooi.fetch',
    description: 'Fetch a template/component into a staging directory',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Template/component ID to fetch' },
        ref: { type: 'string', description: 'Optional reference/version' },
        options: {
          type: 'object',
          properties: {
            timeoutMs: { type: 'number', description: 'Timeout in milliseconds' },
            env: { type: 'object', description: 'Environment variables' }
          }
        }
      },
      required: ['id']
    }
  },
  {
    name: 'dooi.resolve.uses',
    description: 'Derive additional required component IDs from staging directory',
    inputSchema: {
      type: 'object',
      properties: {
        stageDir: { type: 'string', description: 'Path to staging directory' }
      },
      required: ['stageDir']
    }
  },
  {
    name: 'dooi.fetchBatch',
    description: 'Fetch multiple components/templates at once',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Array of component/template IDs to fetch'
        }
      },
      required: ['ids']
    }
  },
  {
    name: 'dooi.install',
    description: 'Copy files from staging directory to project with preview',
    inputSchema: {
      type: 'object',
      properties: {
        stageDir: { type: 'string', description: 'Path to staging directory' },
        destRoot: { type: 'string', description: 'Destination project root' },
        pathMap: { type: 'object', description: 'Path mapping configuration' },
        include: { type: 'array', items: { type: 'string' }, description: 'Include patterns' },
        exclude: { type: 'array', items: { type: 'string' }, description: 'Exclude patterns' },
        mode: { type: 'string', enum: ['skip', 'overwrite', 'rename'], description: 'Conflict resolution mode' },
        dryRun: { type: 'boolean', description: 'Preview mode without actual changes' }
      },
      required: ['stageDir', 'destRoot']
    }
  },
  {
    name: 'dooi.textEdit',
    description: 'Perform text-only replacements preserving code structure',
    inputSchema: {
      type: 'object',
      properties: {
        destRoot: { type: 'string', description: 'Project root directory' },
        plan: {
          type: 'object',
          properties: {
            include: { type: 'array', items: { type: 'string' }, description: 'File patterns to include' },
            exclude: { type: 'array', items: { type: 'string' }, description: 'File patterns to exclude' },
            replacements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  find: { type: 'string', description: 'Exact string to find' },
                  findRegex: { type: 'string', description: 'Regex pattern to find' },
                  replaceWith: { type: 'string', description: 'Replacement text' }
                }
              },
              description: 'Text replacement specifications'
            },
            options: {
              type: 'object',
              properties: {
                dryRun: { type: 'boolean', description: 'Preview mode' },
                limitChangedFiles: { type: 'number', description: 'Maximum files to change' },
                previewContextLines: { type: 'number', description: 'Context lines for preview' }
              }
            }
          },
          required: ['include', 'replacements']
        }
      },
      required: ['destRoot', 'plan']
    }
  },
  {
    name: 'dooi.installDeps',
    description: 'Install npm packages using specified package manager',
    inputSchema: {
      type: 'object',
      properties: {
        cwd: { type: 'string', description: 'Working directory' },
        packages: { type: 'array', items: { type: 'string' }, description: 'Packages to install' },
        pm: { type: 'string', enum: ['npm', 'yarn', 'pnpm'], description: 'Package manager' },
        flags: { type: 'array', items: { type: 'string' }, description: 'Additional flags' }
      },
      required: ['cwd', 'packages']
    }
  },
  {
    name: 'dooi.workflow.applyComponent',
    description: 'One-shot component installation workflow',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component ID' },
        destRoot: { type: 'string', description: 'Destination project root' },
        brand: { type: 'string', description: 'Brand name for text replacements' },
        pathStrategy: { type: 'string', enum: ['next-app', 'vite-react'], description: 'Path strategy' },
        pathMap: { type: 'object', description: 'Custom path mapping' },
        editPlan: { type: 'object', description: 'Text edit plan' },
        autoDeps: { type: 'boolean', description: 'Auto-install dependencies' }
      },
      required: ['id', 'destRoot']
    }
  },
  {
    name: 'dooi.workflow.applyTemplate',
    description: 'One-shot template installation workflow',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Template ID' },
        destRoot: { type: 'string', description: 'Destination project root' },
        brand: { type: 'string', description: 'Brand name for text replacements' },
        pathStrategy: { type: 'string', enum: ['next-app', 'vite-react'], description: 'Path strategy' },
        pathMap: { type: 'object', description: 'Custom path mapping' },
        editPlan: { type: 'object', description: 'Text edit plan' },
        autoDeps: { type: 'boolean', description: 'Auto-install dependencies' }
      },
      required: ['id', 'destRoot']
    }
  }
];

export async function handleToolCall(name: string, args: unknown): Promise<unknown> {
  const handler = toolHandlers.get(name);
  
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }

  try {
    logger.debug(`Handling tool call: ${name}`, args);
    const result = await handler(args);
    logger.debug(`Tool call completed: ${name}`, { success: true });
    return result;
  } catch (error) {
    logger.error(`Tool call failed: ${name}`, error);
    throw error;
  }
}
