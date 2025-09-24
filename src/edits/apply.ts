/**
 * EditPlan execution with routing, dry-run, and reporting
 */

import { readFile, writeFile, stat } from 'fs/promises';
import { glob } from 'glob';
import { join, relative } from 'path';
import { logger } from '../core/logger.js';
import { createError, ErrorCode } from '../core/errors.js';
import { validateGlobPatterns } from '../core/guards.js';
import { TEXT_FILE_EXTENSIONS, BINARY_FILE_EXTENSIONS, MAX_FILES_PER_OPERATION } from '../core/config/defaults.js';
import { editSimpleTextFile, validateSimpleTextReplacements, isTextFile } from './simpleText.js';
import type { EditPlan, EditResult, EditChange } from '../core/types.js';

export interface ApplyEditOptions {
  destRoot: string;
  plan: EditPlan;
  dryRun?: boolean;
}

export interface FileToEdit {
  path: string;
  relativePath: string;
  isText: boolean;
  isCode: boolean;
}

/**
 * Get file extension from path
 */
function getFileExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  return lastDot > -1 ? filePath.substring(lastDot) : '';
}

/**
 * Check if file is a code file that should use AST editing
 */
function isCodeFile(filePath: string): boolean {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  const extension = getFileExtension(filePath);
  return codeExtensions.includes(extension);
}

/**
 * Check if file is a binary file that should be skipped
 */
function isBinaryFile(filePath: string): boolean {
  const extension = getFileExtension(filePath);
  return BINARY_FILE_EXTENSIONS.includes(extension);
}

/**
 * Find all files matching the edit plan
 */
async function findFilesToEdit(options: ApplyEditOptions): Promise<FileToEdit[]> {
  const { destRoot, plan } = options;
  
  logger.debug('Finding files to edit', { destRoot, include: plan.include, exclude: plan.exclude });
  
  // Validate glob patterns for safety
  validateGlobPatterns(plan.include);
  if (plan.exclude && plan.exclude.length > 0) {
    validateGlobPatterns(plan.exclude);
  }
  
  try {
    const globOptions: any = {
      cwd: destRoot,
      dot: true,
      nodir: true
    };
    
    if (plan.exclude && plan.exclude.length > 0) {
      globOptions.ignore = plan.exclude;
    }
    
    const matches = await glob(plan.include, globOptions);
    
    if (matches.length === 0) {
      throw createError(ErrorCode.NO_MATCHES, 
        'No files match the specified include/exclude patterns',
        { include: plan.include.join(','), exclude: plan.exclude?.join(',') || '' }
      );
    }
    
    if (matches.length > MAX_FILES_PER_OPERATION) {
      throw createError(ErrorCode.TOO_MANY_CHANGES, 
        `Too many files would be changed: ${matches.length}`,
        { fileCount: matches.length, limit: MAX_FILES_PER_OPERATION }
      );
    }
    
    const files: FileToEdit[] = [];
    
    for (const match of matches) {
      const fullPath = join(destRoot, match);
      
      try {
        const stats = await stat(fullPath);
        if (!stats.isFile()) {
          continue;
        }
        
        const isText = isTextFile(fullPath);
        const isCode = isCodeFile(fullPath);
        
        // Skip binary files
        if (isBinaryFile(fullPath)) {
          logger.debug('Skipping binary file', { path: match });
          continue;
        }
        
        files.push({
          path: fullPath,
          relativePath: match,
          isText,
          isCode
        });
        
      } catch (error) {
        logger.warn('Could not stat file, skipping', { path: match, error });
        continue;
      }
    }
    
    logger.debug('Found files to edit', { count: files.length });
    return files;
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Failed to find files', { options, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Failed to find files matching edit plan',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Apply edits to a single file
 */
async function editSingleFile(
  file: FileToEdit,
  replacements: any[],
  options: ApplyEditOptions
): Promise<{ changes: EditChange[]; previews?: any[] }> {
  const { destRoot, plan } = options;
  
  try {
    const content = await readFile(file.path, 'utf8');
    
    if (file.isText || file.isCode) {
      // Use simple text editing for all text and code files
      validateSimpleTextReplacements(replacements);
      const result = await editSimpleTextFile(file.path, content, replacements, {
        dryRun: options.dryRun,
        limitChangedFiles: plan.options?.limitChangedFiles,
        previewContextLines: plan.options?.previewContextLines
      });
      
      // Write changes to file if not dry run and there are changes
      if (!options.dryRun && result.changes.length > 0) {
        // Re-apply changes to get the modified content
        let modifiedContent = content;
        for (const replacement of replacements) {
          if (replacement.find) {
            const escapedFind = replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedFind, 'g');
            modifiedContent = modifiedContent.replace(regex, replacement.replaceWith);
          } else if (replacement.findRegex) {
            const regex = new RegExp(replacement.findRegex, 'g');
            modifiedContent = modifiedContent.replace(regex, replacement.replaceWith);
          }
        }
        
        await writeFile(file.path, modifiedContent, 'utf8');
        logger.debug('Wrote changes to file', { path: file.relativePath });
      }
      
      return {
        changes: result.changes,
        previews: result.previews
      };
    } else {
      // Skip unknown file types
      logger.debug('Skipping unknown file type', { path: file.relativePath });
      return { changes: [] };
    }
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Failed to edit file', { file: file.relativePath, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Failed to edit file',
      { file: file.relativePath, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Write changes to file (if not dry run)
 */
async function writeChangesToFile(file: FileToEdit, newContent: string, dryRun: boolean): Promise<void> {
  if (!dryRun) {
    await writeFile(file.path, newContent, 'utf8');
    logger.debug('Wrote changes to file', { path: file.relativePath });
  }
}

/**
 * Apply edit plan to files
 */
export async function applyEditPlan(options: ApplyEditOptions): Promise<EditResult> {
  const { destRoot, plan, dryRun = false } = options;
  
  logger.debug('Applying edit plan', { destRoot, dryRun, replacements: plan.replacements.length });
  
  try {
    // Find all files to edit
    const files = await findFilesToEdit(options);
    
    if (files.length === 0) {
      return {
        changedFiles: [],
        changes: [],
        skipped: []
      };
    }
    
    // Apply edits to each file
    const allChanges: EditChange[] = [];
    const allPreviews: any[] = [];
    const changedFiles: string[] = [];
    const skipped: Array<{ file: string; reason: string }> = [];
    
    for (const file of files) {
      try {
        const { changes, previews } = await editSingleFile(file, plan.replacements, options);
        
        if (changes.length > 0) {
          allChanges.push(...changes);
          changedFiles.push(file.relativePath);
          
          if (previews) {
            allPreviews.push(...previews);
          }
          
          logger.debug('File edited successfully', { 
            path: file.relativePath, 
            changes: changes.length 
          });
        }
        
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        skipped.push({ file: file.relativePath, reason });
        logger.warn('Skipped file due to error', { path: file.relativePath, reason });
      }
    }
    
    // Check change limits
    if (plan.options?.limitChangedFiles && changedFiles.length > plan.options.limitChangedFiles) {
      throw createError(ErrorCode.TOO_MANY_CHANGES, 
        `Too many files would be changed: ${changedFiles.length}`,
        { fileCount: changedFiles.length, limit: plan.options.limitChangedFiles }
      );
    }
    
    logger.debug('Edit plan applied', { 
      changedFiles: changedFiles.length,
      totalChanges: allChanges.length,
      skipped: skipped.length,
      dryRun
    });
    
    const result: EditResult = {
      changedFiles,
      changes: allChanges,
      skipped
    };
    
    // Add previews if in dry-run mode
    if (dryRun && allPreviews.length > 0) {
      (result as any).previews = allPreviews;
    }
    
    return result;
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error applying edit plan', { options, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error applying edit plan',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}
