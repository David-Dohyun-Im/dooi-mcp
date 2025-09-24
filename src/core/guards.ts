/**
 * Path traversal prevention and permission checks
 */

import { createError, ErrorCode } from './errors.js';
import { logger } from './logger.js';
import { resolve, relative, isAbsolute } from 'path';
import { access, constants } from 'fs/promises';

/**
 * Prevent path traversal attacks by ensuring paths stay within allowed directories
 */
export function preventPathTraversal(basePath: string, targetPath: string): void {
  const resolvedBase = resolve(basePath);
  const resolvedTarget = resolve(basePath, targetPath);
  
  // Check if the resolved target path starts with the base path
  if (!resolvedTarget.startsWith(resolvedBase + '/') && resolvedTarget !== resolvedBase) {
    logger.error('Path traversal attempt detected', { 
      basePath: resolvedBase, 
      targetPath: resolvedTarget 
    });
    throw createError(ErrorCode.PATH_TRAVERSAL, 
      `Path traversal attempt: ${targetPath} escapes from ${basePath}`,
      { basePath, targetPath }
    );
  }
}

/**
 * Check if a path is safe (no traversal, valid characters)
 */
export function isSafePath(path: string): boolean {
  // Check for common path traversal patterns
  const dangerousPatterns = [
    '../',
    '..\\',
    '..%2f',
    '..%5c',
    '%2e%2e%2f',
    '%2e%2e%5c',
    '..%252f',
    '..%255c'
  ];
  
  const normalizedPath = path.toLowerCase();
  return !dangerousPatterns.some(pattern => normalizedPath.includes(pattern));
}

/**
 * Validate that a path is within the allowed directory
 */
export function validatePathWithin(basePath: string, targetPath: string): string {
  if (!isSafePath(targetPath)) {
    throw createError(ErrorCode.PATH_TRAVERSAL, 
      `Unsafe path detected: ${targetPath}`,
      { targetPath }
    );
  }
  
  preventPathTraversal(basePath, targetPath);
  
  return resolve(basePath, targetPath);
}

/**
 * Check if a directory is writable
 */
export async function checkWritePermission(path: string): Promise<void> {
  try {
    await access(path, constants.W_OK);
  } catch (error) {
    logger.error('Write permission denied', { path, error });
    throw createError(ErrorCode.DEST_NOT_WRITABLE, 
      `Directory is not writable: ${path}`,
      { path }
    );
  }
}

/**
 * Ensure directory exists and is writable
 */
export async function ensureWritableDirectory(path: string): Promise<void> {
  const { mkdir } = await import('fs/promises');
  
  try {
    // Try to create the directory (ignores error if it already exists)
    await mkdir(path, { recursive: true });
    
    // Check write permissions
    await checkWritePermission(path);
    
    logger.debug('Directory is writable', { path });
  } catch (error) {
    logger.error('Failed to ensure writable directory', { path, error });
    throw createError(ErrorCode.DEST_NOT_WRITABLE, 
      `Cannot create or write to directory: ${path}`,
      { path }
    );
  }
}

/**
 * Sanitize filename to prevent issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')  // Replace dangerous chars with underscore
    .replace(/^\.+/, '')            // Remove leading dots
    .replace(/\s+/g, '_')           // Replace spaces with underscore
    .substring(0, 255);             // Limit length
}

/**
 * Validate glob patterns to prevent dangerous operations
 */
export function validateGlobPatterns(patterns: string[]): void {
  const dangerousPatterns = [
    '**/../../**',
    '**/../**',
    '**/.../**',
    '/**',
    'C:/**',
    'D:/**'
  ];
  
  // Allow common safe exclude patterns
  const safeExcludePatterns = [
    'node_modules/**',
    '.git/**',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '*.temp',
    '.env*',
    'dist/**',
    'build/**',
    '.next/**',
    '.nuxt/**',
    '.vscode/**',
    '.idea/**',
    '*.swp',
    '*.swo',
    '*~'
  ];
  
  for (const pattern of patterns) {
    // Skip validation for safe exclude patterns
    if (safeExcludePatterns.includes(pattern)) {
      continue;
    }
    
    if (dangerousPatterns.some(dangerous => pattern.includes(dangerous))) {
      throw createError(ErrorCode.PATH_TRAVERSAL, 
        `Dangerous glob pattern detected: ${pattern}`,
        { pattern }
      );
    }
    
    // Check for patterns that would match too many files
    if (pattern === '**' || pattern === '**/*' || pattern === '**/**') {
      throw createError(ErrorCode.INVALID_INPUT, 
        `Glob pattern too broad: ${pattern}`,
        { pattern }
      );
    }
  }
}
