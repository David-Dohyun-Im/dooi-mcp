/**
 * Plain text file editing with global replacements
 */

import { logger } from '../core/logger.js';
import { createError, ErrorCode } from '../core/errors.js';
import type { TextReplacement, EditChange } from '../core/types.js';

export interface PlainTextEditOptions {
  dryRun?: boolean;
  limitChangedFiles?: number;
  previewContextLines?: number;
}

export interface PlainTextEditResult {
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
 * Apply replacement to text content
 */
function applyReplacement(text: string, replacement: TextReplacement): { newText: string; changes: EditChange[] } {
  const changes: EditChange[] = [];
  let newText = text;
  
  if (replacement.find) {
    // Simple string replacement
    const regex = new RegExp(escapeRegExp(replacement.find), 'g');
    const matches = text.match(regex);
    
    if (matches) {
      newText = text.replace(regex, replacement.replaceWith);
      
      // Record changes (approximate line/column info)
      const lines = text.split('\n');
      let currentPos = 0;
      
      for (const match of matches) {
        const matchIndex = text.indexOf(match, currentPos);
        const beforeMatch = text.substring(0, matchIndex);
        const lineNumber = beforeMatch.split('\n').length;
        const columnNumber = beforeMatch.split('\n').pop()!.length + 1;
        
        changes.push({
          file: '', // Will be set by caller
          line: lineNumber,
          column: columnNumber,
          oldText: match,
          newText: replacement.replaceWith
        });
        
        currentPos = matchIndex + match.length;
      }
    }
  } else if (replacement.findRegex) {
    // Regex replacement
    try {
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
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Edit a plain text file
 */
export async function editPlainTextFile(
  filePath: string,
  content: string,
  replacements: TextReplacement[],
  options: PlainTextEditOptions = {}
): Promise<PlainTextEditResult> {
  logger.debug('Editing plain text file', { filePath, replacements: replacements.length });
  
  try {
    let modifiedContent = content;
    const allChanges: EditChange[] = [];
    
    // Apply each replacement
    for (const replacement of replacements) {
      const { newText, changes } = applyReplacement(modifiedContent, replacement);
      
      if (newText !== modifiedContent) {
        modifiedContent = newText;
        
        // Update file path in changes
        const updatedChanges = changes.map(change => ({
          ...change,
          file: filePath
        }));
        
        allChanges.push(...updatedChanges);
        
        logger.debug('Plain text replacement made', { 
          filePath, 
          changes: updatedChanges.length 
        });
      }
    }
    
    // Generate previews if requested
    let previews: PlainTextEditResult['previews'] | undefined;
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
    
    logger.debug('Plain text editing completed', { filePath, changes: allChanges.length });
    
    return {
      changes: allChanges,
      previews
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in plain text editing', { filePath, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error during plain text editing',
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
    '.prettierrc', '.editorconfig', '.dockerignore', '.npmignore'
  ];
  
  const extension = filePath.substring(filePath.lastIndexOf('.'));
  return textExtensions.includes(extension);
}

/**
 * Validate that replacements are safe for plain text editing
 */
export function validatePlainTextReplacements(replacements: TextReplacement[]): void {
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
