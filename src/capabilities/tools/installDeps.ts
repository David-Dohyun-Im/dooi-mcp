/**
 * dooi.installDeps tool implementation
 */

import { InstallDepsInputSchema, type InstallDepsInput, type InstallDepsOutput } from '../../adapters/mcp/schema.js';
import { createError, ErrorCode } from '../../core/errors.js';
import { logger } from '../../core/logger.js';
import { stat, readFile } from 'fs/promises';
import { join } from 'path';
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
    
    // Enhance packages with smart suggestions based on component metadata
    let enhancedPackages = input.packages;
    try {
      // Try to find meta.json in the project to get component context
      const metaPath = join(input.cwd, 'meta.json');
      const metaContent = await readFile(metaPath, 'utf8');
      const meta = JSON.parse(metaContent);
      
      // Add smart package suggestions based on component metadata
      enhancedPackages = enhancePackagesWithMetadata(input.packages, meta);
      logger.debug('Enhanced packages with metadata', { 
        original: input.packages.length,
        enhanced: enhancedPackages.length 
      });
    } catch {
      // No meta.json found, use original packages
      logger.debug('No meta.json found, using original packages');
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
      packages: enhancedPackages,
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

/**
 * Enhance packages with smart suggestions based on component metadata
 */
function enhancePackagesWithMetadata(originalPackages: string[], meta: any): string[] {
  const enhanced = [...originalPackages];
  
  // Add smart package suggestions based on component metadata
  if (meta.tags) {
    // Add tag-specific packages
    if (meta.tags.includes('3d')) {
      // Ensure 3D packages are included
      const threePackages = ['three', '@react-three/fiber', '@react-three/drei'];
      threePackages.forEach(pkg => {
        if (!enhanced.includes(pkg)) {
          enhanced.push(pkg);
        }
      });
    }
    
    if (meta.tags.includes('animation')) {
      // Ensure animation packages are included
      const animationPackages = ['framer-motion'];
      animationPackages.forEach(pkg => {
        if (!enhanced.includes(pkg)) {
          enhanced.push(pkg);
        }
      });
    }
    
    if (meta.tags.includes('interactive')) {
      // Add interactive-specific packages
      const interactivePackages = ['@use-gesture/react'];
      interactivePackages.forEach(pkg => {
        if (!enhanced.includes(pkg)) {
          enhanced.push(pkg);
        }
      });
    }
  }
  
  // Add packages based on complexity
  if (meta.complexity === 'advanced') {
    // Add development packages for advanced components
    const devPackages = ['@types/three'];
    devPackages.forEach(pkg => {
      if (!enhanced.includes(pkg)) {
        enhanced.push(pkg);
      }
    });
  }
  
  // Add packages based on dependencies from metadata
  if (meta.dependencies && Array.isArray(meta.dependencies)) {
    meta.dependencies.forEach((dep: string) => {
      if (!enhanced.includes(dep)) {
        enhanced.push(dep);
      }
    });
  }
  
  // Remove duplicates
  return [...new Set(enhanced)];
}
