#!/usr/bin/env node

// Test MCP client connection
import { spawn } from 'child_process';

async function testMCPClient() {
  console.log('🔌 Testing MCP Client Connection');
  console.log('=================================\n');
  
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
        console.log('📥 Response:', JSON.stringify(response, null, 2));
      } catch (error) {
        console.log('📥 Raw output:', line);
      }
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.log('📝 Server log:', data.toString().trim());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send initialize request
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: { listChanged: true },
        sampling: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };
  
  console.log('📤 Sending initialize request...');
  serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send list resources request
  const listResourcesRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "resources/list"
  };
  
  console.log('📤 Sending list resources request...');
  serverProcess.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send list prompts request
  const listPromptsRequest = {
    jsonrpc: "2.0",
    id: 3,
    method: "prompts/list"
  };
  
  console.log('📤 Sending list prompts request...');
  serverProcess.stdin.write(JSON.stringify(listPromptsRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send list tools request
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/list"
  };
  
  console.log('📤 Sending list tools request...');
  serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test reading a specific resource
  const readResourceRequest = {
    jsonrpc: "2.0",
    id: 5,
    method: "resources/read",
    params: {
      uri: "dooi://component/ui/fluid-blob"
    }
  };
  
  console.log('📤 Sending read resource request...');
  serverProcess.stdin.write(JSON.stringify(readResourceRequest) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  console.log('\n✅ MCP Client Test Complete');
  console.log(`📊 Total responses: ${responses.length}`);
  
  // Check for errors
  const errors = responses.filter(r => r.error);
  if (errors.length > 0) {
    console.log('❌ Errors found:');
    errors.forEach(error => console.log(JSON.stringify(error, null, 2)));
  } else {
    console.log('✅ No errors found - server working correctly!');
  }
}

testMCPClient();
