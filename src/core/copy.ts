/**
 * Glob planning, path mapping, and copy operations
 */

import { glob } from 'glob';
import { copyFile, mkdir, stat, readdir } from 'fs/promises';
import { dirname, resolve, relative, join } from 'path';
import { logger } from './logger.js';
import { createError, ErrorCode } from './errors.js';
import { validatePathWithin, ensureWritableDirectory, sanitizeFilename, validateGlobPatterns } from './guards.js';
import type { CopyAction, CopyPlan, CopyResult, PathMapping, ConflictMode } from './types.js';

export interface CopyOptions {
  stageDir: string;
  destRoot: string;
  pathMap?: PathMapping;
  include?: string[];
  exclude?: string[];
  mode?: ConflictMode;
  dryRun?: boolean;
}

export interface FileInfo {
  relativePath: string;
  fullPath: string;
  size: number;
  isDirectory: boolean;
}

/**
 * Get all files matching the include/exclude patterns
 */
export async function getMatchingFiles(
  stageDir: string, 
  include: string[] = ['**/*'], 
  exclude: string[] = []
): Promise<FileInfo[]> {
  logger.debug('Getting matching files', { stageDir, include, exclude });
  
  // Validate glob patterns for safety
  validateGlobPatterns(include);
  if (exclude.length > 0) {
    validateGlobPatterns(exclude);
  }
  
  const files: FileInfo[] = [];
  
  try {
    // Use glob to find matching files
    const globOptions: any = {
      cwd: stageDir,
      dot: true,
      nodir: false // We want both files and directories
    };
    
    if (exclude.length > 0) {
      globOptions.ignore = exclude;
    }
    
    const matches = await glob(include, globOptions);
    
    for (const match of matches) {
      const fullPath = resolve(stageDir, match);
      const stats = await stat(fullPath);
      
      files.push({
        relativePath: match,
        fullPath,
        size: stats.size,
        isDirectory: stats.isDirectory()
      });
    }
    
    logger.debug('Found matching files', { count: files.length });
    
  } catch (error) {
    logger.error('Failed to get matching files', { stageDir, include, exclude, error });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Failed to scan files in staging directory',
      { stagePath: stageDir, error: errorMessage }
    );
  }
  
  return files;
}

/**
 * Apply path mapping to transform source paths to destination paths
 */
export function applyPathMapping(
  sourcePath: string, 
  pathMap: PathMapping = {}
): string {
  // Check for exact matches first
  if (pathMap[sourcePath]) {
    return pathMap[sourcePath];
  }
  
  // Check for prefix matches
  for (const [sourcePrefix, destPrefix] of Object.entries(pathMap)) {
    if (sourcePath.startsWith(sourcePrefix + '/') || sourcePath === sourcePrefix) {
      const suffix = sourcePath.substring(sourcePrefix.length);
      return destPrefix + suffix;
    }
  }
  
  // No mapping found, return original path
  return sourcePath;
}

/**
 * Generate destination path with conflict resolution
 */
export function generateDestinationPath(
  sourcePath: string,
  destRoot: string,
  pathMap: PathMapping,
  mode: ConflictMode = 'skip'
): { destPath: string; existsAction: 'skip' | 'overwrite' | 'rename' } {
  const mappedPath = applyPathMapping(sourcePath, pathMap);
  const destPath = resolve(destRoot, mappedPath);
  
  return {
    destPath,
    existsAction: mode
  };
}

/**
 * Create a copy plan with all actions
 */
export async function createCopyPlan(options: CopyOptions): Promise<CopyPlan> {
  const { stageDir, destRoot, pathMap = {}, include = ['**/*'], exclude = [], mode = 'skip' } = options;
  
  logger.debug('Creating copy plan', { stageDir, destRoot, mode });
  
  try {
    // Validate inputs
    await ensureWritableDirectory(destRoot);
    
    // Get all matching files
    const files = await getMatchingFiles(stageDir, include, exclude);
    
    if (files.length === 0) {
    throw createError(ErrorCode.NO_MATCHES, 
      'No files match the specified include/exclude patterns',
      { include: include.join(','), exclude: exclude.join(',') }
    );
    }
    
    // Generate copy actions
    const actions: CopyAction[] = [];
    
    for (const file of files) {
      // Skip directories - we'll create them as needed during copy
      if (file.isDirectory) {
        continue;
      }
      
      const { destPath, existsAction } = generateDestinationPath(
        file.relativePath, 
        destRoot, 
        pathMap, 
        mode
      );
      
      // Validate destination path is safe
      validatePathWithin(destRoot, relative(destRoot, destPath));
      
      actions.push({
        from: file.fullPath,
        to: destPath,
        existsAction
      });
    }
    
    logger.debug('Created copy plan', { actionCount: actions.length });
    
    return {
      actions,
      count: actions.length
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Failed to create copy plan', { options, error });
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Failed to create copy plan',
      { error: errorMessage }
    );
  }
}

/**
 * Execute copy operations
 */
export async function executeCopyPlan(plan: CopyPlan, dryRun: boolean = false): Promise<CopyResult> {
  logger.debug('Executing copy plan', { actionCount: plan.actions.length, dryRun });
  
  const result: CopyResult = {
    installed: [],
    skipped: [],
    overwritten: [],
    renamed: []
  };
  
  for (const action of plan.actions) {
    try {
      const { from, to, existsAction } = action;
      
      // Ensure destination directory exists
      const destDir = dirname(to);
      if (!dryRun) {
        await ensureWritableDirectory(destDir);
      }
      
      // Check if destination file exists
      let fileExists = false;
      try {
        await stat(to);
        fileExists = true;
      } catch {
        // File doesn't exist, that's fine
      }
      
      if (fileExists) {
        switch (existsAction) {
          case 'skip':
            logger.debug('Skipping existing file', { from, to });
            result.skipped.push(to);
            continue;
            
          case 'overwrite':
            logger.debug('Overwriting existing file', { from, to });
            if (!dryRun) {
              await copyFile(from, to);
            }
            result.overwritten.push(to);
            break;
            
          case 'rename':
            // Generate new filename
            const ext = to.lastIndexOf('.') > -1 ? to.substring(to.lastIndexOf('.')) : '';
            const base = to.substring(0, to.lastIndexOf('.') > -1 ? to.lastIndexOf('.') : to.length);
            let counter = 1;
            let newPath = `${base}_${counter}${ext}`;
            
            // Find available name
            while (true) {
              try {
                await stat(newPath);
                counter++;
                newPath = `${base}_${counter}${ext}`;
              } catch {
                break; // File doesn't exist, we can use this name
              }
            }
            
            logger.debug('Renaming file', { from, to: newPath });
            if (!dryRun) {
              await copyFile(from, newPath);
            }
            result.renamed.push(newPath);
            break;
        }
      } else {
        // File doesn't exist, just copy it
        logger.debug('Installing new file', { from, to });
        if (!dryRun) {
          await copyFile(from, to);
        }
        result.installed.push(to);
      }
      
    } catch (error) {
      logger.error('Failed to copy file', { action, error });
      // Continue with other files even if one fails
    }
  }
  
  logger.debug('Copy plan execution completed', { 
    installed: result.installed.length,
    skipped: result.skipped.length,
    overwritten: result.overwritten.length,
    renamed: result.renamed.length
  });
  
  return result;
}
