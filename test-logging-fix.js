#!/usr/bin/env node

// Test that logging capability error is fixed
import { spawn } from 'child_process';

async function testLoggingFix() {
  console.log('🔧 Testing Logging Capability Fix');
  console.log('==================================\n');
  
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
  
  // Test initialize request to check capabilities
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: 'logging-test-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('📤 Testing server initialization...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  serverProcess.kill();
  
  console.log('\n📊 Analysis Results:');
  console.log('====================');
  
  const initResponse = responses.find(r => r.id === 1 && r.result);
  if (initResponse) {
    const capabilities = initResponse.result.capabilities;
    console.log('✅ Server capabilities:');
    console.log(`   Tools: ${capabilities.tools ? '✅' : '❌'}`);
    console.log(`   Resources: ${capabilities.resources ? '✅' : '❌'}`);
    console.log(`   Prompts: ${capabilities.prompts ? '✅' : '❌'}`);
    console.log(`   Logging: ${capabilities.logging ? '❌ (Should not be present)' : '✅ (Correctly removed)'}`);
    
    if (capabilities.logging) {
      console.log('❌ ERROR: Logging capability is still declared!');
    } else {
      console.log('✅ SUCCESS: Logging capability has been removed!');
    }
  } else {
    console.log('❌ Failed to get initialization response');
  }
  
  const errors = responses.filter(r => r.error);
  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => console.log(`   ${error.error.message} (${error.error.code})`));
  } else {
    console.log('\n✅ No errors found - server working correctly!');
  }
  
  console.log('\n🎯 Logging Fix Test Complete');
  console.log('============================');
  console.log('The server should no longer declare logging capability');
  console.log('and therefore should not trigger "method not found" errors');
  console.log('for logging/setlevel requests.');
}

testLoggingFix();
