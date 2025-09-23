#!/usr/bin/env node

// Test the dependency management functionality
import { handleInstallDeps } from './dist/capabilities/tools/installDeps.js';
import { detectPackageManager, readPackageJson } from './dist/core/pm.js';
import { writeFile, mkdir } from 'fs/promises';

async function testDependencyManagement() {
  console.log('Testing dependency management...');
  
  try {
    // Create a test project directory
    const testDir = '/tmp/test-deps-project';
    await mkdir(testDir, { recursive: true });
    
    // Create a package.json
    const packageJson = {
      name: 'test-deps-project',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    };
    
    await writeFile(`${testDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('Created test project with package.json');
    
    // Test package manager detection
    console.log('\n=== PACKAGE MANAGER DETECTION ===');
    const pmInfo = await detectPackageManager(testDir);
    console.log('Detected package manager:', pmInfo);
    
    // Test package.json reading
    console.log('\n=== PACKAGE.JSON READING ===');
    const packageInfo = await readPackageJson(testDir);
    console.log('Package info:', packageInfo);
    
    // Test dependency installation (dry run simulation)
    console.log('\n=== DEPENDENCY INSTALLATION TEST ===');
    console.log('Testing with a safe package (lodash)...');
    
    try {
      const result = await handleInstallDeps({
        cwd: testDir,
        packages: ['lodash@latest'],
        pm: 'npm'
      });
      
      console.log('Install result:', JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.log('Install error (expected in test environment):', error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testDependencyManagement();
