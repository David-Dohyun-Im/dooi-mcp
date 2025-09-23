#!/usr/bin/env node

// Test that empty editPlan object is handled correctly
import { spawn } from 'child_process';

async function testEmptyEditPlanFix() {
  console.log('🔧 Testing Empty EditPlan Fix');
  console.log('==============================\n');
  
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
  
  // Test 1: Empty editPlan object (should work now)
  const test1 = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-empty-editplan',
        pathMap: {
          'src/components/ui/': 'components/ui/'
        },
        editPlan: {}
      }
    }
  };
  
  // Test 2: Undefined editPlan (should work)
  const test2 = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-undefined-editplan',
        pathMap: {
          'src/components/ui/': 'components/ui/'
        }
        // editPlan not provided
      }
    }
  };
  
  // Test 3: Valid editPlan (should work)
  const test3 = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-valid-editplan',
        pathMap: {
          'src/components/ui/': 'components/ui/'
        },
        editPlan: {
          include: ['**/*.tsx'],
          replacements: [
            {
              find: 'Brand',
              replaceWith: 'TestBrand'
            }
          ]
        }
      }
    }
  };
  
  console.log('🧪 Testing Empty EditPlan Handling...');
  
  // Send tests
  serverProcess.stdin.write(JSON.stringify(test1) + '\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.stdin.write(JSON.stringify(test2) + '\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.stdin.write(JSON.stringify(test3) + '\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Analyze results
  console.log('\n📊 Test Results:');
  console.log('================');
  
  const tests = [
    { id: 1, name: 'Empty editPlan object' },
    { id: 2, name: 'Undefined editPlan' },
    { id: 3, name: 'Valid editPlan' }
  ];
  
  tests.forEach(test => {
    const response = responses.find(r => r.id === test.id);
    if (response && response.result) {
      console.log(`✅ Test ${test.id} (${test.name}): Success`);
      if (response.result.installed) {
        console.log(`   📁 Files installed: ${response.result.installed.files.length}`);
      }
      if (response.result.edits) {
        console.log(`   ✏️  Files edited: ${response.result.edits.changedFiles.length}`);
      }
      if (response.result.deps) {
        console.log(`   📦 Dependencies: ${response.result.deps.installed.length}`);
      }
    } else if (response && response.error) {
      console.log(`❌ Test ${test.id} (${test.name}): Failed`);
      console.log(`   Error: ${response.error.message}`);
      if (response.error.details) {
        console.log(`   Details: ${JSON.stringify(response.error.details, null, 2)}`);
      }
    } else {
      console.log(`⏳ Test ${test.id} (${test.name}): No response`);
    }
  });
  
  console.log('\n🎯 Empty EditPlan Fix Test Complete');
  console.log('===================================');
  console.log('Empty editPlan objects should now be handled gracefully');
  console.log('without causing validation errors.');
}

testEmptyEditPlanFix();
