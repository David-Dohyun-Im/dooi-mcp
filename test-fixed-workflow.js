#!/usr/bin/env node

// Test the fixed workflow that handles templates properly
import { spawn } from 'child_process';

async function testFixedWorkflow() {
  console.log('🧪 Testing Fixed Workflow (Template Handling)');
  console.log('==============================================\n');
  
  const serverProcess = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responses = [];
  
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
      } catch (error) {
        // Ignore non-JSON lines
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log('📝 Server log:', data.toString().trim());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test the landing-morphic template with fixed workflow
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-fixed-workflow',
        pathMap: {
          'ui/': 'components/ui/',
          'Hero/': 'components/Hero/'
        },
        editPlan: {}
      }
    }
  };
  
  console.log('📤 Testing fixed workflow with landing-morphic template...');
  console.log('   Expected: Should fetch and install ui/fluid-blob and Hero/MorphicDreamsDemo components');
  
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 10000)); // Give more time for component fetching
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Workflow completed!');
    console.log('\n📊 Workflow Results:');
    console.log(JSON.stringify(response.result, null, 2));
    
    // Check if files were actually installed
    console.log('\n🔍 Checking installed files...');
    const fs = await import('fs/promises');
    try {
      const files = await fs.readdir('/tmp/test-fixed-workflow', { recursive: true });
      console.log('📁 Files in destination directory:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    } catch (error) {
      console.log(`❌ Could not read destination directory: ${error.message}`);
    }
    
  } else if (response && response.error) {
    console.log('❌ FAILED: Workflow failed');
    console.log(`   Error: ${response.error.message}`);
    
    if (response.error.details && response.error.details.workflowResult) {
      console.log('\n📋 Workflow Steps:');
      const steps = response.error.details.workflowResult.steps;
      
      console.log(`   Fetch: ${steps.fetch?.success ? '✅' : '❌'} ${steps.fetch?.error || 'Success'}`);
      console.log(`   Install: ${steps.install?.success ? '✅' : '❌'} ${steps.install?.error || 'Success'}`);
      console.log(`   Text Edit: ${steps.textEdit?.success ? '✅' : '❌'} ${steps.textEdit?.error || 'Skipped'}`);
      console.log(`   Install Deps: ${steps.installDeps?.success ? '✅' : '❌'} ${steps.installDeps?.error || 'Skipped'}`);
    }
    
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 Fixed Workflow Test Complete');
  console.log('================================');
  console.log('The workflow should now properly handle templates that reference multiple components.');
}

testFixedWorkflow();
