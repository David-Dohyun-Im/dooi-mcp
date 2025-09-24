/**
 * dooi.fetchBatch tool implementation
 */

import { FetchBatchInputSchema, type FetchBatchInput, type FetchBatchOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { handleFetch } from './fetch.js';

export async function handleFetchBatch(args: unknown): Promise<FetchBatchOutput> {
  // Validate input
  const input = FetchBatchInputSchema.parse(args);
  
  logger.debug('Handling dooi.fetchBatch request', input);
  
  try {
    // Implement batch fetching logic
    const stages: Array<{
      id: string;
      stageDir: string;
      files: string[];
      meta: any;
      success: boolean;
      error?: string;
    }> = [];
    
    // Remove duplicates from input IDs
    const uniqueIds = [...new Set(input.ids)];
    
    logger.debug('Starting batch fetch', { 
      totalIds: input.ids.length, 
      uniqueIds: uniqueIds.length 
    });
    
    // Fetch each component individually
    for (const id of uniqueIds) {
      try {
        logger.debug(`Fetching component: ${id}`);
        
        const fetchResult = await handleFetch({ id });
        
        stages.push({
          id,
          stageDir: fetchResult.stageDir,
          files: fetchResult.files,
          meta: fetchResult.meta,
          success: true
        });
        
        logger.debug(`Successfully fetched: ${id}`, { 
          files: fetchResult.files.length,
          stageDir: fetchResult.stageDir 
        });
        
      } catch (fetchError) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        
        stages.push({
          id,
          stageDir: '',
          files: [],
          meta: null,
          success: false,
          error: errorMessage
        });
        
        logger.error(`Failed to fetch: ${id}`, { error: errorMessage });
      }
    }
    
    const successCount = stages.filter(s => s.success).length;
    const failureCount = stages.filter(s => !s.success).length;
    
    logger.debug('Batch fetch completed', { 
      total: stages.length,
      success: successCount,
      failures: failureCount 
    });
    
    return {
      stages
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.fetchBatch', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
