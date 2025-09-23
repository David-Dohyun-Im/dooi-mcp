#!/usr/bin/env node

// Test to see what components are actually available in dooi-ui
import { spawn } from 'child_process';

async function testDooiList() {
  console.log('🔍 Testing DooiUI Component List');
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
  
  // Test the list command
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.list',
      arguments: {}
    }
  };
  
  console.log('📤 Getting list of available components...');
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Got component list!');
    console.log('\n📋 Raw Response:');
    console.log(JSON.stringify(response.result, null, 2));
    
    console.log('\n📋 Available Components:');
    
    const items = response.result.items || [];
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.id} (${item.type})`);
      console.log(`      Title: ${item.title}`);
      console.log(`      Description: ${item.description}`);
      console.log('');
    });
    
    console.log('🔍 Looking for Hero components...');
    const heroComponents = items.filter(item => item.id.includes('Hero/'));
    if (heroComponents.length > 0) {
      console.log('📋 Hero Components found:');
      heroComponents.forEach(comp => {
        console.log(`   • ${comp.id}: ${comp.title}`);
      });
    } else {
      console.log('❌ No Hero components found');
    }
    
    console.log('🔍 Looking for ui components...');
    const uiComponents = items.filter(item => item.id.includes('ui/'));
    if (uiComponents.length > 0) {
      console.log('📋 UI Components found:');
      uiComponents.forEach(comp => {
        console.log(`   • ${comp.id}: ${comp.title}`);
      });
    } else {
      console.log('❌ No UI components found');
    }
    
  } else if (response && response.error) {
    console.log('❌ FAILED: List command failed');
    console.log(`   Error: ${response.error.message}`);
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 DooiUI List Test Complete');
}

testDooiList();
