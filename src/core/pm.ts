/**
 * Package manager detection and management
 */

import { stat, readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from './logger.js';
import { createError, ErrorCode } from './errors.js';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface PackageManagerInfo {
  name: PackageManager;
  version?: string;
  lockFile: string;
  installCommand: string[];
  addCommand: string[];
  runCommand: string[];
}

export interface PackageInfo {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Detect package manager from project files
 */
export async function detectPackageManager(cwd: string): Promise<PackageManagerInfo | null> {
  logger.debug('Detecting package manager', { cwd });
  
  try {
    // Check for lock files in order of preference
    const lockFiles = [
      { file: 'pnpm-lock.yaml', manager: 'pnpm' as PackageManager },
      { file: 'yarn.lock', manager: 'yarn' as PackageManager },
      { file: 'package-lock.json', manager: 'npm' as PackageManager }
    ];
    
    for (const { file, manager } of lockFiles) {
      try {
        await stat(join(cwd, file));
        logger.debug('Found package manager', { manager, lockFile: file });
        return getPackageManagerInfo(manager);
      } catch {
        // File doesn't exist, continue checking
      }
    }
    
    // Check for package.json to determine default
    try {
      await stat(join(cwd, 'package.json'));
      logger.debug('Found package.json, defaulting to npm');
      return getPackageManagerInfo('npm');
    } catch {
      logger.debug('No package.json found');
      return null;
    }
    
  } catch (error) {
    logger.error('Error detecting package manager', { cwd, error });
    return null;
  }
}

/**
 * Get package manager information
 */
export function getPackageManagerInfo(manager: PackageManager): PackageManagerInfo {
  const info: Record<PackageManager, PackageManagerInfo> = {
    npm: {
      name: 'npm',
      lockFile: 'package-lock.json',
      installCommand: ['install'],
      addCommand: ['install'],
      runCommand: ['run']
    },
    yarn: {
      name: 'yarn',
      lockFile: 'yarn.lock',
      installCommand: ['install'],
      addCommand: ['add'],
      runCommand: ['run']
    },
    pnpm: {
      name: 'pnpm',
      lockFile: 'pnpm-lock.yaml',
      installCommand: ['install'],
      addCommand: ['add'],
      runCommand: ['run']
    }
  };
  
  return info[manager];
}

/**
 * Read package.json from directory
 */
export async function readPackageJson(cwd: string): Promise<PackageInfo | null> {
  try {
    const packageJsonPath = join(cwd, 'package.json');
    const content = await readFile(packageJsonPath, 'utf8');
    const packageInfo = JSON.parse(content) as PackageInfo;
    
    logger.debug('Read package.json', { cwd, name: packageInfo.name, version: packageInfo.version });
    return packageInfo;
    
  } catch (error) {
    logger.debug('Could not read package.json', { cwd, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Check if a package is already installed
 */
export async function isPackageInstalled(cwd: string, packageName: string): Promise<boolean> {
  try {
    const packageInfo = await readPackageJson(cwd);
    if (!packageInfo) {
      return false;
    }
    
    const allDeps = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
      ...packageInfo.peerDependencies
    };
    
    return packageName in allDeps;
    
  } catch (error) {
    logger.warn('Error checking if package is installed', { cwd, packageName, error });
    return false;
  }
}

/**
 * Get installed package version
 */
export async function getInstalledPackageVersion(cwd: string, packageName: string): Promise<string | null> {
  try {
    const packageInfo = await readPackageJson(cwd);
    if (!packageInfo) {
      return null;
    }
    
    const allDeps = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
      ...packageInfo.peerDependencies
    };
    
    return allDeps[packageName] || null;
    
  } catch (error) {
    logger.warn('Error getting installed package version', { cwd, packageName, error });
    return null;
  }
}

/**
 * Validate package names
 */
export function validatePackageNames(packages: string[]): void {
  for (const pkg of packages) {
    // Basic package name validation
    if (!pkg || typeof pkg !== 'string') {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Invalid package name',
        { packageName: pkg }
      );
    }
    
    // Check for dangerous patterns
    if (pkg.includes('..') || pkg.includes('/..') || pkg.startsWith('/')) {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Package name contains dangerous patterns',
        { packageName: pkg }
      );
    }
    
    // Check length
    if (pkg.length > 214) {
      throw createError(ErrorCode.INVALID_INPUT, 
        'Package name too long',
        { packageName: pkg, length: pkg.length }
      );
    }
  }
}

/**
 * Parse package specification (name@version)
 */
export function parsePackageSpec(spec: string): { name: string; version?: string } {
  const atIndex = spec.lastIndexOf('@');
  
  if (atIndex === -1 || atIndex === 0) {
    // No version specified or starts with @ (scoped package without version)
    return { name: spec };
  }
  
  const name = spec.substring(0, atIndex);
  const version = spec.substring(atIndex + 1);
  
  // Validate version format
  if (version && !isValidVersion(version)) {
    throw createError(ErrorCode.INVALID_INPUT, 
      'Invalid version format',
      { spec, version }
    );
  }
  
  return { name, version };
}

/**
 * Check if version string is valid
 */
function isValidVersion(version: string): boolean {
  // Basic version validation - allow semver, ranges, tags
  const versionPattern = /^[0-9]+\.[0-9]+\.[0-9]+|^[0-9]+\.[0-9]+|^[0-9]+|^latest|^next|^beta|^alpha|^[~^]|^[><=]/;
  return versionPattern.test(version);
}

/**
 * Get package manager executable path
 */
export async function getPackageManagerExecutable(manager: PackageManager): Promise<string> {
  // For now, assume package managers are available in PATH
  // In a more robust implementation, we could check for local installations
  return manager;
}

/**
 * Check if package manager is available
 */
export async function isPackageManagerAvailable(manager: PackageManager): Promise<boolean> {
  try {
    const executable = await getPackageManagerExecutable(manager);
    // In a real implementation, we would check if the executable exists
    // For now, assume they're available
    return true;
  } catch {
    return false;
  }
}
