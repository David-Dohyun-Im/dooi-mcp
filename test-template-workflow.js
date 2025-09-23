#!/usr/bin/env node

// Test template workflow with a different approach
import { handleApplyTemplate } from './dist/capabilities/tools/workflow/applyTemplate.js';
import { writeFile, mkdir } from 'fs/promises';

async function testTemplateWorkflow() {
  console.log('Testing template workflow...');
  
  try {
    // Create a test project directory
    const projectDir = '/tmp/template-workflow-test';
    await mkdir(projectDir, { recursive: true });
    
    // Create a package.json for the project
    const packageJson = {
      name: 'template-workflow-test',
      version: '1.0.0',
      description: 'Test project for template workflow',
      dependencies: {},
      devDependencies: {}
    };
    
    await writeFile(`${projectDir}/package.json`, JSON.stringify(packageJson, null, 2));
    console.log('Created test project with package.json');
    
    // Test template workflow with custom path mapping
    console.log('\n=== TEMPLATE WORKFLOW TEST ===');
    try {
      const templateResult = await handleApplyTemplate({
        id: 'landing-morphic',
        destRoot: projectDir,
        brand: 'MyCompany',
        pathMap: {
          'components/': 'src/components/',
          'pages/': 'src/pages/',
          'styles/': 'src/styles/',
          'public/': 'public/',
          'assets/': 'public/assets/'
        },
        autoDeps: true
      });
      
      console.log('Template workflow result:', JSON.stringify(templateResult, null, 2));
      
    } catch (error) {
      console.log('Template workflow error:', error.message);
      
      // Let's try with a different template or check what's available
      console.log('\n=== TRYING DIFFERENT TEMPLATE ===');
      try {
        const altResult = await handleApplyTemplate({
          id: 'ui/fluid-blob', // Try with a component instead
          destRoot: projectDir,
          brand: 'MyCompany',
          pathStrategy: 'vite-react',
          autoDeps: true
        });
        
        console.log('Alternative template result:', JSON.stringify(altResult, null, 2));
        
      } catch (altError) {
        console.log('Alternative template error:', altError.message);
      }
    }
    
  } catch (error) {
    console.error('Template workflow test error:', error);
  }
}

testTemplateWorkflow();
