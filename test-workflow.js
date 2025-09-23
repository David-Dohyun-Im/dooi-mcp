#!/usr/bin/env node

// Test the workflow convenience tools
import { handleApplyComponent } from './dist/capabilities/tools/workflow/applyComponent.js';
import { handleApplyTemplate } from './dist/capabilities/tools/workflow/applyTemplate.js';
import { writeFile, mkdir } from 'fs/promises';

async function testWorkflowTools() {
  console.log('Testing workflow convenience tools...');
  
  try {
    // Create a test project directory
    const projectDir = '/tmp/workflow-test-project';
    await mkdir(projectDir, { recursive: true });
    
    // Create a package.json for the project
    const packageJson = {
      name: 'workflow-test-project',
      version: '1.0.0',
      description: 'Test project for workflow tools',
      dependencies: {},
      devDependencies: {}
    };
    
    await writeFile(`${projectDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('Created test project with package.json');
    
    // Test 1: Apply Component Workflow
    console.log('\n=== TEST 1: APPLY COMPONENT WORKFLOW ===');
    try {
      const componentResult = await handleApplyComponent({
        id: 'ui/fluid-blob',
        destRoot: projectDir,
        brand: 'MyCompany',
        pathStrategy: 'next-app',
        autoDeps: true
      });
      
      console.log('Component workflow result:', JSON.stringify(componentResult, null, 2));
      
    } catch (error) {
      console.log('Component workflow error:', error.message);
    }
    
    // Test 2: Apply Template Workflow
    console.log('\n=== TEST 2: APPLY TEMPLATE WORKFLOW ===');
    try {
      const templateResult = await handleApplyTemplate({
        id: 'landing-morphic',
        destRoot: projectDir,
        brand: 'MyCompany',
        pathStrategy: 'next-app',
        autoDeps: true
      });
      
      console.log('Template workflow result:', JSON.stringify(templateResult, null, 2));
      
    } catch (error) {
      console.log('Template workflow error:', error.message);
    }
    
    // Test 3: Check final project structure
    console.log('\n=== TEST 3: FINAL PROJECT STRUCTURE ===');
    const { execSync } = await import('child_process');
    try {
      const lsResult = execSync(`find ${projectDir} -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" | head -10`, { encoding: 'utf8' });
      console.log('Project files:', lsResult);
    } catch (error) {
      console.log('Error listing files:', error.message);
    }
    
    // Test 4: Check package.json
    console.log('\n=== TEST 4: FINAL PACKAGE.JSON ===');
    const { readFile } = await import('fs/promises');
    try {
      const finalPackageJson = await readFile(`${projectDir}/package.json`, 'utf8');
      console.log('Final package.json:', JSON.parse(finalPackageJson));
    } catch (error) {
      console.log('Error reading package.json:', error.message);
    }
    
  } catch (error) {
    console.error('Workflow test error:', error);
  }
}

testWorkflowTools();
