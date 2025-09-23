/**
 * Workflow orchestration engine for dooi operations - Fixed version
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

export function generateBrandEditPlan(brand: string): Record<string, any> {
  return {
    include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js', '**/*.md', '**/*.json'],
    replacements: [
      {
        find: 'Brand',
        replaceWith: brand
      },
      {
        find: 'BRAND',
        replaceWith: brand.toUpperCase()
      },
      {
        find: 'brand',
        replaceWith: brand.toLowerCase()
      }
    ]
  };
}

export function validateWorkflowOptions(options: WorkflowOptions): void {
  if (!options.id) {
    throw createError(ErrorCode.INVALID_INPUT, 'ID is required');
  }
  if (!options.destRoot) {
    throw createError(ErrorCode.INVALID_INPUT, 'Destination root is required');
  }
}

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
        dependencies: fetchResult.meta.dependencies?.length || 0,
        uses: fetchResult.meta.uses?.length || 0
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
    
    // Step 2: Install files (handle templates that reference components)
    logger.debug('Workflow Step 2: Installing files');
    result.summary.totalSteps++;
    
    try {
      const fetchMeta = result.steps.fetch.meta;
      const usesComponents = fetchMeta?.uses || [];
      
      if (usesComponents.length > 0) {
        // This is a template that uses other components - fetch and install each component
        logger.debug('Template uses components, fetching each component', { usesComponents });
        
        const allInstalledFiles = [];
        const allSkippedFiles = [];
        const allOverwrittenFiles = [];
        const allRenamedFiles = [];
        
        for (const componentId of usesComponents) {
          logger.debug(`Fetching component: ${componentId}`);
          
          try {
            // Fetch the component
            const componentFetchResult = await handleFetch({ id: componentId });
            
            // Install the component
            const installOptions: any = {
              stageDir: componentFetchResult.stageDir,
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
                  'assets/': 'src/assets/'
                };
              }
            }
            
            const componentInstallResult = await handleInstall(installOptions);
            
            // Aggregate results
            allInstalledFiles.push(...(componentInstallResult.installed || []));
            allSkippedFiles.push(...(componentInstallResult.skipped || []));
            allOverwrittenFiles.push(...(componentInstallResult.overwritten || []));
            allRenamedFiles.push(...(componentInstallResult.renamed || []));
            
            logger.debug(`Component ${componentId} installed successfully`, {
              installed: (componentInstallResult.installed || []).length,
              skipped: (componentInstallResult.skipped || []).length
            });
            
          } catch (componentError) {
            const errorMessage = componentError instanceof Error ? componentError.message : String(componentError);
            logger.error(`Failed to install component ${componentId}`, { error: errorMessage });
            throw new Error(`Failed to install component ${componentId}: ${errorMessage}`);
          }
        }
        
        result.steps.install = {
          success: true,
          installed: allInstalledFiles,
          skipped: allSkippedFiles,
          overwritten: allOverwrittenFiles,
          renamed: allRenamedFiles
        };
        
      } else {
        // This is a regular component - install directly
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
      }
      
      result.summary.successfulSteps++;
      
      logger.debug('Install completed successfully', { 
        installed: (result.steps.install.installed || []).length,
        skipped: (result.steps.install.skipped || []).length,
        overwritten: (result.steps.install.overwritten || []).length,
        renamed: (result.steps.install.renamed || []).length
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
      return result; // Cannot continue without install
    }
    
    // Step 3: Apply text edits (brand customization)
    if (editPlan && Object.keys(editPlan).length > 0) {
      logger.debug('Workflow Step 3: Applying text edits');
      result.summary.totalSteps++;
      
      try {
        const textEditOptions: any = {
          destRoot,
          ...editPlan
        };
        
        const textEditResult = await handleTextEdit(textEditOptions);
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
        // Continue execution - text edit is optional
      }
    }
    
    // Step 4: Install dependencies
    if (autoDeps && result.steps.fetch.meta?.dependencies?.length > 0) {
      logger.debug('Workflow Step 4: Installing dependencies');
      result.summary.totalSteps++;
      
      try {
        const dependencies = result.steps.fetch.meta.dependencies;
        
        // Detect package manager
        const packageManager = await detectPackageManager(destRoot);
        logger.debug('Detected package manager', { packageManager });
        
        const installDepsOptions: any = {
          destRoot,
          packages: dependencies,
          packageManager
        };
        
        const installDepsResult = await handleInstallDeps(installDepsOptions);
        result.steps.installDeps = {
          success: true,
          installed: dependencies // Use the original dependencies list
        };
        result.summary.successfulSteps++;
        
        logger.debug('Dependency installation completed successfully', { 
          installed: dependencies.length,
          packageManager: installDepsResult.pm
        });
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.steps.installDeps = {
          success: false,
          error: errorMessage
        };
        result.summary.failedSteps++;
        result.summary.errors.push(`Dependency installation failed: ${errorMessage}`);
        
        logger.error('Dependency installation step failed', { destRoot, dependencies: result.steps.fetch.meta.dependencies, error: errorMessage });
        // Continue execution - dependency installation failure shouldn't stop the workflow
      }
    }
    
    // Determine overall success
    result.success = result.summary.failedSteps === 0;
    
    logger.debug('Workflow execution completed', {
      success: result.success,
      totalSteps: result.summary.totalSteps,
      successfulSteps: result.summary.successfulSteps,
      failedSteps: result.summary.failedSteps,
      errors: result.summary.errors
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Workflow execution failed', { error: errorMessage });
    
    result.summary.errors.push(`Workflow failed: ${errorMessage}`);
    result.success = false;
    
    return result;
  }
}
