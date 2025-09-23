/**
 * dooi.fetch tool implementation
 */

import { FetchInputSchema, type FetchInput, type FetchOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { randomUUID } from 'crypto';
import { mkdtemp, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { glob } from 'glob';

export async function handleFetch(args: unknown): Promise<FetchOutput> {
  // Validate input
  const input = FetchInputSchema.parse(args);
  
  logger.debug('Handling dooi.fetch request', input);
  
  try {
    // Create staging directory
    const stageToken = randomUUID();
    const stageDir = await mkdtemp(join(tmpdir(), `dooi-stage-${stageToken}-`));
    
    logger.debug('Created staging directory', { stageDir });
    
    // Run npx dooi-ui get command
    const { execa } = await import('execa');
    
    const commandArgs = ['dooi-ui', 'get', input.id];
    if (input.ref) {
      commandArgs.push('--ref', input.ref);
    }
    
    const execOptions: any = {
      cwd: stageDir,
      timeout: input.options?.timeoutMs || 30000,
      reject: false
    };
    
    if (input.options?.env) {
      execOptions.env = input.options.env;
    }
    
    const result = await execa('npx', commandArgs, execOptions);
    
    if (result.exitCode !== 0) {
      logger.error('dooi-ui get command failed', { 
        id: input.id,
        exitCode: result.exitCode, 
        stderr: result.stderr 
      });
      
      // If command not found, provide guidance
      if (result.stderr.includes('command not found') || result.stderr.includes('not found')) {
        throw createError(ErrorCode.CLI_NOT_FOUND);
      }
      
      throw createError(ErrorCode.FETCH_FAILED, {
        id: input.id,
        exitCode: result.exitCode,
        stderr: result.stderr
      });
    }
    
    // Get list of files in staging directory
    const files = await glob('**/*', {
      cwd: stageDir,
      dot: true,
      nodir: true
    });
    
    logger.debug('Found files in staging directory', { count: files.length });
    
    // Parse metadata from stdout
    const meta = parseMetadata(input.id, result.stdout);
    
    logger.debug('Successfully fetched item', { id: input.id, files: files.length });
    
    return {
      stageDir,
      files,
      meta,
      raw: {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode
      }
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.fetch', error);
    throw createError(ErrorCode.INTERNAL_ERROR, {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}

function parseMetadata(id: string, stdout: string): {
  id: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  uses?: string[];
  codeBlock?: string;
} {
  const meta: {
    id: string;
    title?: string;
    description?: string;
    dependencies?: string[];
    peerDependencies?: string[];
    uses?: string[];
    codeBlock?: string;
  } = { id };
  
  try {
    const lines = stdout.split('\n');
    let inCodeBlock = false;
    const codeLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for component/template title
      if (trimmed.includes('Component:') || trimmed.includes('Template:')) {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          meta.title = trimmed.substring(colonIndex + 1).trim();
        }
        continue;
      }
      
      // Look for dependencies
      if (trimmed.includes('npm install')) {
        // Extract package names from "npm install three @react-three/fiber"
        const installMatch = trimmed.match(/npm install (.+)/);
        if (installMatch) {
          const packages = installMatch[1]!.split(' ').filter(pkg => pkg.trim());
          meta.dependencies = packages;
        }
        continue;
      }
      
      // Look for peer dependencies
      if (trimmed.includes('Peer dependencies:')) {
        const peerDepsText = trimmed.replace('Peer dependencies:', '').trim();
        if (peerDepsText) {
          meta.peerDependencies = peerDepsText.split(',').map(d => d.trim()).filter(d => d);
        }
        continue;
      }
      
      // Look for code block start
      if (trimmed.includes('Component Code:') || trimmed.includes('Template Code:')) {
        inCodeBlock = true;
        continue;
      }
      
      // Collect code block content
      if (inCodeBlock) {
        if (trimmed === '```' || trimmed === '`' || trimmed === '') {
          // Skip code block markers and empty lines
          continue;
        }
        codeLines.push(line); // Keep original line with indentation
      }
    }
    
    // Set code block if we found one
    if (codeLines.length > 0) {
      meta.codeBlock = codeLines.join('\n');
    }
    
    // Set defaults if not found
    if (!meta.title) {
      meta.title = id;
    }
    
    if (!meta.description) {
      meta.description = 'Component from dooi-ui';
    }
    
    logger.debug('Parsed metadata', meta);
    
  } catch (error) {
    logger.warn('Failed to parse metadata from stdout', { 
      id, 
      stdout, 
      error: error instanceof Error ? error.message : String(error) 
    });
    
    // Return minimal metadata on parsing failure
    meta.title = id;
    meta.description = 'No description available';
  }
  
  return meta;
}
