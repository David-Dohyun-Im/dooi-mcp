#!/usr/bin/env node

// Debug test for MCP server
import { spawn } from 'child_process';
import { writeFile, readFile } from 'fs/promises';

async function testMCPServer() {
  console.log('🔍 Testing MCP Server Debug');
  console.log('===========================\n');
  
  try {
    // Test 1: Check if server starts without errors
    console.log('📡 Testing server startup...');
    
    const serverProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    let serverError = '';
    
    serverProcess.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    serverProcess.stderr.on('data', (data) => {
      serverError += data.toString();
    });
    
    // Wait a bit for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Send a simple MCP request to test
    const testRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };
    
    console.log('📤 Sending initialize request...');
    serverProcess.stdin.write(JSON.stringify(testRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send list resources request
    const listResourcesRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "resources/list"
    };
    
    console.log('📤 Sending list resources request...');
    serverProcess.stdin.write(JSON.stringify(listResourcesRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Kill the server
    serverProcess.kill();
    
    console.log('📥 Server Output:', serverOutput);
    console.log('❌ Server Errors:', serverError);
    
    if (serverError) {
      console.log('❌ Server has errors:', serverError);
    } else {
      console.log('✅ Server started without errors');
    }
    
    // Test 2: Check if resources module works directly
    console.log('\n📦 Testing resources module directly...');
    
    try {
      const { getDooiResources } = await import('./dist/capabilities/resources/index.js');
      const resources = await getDooiResources();
      console.log(`✅ Resources module works: ${resources.length} resources found`);
      
      if (resources.length > 0) {
        console.log('📋 Sample resource:', resources[0]);
      }
    } catch (error) {
      console.log('❌ Resources module error:', error.message);
    }
    
    // Test 3: Check if prompts module works directly
    console.log('\n💬 Testing prompts module directly...');
    
    try {
      const { getDooiPrompts } = await import('./dist/capabilities/prompts/index.js');
      const prompts = getDooiPrompts();
      console.log(`✅ Prompts module works: ${prompts.length} prompts found`);
      
      if (prompts.length > 0) {
        console.log('📋 Sample prompt:', prompts[0]);
      }
    } catch (error) {
      console.log('❌ Prompts module error:', error.message);
    }
    
    console.log('\n🎯 Debug Test Complete');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

testMCPServer();
