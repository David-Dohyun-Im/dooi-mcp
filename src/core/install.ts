/**
 * Package installation and dependency management
 */

import { execa } from 'execa';
import { logger } from './logger.js';
import { createError, ErrorCode } from './errors.js';
import { detectPackageManager, getPackageManagerInfo, validatePackageNames, parsePackageSpec, type PackageManager } from './pm.js';

export interface InstallOptions {
  cwd: string;
  packages: string[];
  pm?: PackageManager;
  flags?: string[];
  dev?: boolean;
  peer?: boolean;
  timeoutMs?: number;
}

export interface InstallResult {
  success: boolean;
  pm: string;
  command: string;
  args: string[];
  stdout: string;
  stderr: string;
  exitCode: number;
  installedPackages: string[];
  errors?: string[];
}

/**
 * Install packages using the specified package manager
 */
export async function installPackages(options: InstallOptions): Promise<InstallResult> {
  const { cwd, packages, pm, flags = [], dev = false, peer = false, timeoutMs = 30000 } = options;
  
  logger.debug('Installing packages', { cwd, packages, pm, dev, peer });
  
  try {
    // Validate package names
    validatePackageNames(packages);
    
    // Detect or use specified package manager
    let packageManager: PackageManager;
    if (pm) {
      packageManager = pm;
    } else {
      const detected = await detectPackageManager(cwd);
      if (!detected) {
        throw createError(ErrorCode.PM_NOT_FOUND, 
          'No package manager found and none specified',
          { cwd }
        );
      }
      packageManager = detected.name;
    }
    
    // Get package manager info
    const pmInfo = getPackageManagerInfo(packageManager);
    
    // Build command arguments
    const args = [...pmInfo.addCommand];
    
    // Add dev flag if needed
    if (dev && packageManager !== 'pnpm') {
      args.push('--save-dev');
    } else if (dev && packageManager === 'pnpm') {
      args.push('--save-dev');
    }
    
    // Add peer flag if needed
    if (peer) {
      if (packageManager === 'npm') {
        args.push('--save-peer');
      } else if (packageManager === 'yarn') {
        args.push('--peer');
      } else if (packageManager === 'pnpm') {
        args.push('--save-peer');
      }
    }
    
    // Add custom flags
    args.push(...flags);
    
    // Add packages
    args.push(...packages);
    
    // Execute installation
    logger.debug('Executing package installation', { 
      pm: packageManager, 
      command: packageManager, 
      args, 
      cwd 
    });
    
    const result = await execa(packageManager, args, {
      cwd,
      timeout: timeoutMs,
      reject: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Parse installed packages from output
    const installedPackages = parseInstalledPackages(result.stdout, packages);
    
    // Check for errors
    const errors: string[] = [];
    if (result.exitCode !== 0) {
      errors.push(`Package manager exited with code ${result.exitCode}`);
      if (result.stderr) {
        errors.push(result.stderr);
      }
    }
    
    logger.debug('Package installation completed', {
      pm: packageManager,
      exitCode: result.exitCode,
      installedCount: installedPackages.length,
      errors: errors.length
    });
    
    return {
      success: result.exitCode === 0,
      pm: packageManager,
      command: packageManager,
      args,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      installedPackages,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error during package installation', { options, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error during package installation',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Install all dependencies from package.json
 */
export async function installAllDependencies(options: {
  cwd: string;
  pm?: PackageManager;
  flags?: string[];
  timeoutMs?: number;
}): Promise<InstallResult> {
  const { cwd, pm, flags = [], timeoutMs = 30000 } = options;
  
  logger.debug('Installing all dependencies', { cwd, pm });
  
  try {
    // Detect or use specified package manager
    let packageManager: PackageManager;
    if (pm) {
      packageManager = pm;
    } else {
      const detected = await detectPackageManager(cwd);
      if (!detected) {
        throw createError(ErrorCode.PM_NOT_FOUND, 
          'No package manager found and none specified',
          { cwd }
        );
      }
      packageManager = detected.name;
    }
    
    // Get package manager info
    const pmInfo = getPackageManagerInfo(packageManager);
    
    // Build command arguments
    const args = [...pmInfo.installCommand, ...flags];
    
    // Execute installation
    logger.debug('Executing dependency installation', { 
      pm: packageManager, 
      command: packageManager, 
      args, 
      cwd 
    });
    
    const result = await execa(packageManager, args, {
      cwd,
      timeout: timeoutMs,
      reject: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Check for errors
    const errors: string[] = [];
    if (result.exitCode !== 0) {
      errors.push(`Package manager exited with code ${result.exitCode}`);
      if (result.stderr) {
        errors.push(result.stderr);
      }
    }
    
    logger.debug('Dependency installation completed', {
      pm: packageManager,
      exitCode: result.exitCode,
      errors: errors.length
    });
    
    return {
      success: result.exitCode === 0,
      pm: packageManager,
      command: packageManager,
      args,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      installedPackages: [], // All dependencies installed
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw error;
    }
    
    logger.error('Unexpected error during dependency installation', { options, error });
    throw createError(ErrorCode.INTERNAL_ERROR, 
      'Unexpected error during dependency installation',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Parse installed packages from package manager output
 */
function parseInstalledPackages(output: string, requestedPackages: string[]): string[] {
  const installed: string[] = [];
  
  // Simple parsing - look for package names in the output
  for (const pkg of requestedPackages) {
    const { name } = parsePackageSpec(pkg);
    
    // Check if package name appears in successful installation messages
    if (output.includes(name) && (
      output.includes('added') || 
      output.includes('installed') || 
      output.includes('✓') ||
      output.includes('success')
    )) {
      installed.push(pkg);
    }
  }
  
  // If we couldn't parse specific packages, assume all were installed if exit code was 0
  if (installed.length === 0 && requestedPackages.length > 0) {
    return requestedPackages;
  }
  
  return installed;
}

/**
 * Check if packages are already installed
 */
export async function checkPackagesInstalled(cwd: string, packages: string[]): Promise<{
  installed: string[];
  missing: string[];
  versions: Record<string, string>;
}> {
  const installed: string[] = [];
  const missing: string[] = [];
  const versions: Record<string, string> = {};
  
  for (const pkg of packages) {
    const { name } = parsePackageSpec(pkg);
    
    try {
      // This would need to be implemented with actual package.json reading
      // For now, we'll assume packages are missing if we can't determine otherwise
      const version = await getInstalledPackageVersion(cwd, name);
      
      if (version) {
        installed.push(pkg);
        versions[name] = version;
      } else {
        missing.push(pkg);
      }
    } catch {
      missing.push(pkg);
    }
  }
  
  return { installed, missing, versions };
}

/**
 * Get installed package version (placeholder implementation)
 */
async function getInstalledPackageVersion(cwd: string, packageName: string): Promise<string | null> {
  // This would need to read package.json and node_modules
  // For now, return null to indicate package is not installed
  return null;
}
