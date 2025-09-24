/**
 * dooi.fetch tool implementation
 */

import { FetchInputSchema, type FetchInput, type FetchOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { randomUUID } from 'crypto';
import { mkdtemp, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
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
      
      throw createError(ErrorCode.FETCH_FAILED, 
        `Failed to fetch ${input.id}`,
        {
          id: input.id,
          exitCode: result.exitCode, 
          stderr: result.stderr
        }
      );
    }
    
    // Create files in staging directory from the code block
    const meta = parseMetadata(input.id, result.stdout);
    const files: string[] = [];
    
    if (meta.codeBlock) {
      // Create component file based on the ID
      const componentPath = getComponentPath(input.id);
      const fullPath = join(stageDir, componentPath);
      
      // Ensure directory exists
      await mkdir(dirname(fullPath), { recursive: true });
      
      // Write the component file
      await writeFile(fullPath, meta.codeBlock, 'utf8');
      files.push(componentPath);
      
      // Create enhanced meta.json file with rich metadata
      const metaJson = {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        dependencies: meta.dependencies || [],
        peerDependencies: meta.peerDependencies || [],
        uses: meta.uses || [],
        category: getCategoryFromId(input.id),
        tags: getTagsFromMetadata(meta),
        complexity: getComplexityFromMetadata(meta)
      };
      
      const metaPath = join(stageDir, 'meta.json');
      await writeFile(metaPath, JSON.stringify(metaJson, null, 2), 'utf8');
      files.push('meta.json');
      
      // Create a package.json if dependencies exist
      if (meta.dependencies && meta.dependencies.length > 0) {
        const packageJson = {
          name: input.id.replace('/', '-'),
          version: '1.0.0',
          dependencies: meta.dependencies.reduce((acc, dep) => {
            acc[dep] = 'latest';
            return acc;
          }, {} as Record<string, string>),
          peerDependencies: meta.peerDependencies?.reduce((acc, dep) => {
            acc[dep] = '*';
            return acc;
          }, {} as Record<string, string>) || {}
        };
        
        const packagePath = join(stageDir, 'package.json');
        await writeFile(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
        files.push('package.json');
      }
      
      // Create a README if description exists
      if (meta.description) {
        const readmePath = join(stageDir, 'README.md');
        const readmeContent = `# ${meta.title || input.id}\n\n${meta.description}\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Usage\n\nImport and use the component in your project.\n`;
        await writeFile(readmePath, readmeContent, 'utf8');
        files.push('README.md');
      }
    }
    
    logger.debug('Found files in staging directory', { count: files.length });
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
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error in dooi.fetch',
      {
        originalError: error instanceof Error ? error.message : String(error)
      }
    );
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
      
      // Look for uses components
      if (trimmed.includes('Uses components:')) {
        // This line indicates the start of the uses components list
        continue;
      }
      
      // Look for component bullet points (• ui/fluid-blob)
      if (trimmed.startsWith('•')) {
        const componentId = trimmed.substring(1).trim();
        if (componentId && !meta.uses) {
          meta.uses = [];
        }
        if (componentId && meta.uses) {
          meta.uses.push(componentId);
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

/**
 * Generate appropriate file path for a component based on its ID
 */
function getComponentPath(id: string): string {
  // Handle different component ID patterns
  if (id.startsWith('ui/')) {
    // UI components go to components/ui/
    return `components/ui/${id.substring(3)}.tsx`;
  } else if (id.includes('/')) {
    // Components with category go to appropriate directory
    const parts = id.split('/');
    const category = parts[0]!.toLowerCase();
    const name = parts[1]!;
    
    switch (category) {
      case 'hero':
        return `components/hero/${name}.tsx`;
      case 'cards':
        return `components/cards/${name}.tsx`;
      case 'forms':
        return `components/forms/${name}.tsx`;
      case 'layout':
        return `components/layout/${name}.tsx`;
      default:
        return `components/${category}/${name}.tsx`;
    }
  } else {
    // Simple component names go to components/
    return `components/${id}.tsx`;
  }
}

/**
 * Get category from component ID
 */
function getCategoryFromId(id: string): string {
  if (id.startsWith('ui/')) {
    return 'ui';
  } else if (id.includes('/')) {
    return id.split('/')[0]!;
  }
  return 'component';
}

/**
 * Generate tags from metadata
 */
function getTagsFromMetadata(meta: any): string[] {
  const tags: string[] = [];
  
  // Add tags based on dependencies
  if (meta.dependencies) {
    if (meta.dependencies.includes('three') || meta.dependencies.includes('@react-three/fiber')) {
      tags.push('3d');
    }
    if (meta.dependencies.includes('framer-motion')) {
      tags.push('animation');
    }
  }
  
  // Add tags based on description
  if (meta.description) {
    const desc = meta.description.toLowerCase();
    if (desc.includes('hero')) tags.push('hero');
    if (desc.includes('background')) tags.push('background');
    if (desc.includes('interactive')) tags.push('interactive');
    if (desc.includes('grid')) tags.push('grid');
    if (desc.includes('card')) tags.push('cards');
    if (desc.includes('transition')) tags.push('transitions');
    if (desc.includes('morphing') || desc.includes('fluid')) tags.push('morphing');
    if (desc.includes('lava')) tags.push('lava-lamp');
  }
  
  // Add tags based on uses components
  if (meta.uses && meta.uses.length > 0) {
    tags.push('composite');
  }
  
  return tags;
}

/**
 * Determine complexity from metadata
 */
function getComplexityFromMetadata(meta: any): string {
  if (meta.uses && meta.uses.length > 0) {
    return 'advanced';
  }
  
  if (meta.dependencies && meta.dependencies.length > 2) {
    return 'intermediate';
  }
  
  return 'basic';
}
