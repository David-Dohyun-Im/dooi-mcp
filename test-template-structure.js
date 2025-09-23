#!/usr/bin/env node

// Test to see what files are actually in the landing-morphic template
import { spawn } from 'child_process';

async function testTemplateStructure() {
  console.log('🔍 Testing Template Structure');
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
  
  // Test 1: Just fetch the template to see its structure
  const fetchTest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.fetch',
      arguments: {
        id: 'landing-morphic'
      }
    }
  };
  
  console.log('📤 Fetching landing-morphic template...');
  serverProcess.stdin.write(JSON.stringify(fetchTest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ Fetch successful!');
    console.log('📁 Files in template:');
    
    const files = response.result.files || [];
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    console.log('\n📋 Template metadata:');
    console.log(`   ID: ${response.result.meta?.id || 'N/A'}`);
    console.log(`   Title: ${response.result.meta?.title || 'N/A'}`);
    console.log(`   Dependencies: ${JSON.stringify(response.result.meta?.dependencies || [])}`);
    console.log(`   Stage Directory: ${response.result.stageDir || 'N/A'}`);
    
    console.log('\n📄 Full response:');
    console.log(JSON.stringify(response.result, null, 2));
    
    // Let's also check what's actually in the stage directory
    console.log('\n🔍 Checking actual files in stage directory...');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      const stageDir = response.result.stageDir;
      const files = await fs.readdir(stageDir, { recursive: true });
      console.log('📁 Actual files in stage directory:');
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    } catch (error) {
      console.log(`❌ Could not read stage directory: ${error.message}`);
    }
    
  } else if (response && response.error) {
    console.log('❌ Fetch failed');
    console.log(`   Error: ${response.error.message}`);
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 Template Structure Test Complete');
}

testTemplateStructure();
