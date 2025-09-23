#!/usr/bin/env node

// Test fetching Hero/FluidBlobDemo to see its description
import { spawn } from 'child_process';

async function testHeroComponent() {
  console.log('🔍 Testing Hero/FluidBlobDemo Component');
  console.log('=======================================\n');
  
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
  
  // Test fetching Hero/FluidBlobDemo
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.fetch',
      arguments: {
        id: 'Hero/FluidBlobDemo'
      }
    }
  };
  
  console.log('📤 Fetching Hero/FluidBlobDemo...');
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Got Hero component details!');
    
    const result = response.result;
    
    // MCP response is in content array, need to parse the text
    let actualResult;
    if (result.content && result.content[0] && result.content[0].text) {
      actualResult = JSON.parse(result.content[0].text);
    } else {
      actualResult = result;
    }
    
    console.log('\n📄 Hero/FluidBlobDemo Details:');
    console.log('==============================');
    console.log(`ID: ${actualResult.id}`);
    console.log(`Type: ${actualResult.type}`);
    console.log(`Title: ${actualResult.title}`);
    console.log(`Description: ${actualResult.description}`);
    console.log(`Dependencies: ${JSON.stringify(actualResult.dependencies, null, 2)}`);
    
    if (actualResult.meta) {
      console.log(`Meta: ${JSON.stringify(actualResult.meta, null, 2)}`);
    }
    
  } else if (response && response.error) {
    console.log('❌ FAILED: Fetch command failed');
    console.log(`   Error: ${response.error.message}`);
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 Hero Component Test Complete');
}

testHeroComponent();
