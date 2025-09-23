/**
 * AST-based text editing for JSX text nodes, string literals, and template elements
 */

import { parse, ParseResult } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { logger } from '../core/logger.js';
import { createError, ErrorCode } from '../core/errors.js';
import type { TextReplacement, EditChange } from '../core/types.js';

export interface ASTEditOptions {
  dryRun?: boolean;
  limitChangedFiles?: number;
  previewContextLines?: number;
}

export interface ASTEditResult {
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
 * Parse file content with appropriate parser options
 */
function parseFile(content: string, filename: string): ParseResult<t.File> {
  const isTypeScript = filename.endsWith('.ts') || filename.endsWith('.tsx');
  const isJSX = filename.endsWith('.tsx') || filename.endsWith('.jsx');
  
  try {
    // Simplified parser options for better compatibility
    const plugins: string[] = [];
    
    if (isJSX) {
      plugins.push('jsx');
    }
    
    if (isTypeScript) {
      plugins.push('typescript');
    }
    
    // Add common plugins
    plugins.push(
      'classProperties',
      'objectRestSpread',
      'functionBind',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'dynamicImport',
      'nullishCoalescingOperator',
      'optionalChaining'
    );
    
    return parse(content, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: plugins as any,
      tokens: true,
      ranges: true
    });
  } catch (error) {
    logger.warn('Failed to parse file with AST', { filename, error: error instanceof Error ? error.message : String(error) });
    throw createError(ErrorCode.PARSE_FAILED, 
      `Failed to parse file: ${filename}`,
      { filename, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Check if a node should be edited (text-only, safe nodes)
 */
function isSafeToEdit(node: t.Node): boolean {
  return t.isJSXText(node) || 
         t.isStringLiteral(node) || 
         t.isTemplateLiteral(node) ||
         t.isTemplateElement(node);
}

/**
 * Get the text content from a node
 */
function getNodeText(node: t.Node, content: string): string {
  if (t.isJSXText(node)) {
    return node.value;
  }
  
  if (t.isStringLiteral(node)) {
    return node.value;
  }
  
  if (t.isTemplateLiteral(node)) {
    return node.quasis.map(quasi => quasi.value.cooked || quasi.value.raw).join('');
  }
  
  if (t.isTemplateElement(node)) {
    return node.value.cooked || node.value.raw;
  }
  
  return '';
}

/**
 * Apply replacement to node text
 */
function applyReplacement(text: string, replacement: TextReplacement): string | null {
  if (replacement.find && text.includes(replacement.find)) {
    return text.replace(new RegExp(escapeRegExp(replacement.find), 'g'), replacement.replaceWith);
  }
  
  if (replacement.findRegex) {
    try {
      const regex = new RegExp(replacement.findRegex, 'g');
      return text.replace(regex, replacement.replaceWith);
    } catch (error) {
      throw createError(ErrorCode.INVALID_REGEX, 
        `Invalid regex pattern: ${replacement.findRegex}`,
        { regex: replacement.findRegex, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
  
  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get line and column from position
 */
function getPosition(content: string, position: number): { line: number; column: number } {
  const lines = content.substring(0, position).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1]!.length + 1
  };
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
 * Edit a single file using AST
 */
export async function editFileWithAST(
  filePath: string,
  content: string,
  replacements: TextReplacement[],
  options: ASTEditOptions = {}
): Promise<ASTEditResult> {
  logger.debug('Editing file with AST', { filePath, replacements: replacements.length });
  
  try {
    const ast = parseFile(content, filePath);
    const changes: EditChange[] = [];
    let modifiedContent = content;
    
    traverse(ast, {
      enter(path: NodePath<t.Node>) {
        const node = path.node;
        
        // Only edit safe text nodes
        if (!isSafeToEdit(node)) {
          return;
        }
        
        const nodeText = getNodeText(node, content);
        if (!nodeText) {
          return;
        }
        
        // Try each replacement
        for (const replacement of replacements) {
          const newText = applyReplacement(nodeText, replacement);
          
          if (newText !== null && newText !== nodeText) {
            // Get position information
            const position = getPosition(content, node.start!);
            
            // Record the change
            changes.push({
              file: filePath,
              line: position.line,
              column: position.column,
              oldText: nodeText,
              newText: newText
            });
            
            // Update the content (for multiple replacements)
            modifiedContent = modifiedContent.replace(nodeText, newText);
            
            logger.debug('AST replacement made', { 
              filePath, 
              line: position.line, 
              oldText: nodeText.substring(0, 50) + '...', 
              newText: newText.substring(0, 50) + '...' 
            });
          }
        }
      }
    });
    
    // Generate previews if requested
    let previews: ASTEditResult['previews'] | undefined;
    if (options.previewContextLines && options.previewContextLines > 0) {
      previews = changes.map(change => ({
        file: change.file,
        changes: [change],
        context: {
          before: getContextLines(content, change.line, options.previewContextLines),
          after: getContextLines(modifiedContent, change.line, options.previewContextLines)
        }
      }));
    }
    
    logger.debug('AST editing completed', { filePath, changes: changes.length });
    
    return {
      changes,
      previews
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in AST editing', { filePath, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error during AST editing',
      { filePath, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Validate that replacements are safe for AST editing
 */
export function validateASTReplacements(replacements: TextReplacement[]): void {
  for (const replacement of replacements) {
    // Check for dangerous patterns that could break code structure
    const dangerousPatterns = [
      /[{}[\]();]/,
      /^(?:import|export|from|require)\s+/m,
      /^(?:function|const|let|var|class|interface|type|enum)\s+/m,
      /<[^>]+>/,
      /\/\*[\s\S]*?\*\//,
      /\/\/.*$/
    ];
    
    const textToCheck = replacement.find || replacement.findRegex || '';
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(textToCheck)) {
        throw createError(ErrorCode.INVALID_REPLACEMENT, 
          `Replacement pattern may break code structure: ${textToCheck}`,
          { pattern: textToCheck }
        );
      }
    }
  }
}
