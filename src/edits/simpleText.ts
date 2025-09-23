/**
 * Simple text editing without AST - uses regex for safe replacements
 */

import { logger } from '../core/logger.js';
import { createError, ErrorCode } from '../core/errors.js';
import type { TextReplacement, EditChange } from '../core/types.js';

export interface SimpleTextEditOptions {
  dryRun?: boolean;
  limitChangedFiles?: number;
  previewContextLines?: number;
}

export interface SimpleTextEditResult {
  changes: EditChange[];
  previews?: Array<{
    file: string;
    changes: EditChange[];
    context: {
      before: string[];
      after: string[];
    };
  }>;
}

/**
 * Apply replacement to text content using safe regex patterns
 */
function applySafeReplacement(text: string, replacement: TextReplacement): { newText: string; changes: EditChange[] } {
  const changes: EditChange[] = [];
  let newText = text;
  
  if (replacement.find) {
    // Simple string replacement - escape special regex characters
    const escapedFind = replacement.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFind, 'g');
    const matches = [...text.matchAll(regex)];
    
    if (matches.length > 0) {
      newText = text.replace(regex, replacement.replaceWith);
      
      // Record changes
      for (const match of matches) {
        const matchIndex = match.index!;
        const beforeMatch = text.substring(0, matchIndex);
        const lineNumber = beforeMatch.split('\n').length;
        const columnNumber = beforeMatch.split('\n').pop()!.length + 1;
        
        changes.push({
          file: '', // Will be set by caller
          line: lineNumber,
          column: columnNumber,
          oldText: match[0]!,
          newText: replacement.replaceWith
        });
      }
    }
  } else if (replacement.findRegex) {
    // Regex replacement with safety checks
    try {
      // Validate regex is not too broad
      if (replacement.findRegex === '.*' || replacement.findRegex === '^.*$' || replacement.findRegex === '.+') {
        throw new Error('Regex pattern too broad');
      }
      
      const regex = new RegExp(replacement.findRegex, 'g');
      const matches = [...text.matchAll(regex)];
      
      if (matches.length > 0) {
        newText = text.replace(regex, replacement.replaceWith);
        
        // Record changes
        for (const match of matches) {
          const matchIndex = match.index!;
          const beforeMatch = text.substring(0, matchIndex);
          const lineNumber = beforeMatch.split('\n').length;
          const columnNumber = beforeMatch.split('\n').pop()!.length + 1;
          
          changes.push({
            file: '', // Will be set by caller
            line: lineNumber,
            column: columnNumber,
            oldText: match[0]!,
            newText: replacement.replaceWith
          });
        }
      }
    } catch (error) {
      throw createError(ErrorCode.INVALID_REGEX, 
        `Invalid regex pattern: ${replacement.findRegex}`,
        { regex: replacement.findRegex, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  return { newText, changes };
}

/**
 * Get context lines around a change
 */
function getContextLines(content: string, line: number, contextLines: number = 3): string[] {
  const lines = content.split('\n');
  const start = Math.max(0, line - contextLines - 1);
  const end = Math.min(lines.length, line + contextLines);
  return lines.slice(start, end);
}

/**
 * Edit a file using simple text replacement
 */
export async function editSimpleTextFile(
  filePath: string,
  content: string,
  replacements: TextReplacement[],
  options: SimpleTextEditOptions = {}
): Promise<SimpleTextEditResult> {
  logger.debug('Editing file with simple text replacement', { filePath, replacements: replacements.length });
  
  try {
    let modifiedContent = content;
    const allChanges: EditChange[] = [];
    
    // Apply each replacement
    for (const replacement of replacements) {
      const { newText, changes } = applySafeReplacement(modifiedContent, replacement);
      
      if (newText !== modifiedContent) {
        modifiedContent = newText;
        
        // Update file path in changes
        const updatedChanges = changes.map(change => ({
          ...change,
          file: filePath
        }));
        
        allChanges.push(...updatedChanges);
        
        logger.debug('Simple text replacement made', { 
          filePath, 
          changes: updatedChanges.length 
        });
      }
    }
    
    // Generate previews if requested
    let previews: SimpleTextEditResult['previews'] | undefined;
    if (options.previewContextLines && options.previewContextLines > 0 && allChanges.length > 0) {
      // Group changes by line for context
      const changesByLine = new Map<number, EditChange[]>();
      for (const change of allChanges) {
        if (!changesByLine.has(change.line)) {
          changesByLine.set(change.line, []);
        }
        changesByLine.get(change.line)!.push(change);
      }
      
      previews = Array.from(changesByLine.entries()).map(([line, changes]) => ({
        file: filePath,
        changes,
        context: {
          before: getContextLines(content, line, options.previewContextLines),
          after: getContextLines(modifiedContent, line, options.previewContextLines)
        }
      }));
    }
    
    logger.debug('Simple text editing completed', { filePath, changes: allChanges.length });
    
    return {
      changes: allChanges,
      previews
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in simple text editing', { filePath, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error during simple text editing',
      { filePath, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Check if a file is a text file that can be edited
 */
export function isTextFile(filePath: string): boolean {
  const textExtensions = [
    '.txt', '.md', '.json', '.yaml', '.yml', '.xml', '.html', '.htm',
    '.css', '.scss', '.sass', '.less', '.env', '.gitignore', '.eslintrc',
    '.prettierrc', '.editorconfig', '.dockerignore', '.npmignore',
    '.ts', '.tsx', '.js', '.jsx' // Include code files for simple text editing
  ];
  
  const extension = filePath.substring(filePath.lastIndexOf('.'));
  return textExtensions.includes(extension);
}

/**
 * Validate that replacements are safe for simple text editing
 */
export function validateSimpleTextReplacements(replacements: TextReplacement[]): void {
  for (const replacement of replacements) {
    // Check for very long replacements that might be dangerous
    const textToCheck = replacement.find || replacement.findRegex || '';
    
    if (textToCheck.length > 1000) {
      throw createError(ErrorCode.INVALID_REPLACEMENT, 
        'Replacement pattern too long for safety',
        { length: textToCheck.length }
      );
    }
    
    // Check for patterns that might be too broad
    if (replacement.findRegex) {
      const broadPatterns = [
        /^\.*$/,  // Just dots
        /^\*+$/,  // Just asterisks
        /^.+$/,   // Match everything
        /^.*$/    // Match everything (including empty)
      ];
      
      for (const pattern of broadPatterns) {
        if (pattern.test(replacement.findRegex)) {
          throw createError(ErrorCode.INVALID_REPLACEMENT, 
            `Replacement pattern too broad: ${replacement.findRegex}`,
            { regex: replacement.findRegex }
          );
        }
      }
    }
  }
}
