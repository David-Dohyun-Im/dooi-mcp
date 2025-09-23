/**
 * dooi.textEdit tool implementation
 */

import { TextEditInputSchema, type TextEditInput, type TextEditOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat } from 'fs/promises';
import { applyEditPlan } from '../../edits/apply.js';
import { DEFAULT_OPTIONS } from '../../core/config/defaults.js';

export async function handleTextEdit(args: unknown): Promise<TextEditOutput> {
  // Validate input
  const input = TextEditInputSchema.parse(args);
  
  logger.debug('Handling dooi.textEdit request', input);
  
  try {
    // Check if destination root exists
    try {
      await stat(input.destRoot);
    } catch {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Destination root directory does not exist',
        { destRoot: input.destRoot }
      );
    }
    
    // Set up options with defaults
    const dryRun = input.plan.options?.dryRun !== undefined ? input.plan.options.dryRun : DEFAULT_OPTIONS.dryRun;
    const limitChangedFiles = input.plan.options?.limitChangedFiles || DEFAULT_OPTIONS.maxFiles;
    const previewContextLines = input.plan.options?.previewContextLines || DEFAULT_OPTIONS.previewContextLines;
    
    // Validate replacements
    if (input.plan.replacements.length === 0) {
      throw createError(ErrorCode.INVALID_INPUT, 
        'No replacements specified in edit plan',
        {}
      );
    }
    
    // Apply edit plan
    const result = await applyEditPlan({
      destRoot: input.destRoot,
      plan: {
        include: input.plan.include,
        exclude: input.plan.exclude || [],
        replacements: input.plan.replacements,
        options: {
          dryRun,
          limitChangedFiles,
          previewContextLines
        }
      },
      dryRun
    });
    
    logger.debug('Text editing completed', {
      destRoot: input.destRoot,
      changedFiles: result.changedFiles.length,
      totalChanges: result.changes.length,
      skipped: result.skipped.length,
      dryRun
    });
    
    return {
      changedFiles: result.changedFiles,
      changes: result.changes,
      skipped: result.skipped,
      previews: (result as any).previews
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.textEdit', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
