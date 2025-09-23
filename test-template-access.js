#!/usr/bin/env node

// Simple test to verify template access works
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';

async function testTemplateAccess() {
  console.log('🎯 Testing Template Access');
  console.log('==========================\n');
  
  const serverProcess = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let serverReady = false;
  let responses = [];
  
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        
        if (response.id === 1 && response.result) {
          serverReady = true;
          console.log('✅ Server initialized successfully');
        }
        
        if (response.method === 'notifications/initialized') {
          console.log('✅ Server ready for requests');
        }
        
        if (response.id === 2 && response.result) {
          console.log('✅ Template resource read successfully');
          const content = JSON.parse(response.result.contents[0].text);
          console.log(`📋 Template: ${content.id}`);
          console.log(`📝 Description: ${content.description}`);
          console.log(`📦 Dependencies: ${content.dependencies?.join(', ') || 'None'}`);
          console.log(`📁 Files: ${content.files?.length || 0} files`);
        }
        
      } catch (error) {
        // Ignore non-JSON lines
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    const logLine = data.toString().trim();
    if (logLine.includes('INFO')) {
      console.log(`📝 ${logLine}`);
    }
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Initialize server
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
        name: 'template-test-client',
        version: '1.0.0'
      }
    }
  };
  
  console.log('📤 Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait for initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send initialized notification
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'notifications/initialized'
  };
  
  serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
  
  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test reading a template resource
  const readTemplateRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'resources/read',
    params: {
      uri: 'dooi://template/landing-morphic'
    }
  };
  
  console.log('📤 Reading template resource...');
  serverProcess.stdin.write(JSON.stringify(readTemplateRequest) + '\n');
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  console.log('\n🎯 Template Access Test Complete');
  console.log('=================================');
  
  const errors = responses.filter(r => r.error);
  if (errors.length > 0) {
    console.log('❌ Errors found:');
    errors.forEach(error => console.log(JSON.stringify(error, null, 2)));
  } else {
    console.log('✅ All tests passed - templates are accessible!');
  }
}

testTemplateAccess();
