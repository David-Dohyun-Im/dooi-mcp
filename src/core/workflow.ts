/**
 * Workflow orchestration engine for dooi operations
 */

import { logger } from './logger.js';
import { createError, ErrorCode } from './errors.js';
import { handleFetch } from '../capabilities/tools/fetch.js';
import { handleInstall } from '../capabilities/tools/install.js';
import { handleInstallDeps } from '../capabilities/tools/installDeps.js';
import { handleTextEdit } from '../capabilities/tools/textEdit.js';
import { detectPackageManager } from './pm.js';
import type { FetchOutput, InstallOutput, TextEditOutput } from '../adapters/mcp/schema.js';

export interface WorkflowOptions {
  id: string;
  destRoot: string;
  brand?: string;
  pathStrategy?: 'next-app' | 'vite-react';
  pathMap?: Record<string, string>;
  editPlan?: Record<string, any>;
  autoDeps?: boolean;
  dryRun?: boolean;
}

export interface WorkflowResult {
  success: boolean;
  steps: {
    fetch?: {
      success: boolean;
      stageDir?: string;
      files?: string[];
      meta?: any;
      error?: string;
    };
    install?: {
      success: boolean;
      installed?: string[];
      skipped?: string[];
      overwritten?: string[];
      renamed?: string[];
      error?: string;
    };
    textEdit?: {
      success: boolean;
      changedFiles?: string[];
      changes?: any[];
      error?: string;
    };
    installDeps?: {
      success: boolean;
      pm?: string;
      installed?: string[];
      error?: string;
    };
  };
  summary: {
    totalSteps: number;
    successfulSteps: number;
    failedSteps: number;
    errors: string[];
  };
}

/**
 * Execute a complete workflow for applying a component or template
 */
export async function executeWorkflow(options: WorkflowOptions): Promise<WorkflowResult> {
  const { id, destRoot, brand, pathStrategy, pathMap, editPlan, autoDeps = true, dryRun = false } = options;
  
  logger.debug('Executing workflow', { id, destRoot, brand, pathStrategy, autoDeps, dryRun });
  
  const result: WorkflowResult = {
    success: false,
    steps: {},
    summary: {
      totalSteps: 0,
      successfulSteps: 0,
      failedSteps: 0,
      errors: []
    }
  };
  
  try {
    // Step 1: Fetch component/template
    logger.debug('Workflow Step 1: Fetching component/template');
    result.summary.totalSteps++;
    
    try {
      const fetchResult = await handleFetch({ id });
      result.steps.fetch = {
        success: true,
        stageDir: fetchResult.stageDir,
        files: fetchResult.files,
        meta: fetchResult.meta
      };
      result.summary.successfulSteps++;
      
      logger.debug('Fetch completed successfully', { 
        stageDir: fetchResult.stageDir, 
        files: fetchResult.files.length,
        dependencies: fetchResult.meta.dependencies?.length || 0
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.steps.fetch = {
        success: false,
        error: errorMessage
      };
      result.summary.failedSteps++;
      result.summary.errors.push(`Fetch failed: ${errorMessage}`);
      
      logger.error('Fetch step failed', { id, error: errorMessage });
      return result; // Cannot continue without fetch
    }
    
    // Step 2: Install files
    logger.debug('Workflow Step 2: Installing files');
    result.summary.totalSteps++;
    
    try {
      const installOptions: any = {
        stageDir: result.steps.fetch.stageDir,
        destRoot,
        dryRun
      };
      
      // Apply path mapping strategy
      if (pathStrategy || pathMap) {
        if (pathMap) {
          installOptions.pathMap = pathMap;
        } else if (pathStrategy === 'next-app') {
          // Use Next.js App Router path mapping
          installOptions.pathMap = {
            'components/': 'src/components/',
            'ui/': 'src/components/ui/',
            'lib/': 'src/lib/',
            'hooks/': 'src/hooks/',
            'utils/': 'src/utils/',
            'types/': 'src/types/',
            'public/': 'public/',
            'assets/': 'public/assets/'
          };
        } else if (pathStrategy === 'vite-react') {
          // Use Vite React path mapping
          installOptions.pathMap = {
            'components/': 'src/components/',
            'ui/': 'src/components/ui/',
            'lib/': 'src/lib/',
            'hooks/': 'src/hooks/',
            'utils/': 'src/utils/',
            'types/': 'src/types/',
            'public/': 'public/',
            'assets/': 'src/assets/'
          };
        }
      }
      
      const installResult = await handleInstall(installOptions);
      result.steps.install = {
        success: true,
        installed: installResult.installed,
        skipped: installResult.skipped,
        overwritten: installResult.overwritten,
        renamed: installResult.renamed
      };
      result.summary.successfulSteps++;
      
      logger.debug('Install completed successfully', { 
        installed: installResult.installed?.length || 0,
        skipped: installResult.skipped?.length || 0
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.steps.install = {
        success: false,
        error: errorMessage
      };
      result.summary.failedSteps++;
      result.summary.errors.push(`Install failed: ${errorMessage}`);
      
      logger.error('Install step failed', { stageDir: result.steps.fetch.stageDir, error: errorMessage });
    }
    
    // Step 3: Text editing (if editPlan provided)
    if (editPlan && Object.keys(editPlan).length > 0) {
      logger.debug('Workflow Step 3: Text editing');
      result.summary.totalSteps++;
      
      try {
        const textEditResult = await handleTextEdit({
          destRoot,
          plan: editPlan
        });
        
        result.steps.textEdit = {
          success: true,
          changedFiles: textEditResult.changedFiles,
          changes: textEditResult.changes
        };
        result.summary.successfulSteps++;
        
        logger.debug('Text edit completed successfully', { 
          changedFiles: textEditResult.changedFiles.length
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.steps.textEdit = {
          success: false,
          error: errorMessage
        };
        result.summary.failedSteps++;
        result.summary.errors.push(`Text edit failed: ${errorMessage}`);
        
        logger.error('Text edit step failed', { destRoot, error: errorMessage });
      }
    }
    
    // Step 4: Install dependencies (if autoDeps enabled and dependencies exist)
    if (autoDeps && result.steps.fetch.meta?.dependencies?.length > 0) {
      logger.debug('Workflow Step 4: Installing dependencies');
      result.summary.totalSteps++;
      
      try {
        // Detect package manager
        const pmInfo = await detectPackageManager(destRoot);
        if (!pmInfo) {
          throw new Error('No package manager found');
        }
        
        // Install main dependencies
        const depsResult = await handleInstallDeps({
          cwd: destRoot,
          packages: result.steps.fetch.meta.dependencies,
          pm: pmInfo.name
        });
        
        result.steps.installDeps = {
          success: true,
          pm: depsResult.pm,
          installed: result.steps.fetch.meta.dependencies
        };
        result.summary.successfulSteps++;
        
        logger.debug('Dependencies installed successfully', { 
          pm: depsResult.pm,
          packages: result.steps.fetch.meta.dependencies
        });
        
        // Install peer dependencies if they exist
        if (result.steps.fetch.meta.peerDependencies?.length > 0) {
          logger.debug('Installing peer dependencies');
          await handleInstallDeps({
            cwd: destRoot,
            packages: result.steps.fetch.meta.peerDependencies,
            pm: pmInfo.name
          });
          
          logger.debug('Peer dependencies installed successfully', { 
            packages: result.steps.fetch.meta.peerDependencies
          });
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.steps.installDeps = {
          success: false,
          error: errorMessage
        };
        result.summary.failedSteps++;
        result.summary.errors.push(`Dependency installation failed: ${errorMessage}`);
        
        logger.error('Dependency installation step failed', { 
          destRoot, 
          dependencies: result.steps.fetch.meta.dependencies,
          error: errorMessage 
        });
      }
    }
    
    // Determine overall success
    result.success = result.summary.failedSteps === 0;
    
    logger.debug('Workflow completed', {
      success: result.success,
      totalSteps: result.summary.totalSteps,
      successfulSteps: result.summary.successfulSteps,
      failedSteps: result.summary.failedSteps,
      errors: result.summary.errors.length
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected workflow error', { options, error: errorMessage });
    
    result.summary.errors.push(`Unexpected error: ${errorMessage}`);
    return result;
  }
}

/**
 * Generate default edit plan for brand customization
 */
export function generateBrandEditPlan(brand: string): {
  include: string[];
  exclude: string[];
  replacements: Array<{
    find?: string;
    findRegex?: string;
    replaceWith: string;
  }>;
  options: {
    dryRun: boolean;
    limitChangedFiles: number;
    previewContextLines: number;
  };
} {
  return {
    include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js', '**/*.md', '**/*.json'],
    exclude: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
    replacements: [
      { find: '{{BRAND}}', replaceWith: brand },
      { find: '{{COMPANY}}', replaceWith: brand },
      { find: '{{NAME}}', replaceWith: brand },
      { find: 'Dooi', replaceWith: brand },
      { find: 'dooi', replaceWith: brand.toLowerCase() }
    ],
    options: {
      dryRun: false,
      limitChangedFiles: 100,
      previewContextLines: 3
    }
  };
}

/**
 * Validate workflow options
 */
export function validateWorkflowOptions(options: WorkflowOptions): void {
  if (!options.id || typeof options.id !== 'string') {
    throw createError(ErrorCode.INVALID_INPUT, 
      'Workflow ID is required',
      { id: options.id }
    );
  }
  
  if (!options.destRoot || typeof options.destRoot !== 'string') {
    throw createError(ErrorCode.INVALID_INPUT, 
      'Destination root is required',
      { destRoot: options.destRoot }
    );
  }
  
  if (options.pathStrategy && !['next-app', 'vite-react'].includes(options.pathStrategy)) {
    throw createError(ErrorCode.INVALID_INPUT, 
      'Invalid path strategy',
      { pathStrategy: options.pathStrategy }
    );
  }
}
