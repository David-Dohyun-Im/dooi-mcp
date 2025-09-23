/**
 * dooi.installDeps tool implementation
 */

import { InstallDepsInputSchema, type InstallDepsInput, type InstallDepsOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat } from 'fs/promises';
import { installPackages } from '../../core/install.js';
import { detectPackageManager } from '../../core/pm.js';

export async function handleInstallDeps(args: unknown): Promise<InstallDepsOutput> {
  // Validate input
  const input = InstallDepsInputSchema.parse(args);
  
  logger.debug('Handling dooi.installDeps request', input);
  
  try {
    // Check if working directory exists
    try {
      await stat(input.cwd);
    } catch {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Working directory does not exist',
        { cwd: input.cwd }
      );
    }
    
    // Validate packages
    if (!input.packages || input.packages.length === 0) {
      throw createError(ErrorCode.INVALID_INPUT, 
        'No packages specified for installation',
        {}
      );
    }
    
    // Detect package manager if not specified
    let packageManager = input.pm;
    if (!packageManager) {
      const detected = await detectPackageManager(input.cwd);
      if (!detected) {
        throw createError(ErrorCode.PM_NOT_FOUND, 
          'No package manager found. Please specify one or ensure package.json exists.',
          { cwd: input.cwd }
        );
      }
      packageManager = detected.name;
      logger.debug('Auto-detected package manager', { pm: packageManager, cwd: input.cwd });
    }
    
    // Install packages
    const result = await installPackages({
      cwd: input.cwd,
      packages: input.packages,
      pm: packageManager,
      flags: input.flags || [],
      timeoutMs: 30000
    });
    
    if (!result.success) {
      logger.error('Package installation failed', {
        pm: result.pm,
        exitCode: result.exitCode,
        stderr: result.stderr,
        errors: result.errors
      });
      
      throw createError(ErrorCode.PM_EXIT, 
        `Package installation failed with exit code ${result.exitCode}`,
        {
          pm: result.pm,
          exitCode: result.exitCode,
          stderr: result.stderr,
          errors: result.errors
        }
      );
    }
    
    logger.debug('Package installation completed successfully', {
      pm: result.pm,
      installedCount: result.installedPackages.length,
      installedPackages: result.installedPackages
    });
    
    // Get last few lines of output for summary
    const stdoutLines = result.stdout.split('\n');
    const stdoutTail = stdoutLines.slice(-5).join('\n').trim();
    
    return {
      pm: result.pm,
      args: result.args,
      stdoutTail: stdoutTail || 'Packages installed successfully'
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error in dooi.installDeps', error);
    throw createError(ErrorCode.INTERNAL_ERROR, "Unexpected error", {
      originalError: error instanceof Error ? error.message : String(error)
    });
  }
}
