/**
 * dooi.textEdit tool implementation
 */

import { TextEditInputSchema, type TextEditInput, type TextEditOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat, readFile } from 'fs/promises';
import { join } from 'path';
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
    
    // Enhance replacements with smart suggestions based on component metadata
    let enhancedReplacements = input.plan.replacements;
    try {
      // Try to find meta.json in the project to get component context
      const metaPath = join(input.destRoot, 'meta.json');
      const metaContent = await readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      
      // Add smart replacements based on component metadata
      enhancedReplacements = enhanceReplacementsWithMetadata(input.plan.replacements, meta);
      logger.debug('Enhanced replacements with metadata', { 
        original: input.plan.replacements.length,
        enhanced: enhancedReplacements.length 
      });
    } catch {
      // No meta.json found, use original replacements
      logger.debug('No meta.json found, using original replacements');
    }
    
    // Apply edit plan
    const result = await applyEditPlan({
      destRoot: input.destRoot,
      plan: {
        include: input.plan.include,
        exclude: input.plan.exclude || [],
        replacements: enhancedReplacements,
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

/**
 * Enhance replacements with smart suggestions based on component metadata
 */
function enhanceReplacementsWithMetadata(
  originalReplacements: Array<{ find?: string; findRegex?: string; replaceWith: string }>,
  meta: any
): Array<{ find?: string; findRegex?: string; replaceWith: string }> {
  const enhanced = [...originalReplacements];
  
  // Add smart replacements based on component metadata
  if (meta.tags) {
    // Add tag-specific replacements
    if (meta.tags.includes('hero')) {
      // Common hero section text replacements
      enhanced.push(
        { find: 'Morphic Dreams', replaceWith: 'Your Brand' },
        { find: 'Where thoughts take shape', replaceWith: 'Your compelling message' }
      );
    }
    
    if (meta.tags.includes('3d')) {
      // 3D component specific replacements
      enhanced.push(
        { find: 'three', replaceWith: 'three' }, // Keep dependency names
        { find: '@react-three/fiber', replaceWith: '@react-three/fiber' }
      );
    }
    
    if (meta.tags.includes('animation')) {
      // Animation component specific replacements
      enhanced.push(
        { find: 'framer-motion', replaceWith: 'framer-motion' }
      );
    }
  }
  
  // Add component-specific replacements based on title/description
  if (meta.title && meta.description) {
    const title = meta.title.toLowerCase();
    const description = meta.description.toLowerCase();
    
    if (title.includes('fluid') || description.includes('fluid')) {
      enhanced.push(
        { find: 'fluid-blob', replaceWith: 'custom-blob' },
        { find: 'LavaLamp', replaceWith: 'CustomLavaLamp' }
      );
    }
    
    if (title.includes('shuffle') || description.includes('shuffle')) {
      enhanced.push(
        { find: 'shuffle-grid', replaceWith: 'custom-grid' },
        { find: 'ShuffleGrid', replaceWith: 'CustomGrid' }
      );
    }
  }
  
  // Remove duplicates
  const uniqueReplacements = enhanced.filter((replacement, index, self) => 
    index === self.findIndex(r => 
      r.find === replacement.find && 
      r.findRegex === replacement.findRegex && 
      r.replaceWith === replacement.replaceWith
    )
  );
  
  return uniqueReplacements;
}
