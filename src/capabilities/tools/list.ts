/**
 * dooi.list tool implementation
 */

import { ListInputSchema, ListOutputSchema, type ListInput, type ListOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';

export async function handleList(args: unknown): Promise<ListOutput> {
  // Validate input
  const input = ListInputSchema.parse(args);
  
  logger.debug('Handling dooi.list request', input);
  
  try {
    // Try to run npx dooi-ui list
    const { execa } = await import('execa');
    
    const result = await execa('npx', ['dooi-ui', 'list'], {
      timeout: 30000,
      reject: false
    });
    
    if (result.exitCode !== 0) {
      logger.warn('dooi-ui list command failed', { 
        exitCode: result.exitCode, 
        stderr: result.stderr 
      });
      
      // If command not found, provide guidance
      if (result.stderr.includes('command not found') || result.stderr.includes('not found')) {
        throw createError(ErrorCode.CLI_NOT_FOUND);
      }
      
      throw createError(ErrorCode.LIST_UNAVAILABLE, 
        'Unable to list available templates/components',
        {
          exitCode: result.exitCode,
          stderr: result.stderr
        }
      );
    }
    
    // Parse the output to extract items
    const items = parseListOutput(result.stdout);
    
    logger.debug('Successfully listed items', { count: items.length });
    
    return {
      items,
      raw: {
        stdout: result.stdout,
        stderr: result.stderr
      }
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.list', error);
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error in dooi.list',
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

function parseListOutput(stdout: string): Array<{ id: string; type: 'template' | 'component'; title: string; description: string }> {
  const items: Array<{ id: string; type: 'template' | 'component'; title: string; description: string }> = [];
  
  const lines = stdout.split('\n');
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect sections
    if (trimmed.includes('📦 Components:')) {
      currentSection = 'components';
      continue;
    }
    
    if (trimmed.includes('🏗️ Templates:')) {
      currentSection = 'templates';
      continue;
    }
    
    // Skip usage instructions and empty lines
    if (trimmed.startsWith('Usage:') || trimmed.startsWith('npx') || !trimmed || trimmed.startsWith('🎨')) {
      continue;
    }
    
    // Parse component items (• Cards/ShuffleGridDemo)
    if (currentSection === 'components' && trimmed.startsWith('• ')) {
      const id = trimmed.substring(2).trim(); // Remove "• "
      items.push({
        id,
        type: 'component',
        title: id,
        description: 'Component from dooi-ui'
      });
      continue;
    }
    
    // Parse template items (• landing-morphic: Landing – Morphic Dreams)
    if (currentSection === 'templates' && trimmed.startsWith('• ')) {
      const templateText = trimmed.substring(2).trim(); // Remove "• "
      const colonIndex = templateText.indexOf(':');
      
      if (colonIndex > 0) {
        const id = templateText.substring(0, colonIndex).trim();
        const description = templateText.substring(colonIndex + 1).trim();
        
        items.push({
          id,
          type: 'template',
          title: id,
          description
        });
      } else {
        // Fallback if no colon found
        items.push({
          id: templateText,
          type: 'template',
          title: templateText,
          description: 'Template from dooi-ui'
        });
      }
      continue;
    }
  }
  
  // If no items were parsed, create a placeholder
  if (items.length === 0) {
    logger.warn('No items could be parsed from dooi-ui list output', { stdout });
    
    // Return a placeholder item to indicate the command worked but parsing failed
    items.push({
      id: 'parsing-failed',
      type: 'component',
      title: 'Parsing Failed',
      description: 'Unable to parse dooi-ui list output. Raw output available in response.'
    });
  }
  
  return items;
}
