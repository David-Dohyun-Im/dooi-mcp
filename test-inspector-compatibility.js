#!/usr/bin/env node

// Test MCP Inspector compatibility
import { spawn } from 'child_process';

async function testInspectorCompatibility() {
  console.log('🔍 Testing MCP Inspector Compatibility');
  console.log('=====================================\n');
  
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
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test all the methods that MCP Inspector might call
  const tests = [
    {
      name: 'Initialize',
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { roots: { listChanged: true }, sampling: {} },
          clientInfo: { name: 'inspector-test', version: '1.0.0' }
        }
      }
    },
    {
      name: 'List Resources',
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/list'
      }
    },
    {
      name: 'List Prompts',
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'prompts/list'
      }
    },
    {
      name: 'List Tools',
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list'
      }
    },
    {
      name: 'Read Template Resource',
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'resources/read',
        params: { uri: 'dooi://template/landing-morphic' }
      }
    },
    {
      name: 'Read Component Resource',
      request: {
        jsonrpc: '2.0',
        id: 6,
        method: 'resources/read',
        params: { uri: 'dooi://component/ui/fluid-blob' }
      }
    }
  ];
  
  console.log('🧪 Running compatibility tests...\n');
  
  for (const test of tests) {
    console.log(`📤 Testing: ${test.name}`);
    
    const callback = new Promise((resolve) => {
      const originalLength = responses.length;
      const checkResponse = () => {
        if (responses.length > originalLength) {
          const response = responses[responses.length - 1];
          if (response.id === test.request.id) {
            if (response.error) {
              console.log(`   ❌ Error: ${response.error.message} (${response.error.code})`);
            } else {
              console.log(`   ✅ Success`);
            }
            resolve();
          } else {
            setTimeout(checkResponse, 100);
          }
        } else {
          setTimeout(checkResponse, 100);
        }
      };
      checkResponse();
    });
    
    serverProcess.stdin.write(JSON.stringify(test.request) + '\n');
    await callback;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  serverProcess.kill();
  
  console.log('\n🎯 Inspector Compatibility Test Complete');
  console.log('========================================');
  
  const errors = responses.filter(r => r.error);
  const successes = responses.filter(r => !r.error && r.result);
  
  console.log(`✅ Successful requests: ${successes.length}`);
  console.log(`❌ Failed requests: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors found:');
    errors.forEach(error => {
      console.log(`   ${error.error.message} (${error.error.code})`);
    });
  } else {
    console.log('\n🎉 All tests passed! Server is fully compatible with MCP Inspector.');
  }
  
  console.log('\n📋 Available Resources:');
  const resourceResponse = responses.find(r => r.id === 2 && r.result);
  if (resourceResponse) {
    const resources = resourceResponse.result.resources;
    const templates = resources.filter(r => r.uri.includes('/template/'));
    const components = resources.filter(r => r.uri.includes('/component/'));
    
    console.log(`   🏗️  Templates: ${templates.length}`);
    templates.forEach(t => console.log(`      ${t.uri}`));
    
    console.log(`   🎨 Components: ${components.length}`);
    components.forEach(c => console.log(`      ${c.uri}`));
  }
}

testInspectorCompatibility();
