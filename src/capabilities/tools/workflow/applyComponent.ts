/**
 * dooi.workflow.applyComponent tool implementation
 */

import { WorkflowInputSchema, type WorkflowInput, type WorkflowOutput } from '../../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../../core/errors.js';
import { logger } from '../../../core/logger.js';
import { stat, mkdir } from 'fs/promises';
import { executeWorkflow, generateBrandEditPlan, validateWorkflowOptions } from '../../../core/workflow.js';

export async function handleApplyComponent(args: unknown): Promise<WorkflowOutput> {
  // Validate input
  const input = WorkflowInputSchema.parse(args);
  
  logger.debug('Handling dooi.workflow.applyComponent request', input);
  
  try {
    // Validate workflow options
    validateWorkflowOptions(input);

    // Ensure destination root exists
    try {
      await stat(input.destRoot);
    } catch {
      // Directory doesn't exist, create it
      try {
        await mkdir(input.destRoot, { recursive: true });
        logger.debug('Created destination directory', { destRoot: input.destRoot });
      } catch (mkdirError) {
        throw createError(ErrorCode.INVALID_INPUT, 
          'Failed to create destination directory',
          { destRoot: input.destRoot, error: mkdirError }
        );
      }
    }

    // Generate edit plan if brand is provided
    let editPlan = input.editPlan;
    
    // Handle empty edit plan object
    if (editPlan && typeof editPlan === 'object' && 'include' in editPlan && (!editPlan.include || editPlan.include.length === 0)) {
      editPlan = undefined;
      logger.debug('Empty edit plan provided, treating as undefined');
    } else if (editPlan && typeof editPlan === 'object' && !('include' in editPlan)) {
      editPlan = undefined;
      logger.debug('Empty edit plan object provided, treating as undefined');
    }
    
    if (input.brand && !editPlan) {
      editPlan = generateBrandEditPlan(input.brand);
      logger.debug('Generated brand edit plan', { brand: input.brand });
    }

    // Execute the workflow
    const result = await executeWorkflow({
      id: input.id,
      destRoot: input.destRoot,
      brand: input.brand,
      pathStrategy: input.pathStrategy,
      pathMap: input.pathMap,
      editPlan,
      autoDeps: input.autoDeps !== false, // Default to true
      dryRun: false // Always execute for workflow tools
    });

    // Convert workflow result to WorkflowOutput format
    const output: WorkflowOutput = {
      installed: {
        files: result.steps.install?.installed || [],
        map: input.pathMap || {}
      },
      edits: {
        changedFiles: result.steps.textEdit?.changedFiles || []
      },
      deps: {
        installed: result.steps.installDeps?.installed || []
      }
    };

    // Log workflow summary
    logger.debug('Component application completed', {
      success: result.success,
      steps: result.summary.totalSteps,
      successful: result.summary.successfulSteps,
      failed: result.summary.failedSteps,
      errors: result.summary.errors.length
    });

    // If workflow failed, throw an error with details
    if (!result.success) {
      throw createError(ErrorCode.INTERNAL_ERROR, 
        `Component application workflow failed: ${result.summary.errors.join(', ')}`,
        {
          workflowResult: result,
          errors: result.summary.errors
        }
      );
    }

    return output;
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.workflow.applyComponent', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
