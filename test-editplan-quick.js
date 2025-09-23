#!/usr/bin/env node

// Quick test for empty editPlan fix
import { spawn } from 'child_process';

async function testEditPlanQuick() {
  console.log('🧪 Quick EditPlan Test');
  console.log('======================\n');
  
  // Create test directory first
  const fs = await import('fs/promises');
  await fs.mkdir('/tmp/test-editplan-quick', { recursive: true });
  
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
  
  // Test the exact case that was failing
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.workflow.applyTemplate',
      arguments: {
        id: 'landing-morphic',
        destRoot: '/tmp/test-editplan-quick',
        pathMap: {
          'src/components/ui/': 'components/ui/'
        },
        editPlan: {}
      }
    }
  };
  
  console.log('📤 Testing empty editPlan object...');
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Empty editPlan object is now handled correctly!');
    console.log(`   Result: ${JSON.stringify(response.result, null, 2)}`);
  } else if (response && response.error) {
    console.log('❌ FAILED: Still getting error with empty editPlan');
    console.log(`   Error: ${response.error.message}`);
    if (response.error.details) {
      console.log(`   Details: ${JSON.stringify(response.error.details, null, 2)}`);
    }
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 Quick Test Complete');
}

testEditPlanQuick();
