#!/usr/bin/env node

// Advanced test for dependency management
import { handleInstallDeps } from './dist/capabilities/tools/installDeps.js';
import { detectPackageManager, readPackageJson } from './dist/core/pm.js';
import { writeFile, mkdir, readFile } from 'fs/promises';

async function testAdvancedDependencyManagement() {
  console.log('Testing advanced dependency management...');
  
  try {
    // Create a test project directory
    const testDir = '/tmp/test-deps-advanced';
    await mkdir(testDir, { recursive: true });
    
    // Create a package.json
    const packageJson = {
      name: 'test-deps-advanced',
      version: '1.0.0',
      description: 'Test project for dependency management',
      dependencies: {},
      devDependencies: {}
    };
    
    await writeFile(`${testDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('Created test project with package.json');
    
    // Test 1: Multiple package installation
    console.log('\n=== TEST 1: MULTIPLE PACKAGE INSTALLATION ===');
    try {
      const result1 = await handleInstallDeps({
        cwd: testDir,
        packages: ['lodash@latest', 'moment@latest'],
        pm: 'npm'
      });
      
      console.log('Multiple packages result:', JSON.stringify(result1, null, 2));
      
    } catch (error) {
      console.log('Multiple packages error:', error.message);
    }
    
    // Test 2: Package manager auto-detection
    console.log('\n=== TEST 2: AUTO-DETECTION ===');
    try {
      const result2 = await handleInstallDeps({
        cwd: testDir,
        packages: ['uuid@latest']
        // No pm specified - should auto-detect
      });
      
      console.log('Auto-detection result:', JSON.stringify(result2, null, 2));
      
    } catch (error) {
      console.log('Auto-detection error:', error.message);
    }
    
    // Test 3: Check final package.json
    console.log('\n=== TEST 3: FINAL PACKAGE.JSON ===');
    const finalPackageJson = await readFile(`${testDir}/package.json`, 'utf8');
    console.log('Final package.json:', JSON.parse(finalPackageJson));
    
    // Test 4: Package manager detection after installation
    console.log('\n=== TEST 4: PM DETECTION AFTER INSTALL ===');
    const pmInfo = await detectPackageManager(testDir);
    console.log('Package manager info:', pmInfo);
    
  } catch (error) {
    console.error('Advanced test error:', error);
  }
}

testAdvancedDependencyManagement();
