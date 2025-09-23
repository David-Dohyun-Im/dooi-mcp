/**
 * dooi.workflow.applyTemplate tool implementation
 */

import { WorkflowInputSchema, type WorkflowInput, type WorkflowOutput } from '../../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../../core/errors.js';
import { logger } from '../../../core/logger.js';
import { stat } from 'fs/promises';
import { executeWorkflow, generateBrandEditPlan, validateWorkflowOptions } from '../../../core/workflow.js';

export async function handleApplyTemplate(args: unknown): Promise<WorkflowOutput> {
  // Validate input
  const input = WorkflowInputSchema.parse(args);
  
  logger.debug('Handling dooi.workflow.applyTemplate request', input);
  
  try {
    // Validate workflow options
    validateWorkflowOptions(input);

    // Check if destination root exists
    try {
      await stat(input.destRoot);
    } catch {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Destination root directory does not exist',
        { destRoot: input.destRoot }
      );
    }

    // Generate edit plan if brand is provided
    let editPlan = input.editPlan;
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
    logger.debug('Template application completed', {
      success: result.success,
      steps: result.summary.totalSteps,
      successful: result.summary.successfulSteps,
      failed: result.summary.failedSteps,
      errors: result.summary.errors.length
    });

    // If workflow failed, throw an error with details
    if (!result.success) {
      throw createError(ErrorCode.INTERNAL_ERROR, 
        `Template application workflow failed: ${result.summary.errors.join(', ')}`,
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
    
    logger.error('Unexpected error in dooi.workflow.applyTemplate', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
