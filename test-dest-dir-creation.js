#!/usr/bin/env node

// Test that destination directory creation works
import { spawn } from 'child_process';

async function testDestDirCreation() {
  console.log('🧪 Testing Destination Directory Creation');
  console.log('==========================================\n');
  
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
  
  // Test with a non-existent directory
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-new-directory-creation',
        pathMap: {
          'src/components/ui/': 'components/ui/'
        },
        editPlan: {}
      }
    }
  };
  
  console.log('📤 Testing with non-existent destination directory...');
  console.log('   Directory: /tmp/test-new-directory-creation');
  
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Directory creation and workflow execution completed!');
    console.log(`   Result: ${JSON.stringify(response.result, null, 2)}`);
  } else if (response && response.error) {
    console.log('❌ FAILED: Error occurred');
    console.log(`   Error: ${response.error.message}`);
    
    // Check if it's still the directory existence error
    if (response.error.message.includes('Destination root directory does not exist')) {
      console.log('❌ Directory creation fix did not work - still getting directory existence error');
    } else {
      console.log('✅ Directory creation fix worked - error is now different (expected)');
    }
    
    if (response.error.details) {
      console.log(`   Details: ${JSON.stringify(response.error.details, null, 2)}`);
    }
  } else {
    console.log('⏳ No response received');
  }
  
  // Check if directory was actually created
  const fs = await import('fs/promises');
  try {
    await fs.stat('/tmp/test-new-directory-creation');
    console.log('✅ Directory was successfully created: /tmp/test-new-directory-creation');
  } catch (error) {
    console.log('❌ Directory was not created: /tmp/test-new-directory-creation');
  }
  
  console.log('\n🎯 Destination Directory Creation Test Complete');
}

testDestDirCreation();
