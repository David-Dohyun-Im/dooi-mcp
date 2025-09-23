/**
 * dooi.install tool implementation
 */

import { InstallInputSchema, type InstallInput, type InstallOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat } from 'fs/promises';
import { createCopyPlan, executeCopyPlan } from '../../core/copy.js';
import { getNextAppPathMapping } from '../../core/config/pathStrategies/next-app.js';
import { DEFAULT_INCLUDE_PATTERNS, DEFAULT_EXCLUDE_PATTERNS } from '../../core/config/defaults.js';

export async function handleInstall(args: unknown): Promise<InstallOutput> {
  // Validate input
  const input = InstallInputSchema.parse(args);
  
  logger.debug('Handling dooi.install request', input);
  
  try {
    // Check if staging directory exists
    try {
      await stat(input.stageDir);
    } catch {
      throw createError(ErrorCode.STAGE_MISSING, 
        'Staging directory does not exist',
        { stageDir: input.stageDir }
      );
    }
    
    // Set up options with defaults
    const include = input.include || DEFAULT_INCLUDE_PATTERNS;
    const exclude = input.exclude || DEFAULT_EXCLUDE_PATTERNS;
    const mode = input.mode || 'skip';
    const dryRun = input.dryRun !== undefined ? input.dryRun : true; // Default to dry-run for safety
    
    // Apply path mapping strategy if not provided
    let pathMap = input.pathMap;
    if (!pathMap) {
      // Default to Next.js App Router strategy
      pathMap = getNextAppPathMapping();
      logger.debug('Applied default Next.js App Router path mapping');
    }
    
    // Create copy plan
    const copyOptions = {
      stageDir: input.stageDir,
      destRoot: input.destRoot,
      pathMap,
      include,
      exclude,
      mode,
      dryRun
    };
    
    const plan = await createCopyPlan(copyOptions);
    
    if (dryRun) {
      logger.debug('Dry run mode - returning plan without execution');
      return {
        actions: plan.actions,
        count: plan.count
      };
    }
    
    // Execute the copy plan
    const result = await executeCopyPlan(plan, false);
    
    logger.debug('Installation completed', {
      installed: result.installed.length,
      skipped: result.skipped.length,
      overwritten: result.overwritten.length,
      renamed: result.renamed.length
    });
    
    return {
      installed: result.installed,
      skipped: result.skipped,
      overwritten: result.overwritten,
      renamed: result.renamed
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.install', error);
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error in dooi.install',
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
  }
}
