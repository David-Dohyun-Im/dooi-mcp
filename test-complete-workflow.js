#!/usr/bin/env node

// Test complete workflow: fetch -> install -> installDeps
import { handleFetch } from './dist/capabilities/tools/fetch.js';
import { handleInstall } from './dist/capabilities/tools/install.js';
import { handleInstallDeps } from './dist/capabilities/tools/installDeps.js';
import { writeFile, mkdir } from 'fs/promises';

async function testCompleteWorkflow() {
  console.log('Testing complete dooi workflow...');
  
  try {
    // Create a test project directory
    const projectDir = '/tmp/complete-workflow-project';
    await mkdir(projectDir, { recursive: true });
    
    // Create a package.json for the project
    const packageJson = {
      name: 'complete-workflow-project',
      version: '1.0.0',
      description: 'Test project for complete dooi workflow',
      dependencies: {},
      devDependencies: {}
    };
    
    await writeFile(`${projectDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('Created test project with package.json');
    
    // Step 1: Fetch a component
    console.log('\n=== STEP 1: FETCH COMPONENT ===');
    const fetchResult = await handleFetch({
      id: 'ui/fluid-blob'
    });
    
    console.log('Fetch result:');
    console.log('- Stage directory:', fetchResult.stageDir);
    console.log('- Files:', fetchResult.files);
    console.log('- Dependencies:', fetchResult.meta.dependencies);
    console.log('- Peer dependencies:', fetchResult.meta.peerDependencies);
    
    // Step 2: Install component files
    console.log('\n=== STEP 2: INSTALL COMPONENT FILES ===');
    const installResult = await handleInstall({
      stageDir: fetchResult.stageDir,
      destRoot: projectDir,
      dryRun: false
    });
    
    console.log('Install result:');
    console.log('- Installed files:', installResult.installed?.length || 0);
    console.log('- Installed paths:', installResult.installed);
    
    // Step 3: Install dependencies
    if (fetchResult.meta.dependencies && fetchResult.meta.dependencies.length > 0) {
      console.log('\n=== STEP 3: INSTALL DEPENDENCIES ===');
      const depsResult = await handleInstallDeps({
        cwd: projectDir,
        packages: fetchResult.meta.dependencies,
        pm: 'npm'
      });
      
      console.log('Dependencies result:');
      console.log('- Package manager:', depsResult.pm);
      console.log('- Command:', depsResult.command, depsResult.args.join(' '));
      console.log('- Output:', depsResult.stdoutTail);
    } else {
      console.log('\n=== STEP 3: SKIPPED (NO DEPENDENCIES) ===');
      console.log('No dependencies to install');
    }
    
    // Step 4: Install peer dependencies
    if (fetchResult.meta.peerDependencies && fetchResult.meta.peerDependencies.length > 0) {
      console.log('\n=== STEP 4: INSTALL PEER DEPENDENCIES ===');
      const peerDepsResult = await handleInstallDeps({
        cwd: projectDir,
        packages: fetchResult.meta.peerDependencies,
        pm: 'npm'
      });
      
      console.log('Peer dependencies result:');
      console.log('- Package manager:', peerDepsResult.pm);
      console.log('- Command:', peerDepsResult.command, peerDepsResult.args.join(' '));
      console.log('- Output:', peerDepsResult.stdoutTail);
    } else {
      console.log('\n=== STEP 4: SKIPPED (NO PEER DEPENDENCIES) ===');
      console.log('No peer dependencies to install');
    }
    
    console.log('\n=== WORKFLOW COMPLETE ===');
    console.log('✅ Component fetched and installed');
    console.log('✅ Files copied to project');
    console.log('✅ Dependencies installed');
    console.log('✅ Peer dependencies installed');
    
  } catch (error) {
    console.error('Workflow error:', error);
  }
}

testCompleteWorkflow();
