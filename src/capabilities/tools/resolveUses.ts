/**
 * dooi.resolve.uses tool implementation
 */

import { ResolveUsesInputSchema, type ResolveUsesInput, type ResolveUsesOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export async function handleResolveUses(args: unknown): Promise<ResolveUsesOutput> {
  // Validate input
  const input = ResolveUsesInputSchema.parse(args);
  
  logger.debug('Handling dooi.resolve.uses request', input);
  
  try {
    // Implement dependency resolution logic by reading meta.json
    let requiredIds: string[] = [];
    
    try {
      const metaPath = join(input.stageDir, 'meta.json');
      const metaContent = await readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      
      // Extract required component IDs from metadata
      if (meta.uses && Array.isArray(meta.uses)) {
        requiredIds = meta.uses;
      }
      
      logger.debug('Resolved uses from metadata', { 
        stageDir: input.stageDir, 
        requiredIds 
      });
      
    } catch (metaError) {
      // Fallback: scan files for import statements
      try {
        const files = await readdir(input.stageDir);
        const tsxFiles = files.filter(file => file.endsWith('.tsx') || file.endsWith('.ts'));
        
        for (const file of tsxFiles) {
          try {
            const content = await readFile(join(input.stageDir, file), 'utf8');
            
            // Look for dooi component imports (e.g., import { LavaLamp } from "../ui/fluid-blob")
            const importMatches = content.match(/import.*from\s+["']\.\.\/ui\/([^"']+)["']/g);
            if (importMatches) {
              importMatches.forEach(match => {
                const componentMatch = match.match(/["']\.\.\/ui\/([^"']+)["']/);
                if (componentMatch) {
                  const componentId = `ui/${componentMatch[1]}`;
                  if (!requiredIds.includes(componentId)) {
                    requiredIds.push(componentId);
                  }
                }
              });
            }
          } catch (fileError) {
            logger.warn('Failed to read file for dependency resolution', { 
              file, 
              error: fileError instanceof Error ? fileError.message : String(fileError) 
            });
          }
        }
        
        logger.debug('Resolved uses from file scanning', { 
          stageDir: input.stageDir, 
          requiredIds 
        });
        
      } catch (scanError) {
        logger.warn('Failed to scan files for dependency resolution', { 
          stageDir: input.stageDir,
          error: scanError instanceof Error ? scanError.message : String(scanError) 
        });
      }
    }
    
    return {
      requiredIds
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.resolve.uses', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
