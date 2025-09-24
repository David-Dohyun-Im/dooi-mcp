/**
 * dooi.install tool implementation
 */

import { InstallInputSchema, type InstallInput, type InstallOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat, readFile } from 'fs/promises';
import { join } from 'path';
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
      // Try to read meta.json to determine optimal path mapping
      try {
        const metaPath = join(input.stageDir, 'meta.json');
        const metaContent = await readFile(metaPath, 'utf8');
        const meta = JSON.parse(metaContent);
        
        // Use smart path mapping based on component metadata
        pathMap = generateSmartPathMapping(meta);
        logger.debug('Applied smart path mapping based on metadata', { pathMap });
      } catch {
        // Fallback to default Next.js App Router strategy
        pathMap = getNextAppPathMapping();
        logger.debug('Applied default Next.js App Router path mapping');
      }
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

/**
 * Generate smart path mapping based on component metadata
 */
function generateSmartPathMapping(meta: any): Record<string, string> {
  const basePathMap: Record<string, string> = {
    'components/': 'src/components/',
    'ui/': 'src/components/ui/',
    'lib/': 'src/lib/',
    'hooks/': 'src/hooks/',
    'utils/': 'src/utils/',
    'types/': 'src/types/',
    'public/': 'public/',
    'assets/': 'public/assets/'
  };
  
  // Customize based on component category
  if (meta.category === 'Hero') {
    basePathMap['Hero/'] = 'src/components/Hero/';
  } else if (meta.category === 'Cards') {
    basePathMap['Cards/'] = 'src/components/Cards/';
  } else if (meta.category === 'ui') {
    basePathMap['ui/'] = 'src/components/ui/';
  }
  
  // Add specific mappings based on tags
  if (meta.tags) {
    if (meta.tags.includes('hero')) {
      basePathMap['components/hero/'] = 'src/components/Hero/';
    }
    if (meta.tags.includes('cards')) {
      basePathMap['components/cards/'] = 'src/components/Cards/';
    }
    if (meta.tags.includes('3d')) {
      basePathMap['shaders/'] = 'src/shaders/';
      basePathMap['textures/'] = 'public/textures/';
    }
  }
  
  return basePathMap;
}
