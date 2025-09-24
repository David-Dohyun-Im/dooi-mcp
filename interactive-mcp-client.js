#!/usr/bin/env node

// Interactive MCP client for testing templates
import { spawn } from 'child_process';
import { createInterface } from 'readline';

class MCPClient {
  constructor() {
    this.serverProcess = null;
    this.serverReady = false;
    this.requestId = 0;
    this.responses = new Map();
  }

  async start() {
    console.log('🚀 Starting MCP Client for Dooi Templates');
    console.log('==========================================\n');
    
    this.serverProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.serverProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (error) {
          // Ignore non-JSON lines
        }
      }
    });
    
    this.serverProcess.stderr.on('data', (data) => {
      const logLine = data.toString().trim();
      if (logLine.includes('INFO')) {
        console.log(`📝 ${logLine}`);
      }
    });
    
    // Initialize server
    await this.initialize();
    
    // Start interactive mode
    this.startInteractive();
  }
  
  async initialize() {
    return new Promise((resolve) => {
      const initRequest = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {
            roots: { listChanged: true },
            sampling: {}
          },
          clientInfo: {
            name: 'interactive-mcp-client',
            version: '1.0.0'
          }
        }
      };
      
      this.responses.set(this.requestId, (response) => {
        if (response.result) {
          console.log('✅ Server initialized successfully');
          this.serverReady = true;
          
          // Send initialized notification
          const initializedNotification = {
            jsonrpc: '2.0',
            method: 'notifications/initialized'
          };
          
          this.serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');
          setTimeout(resolve, 1000);
        }
      });
      
      this.serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    });
  }
  
  handleResponse(response) {
    if (response.id && this.responses.has(response.id)) {
      const callback = this.responses.get(response.id);
      callback(response);
      this.responses.delete(response.id);
    }
  }
  
  async sendRequest(method, params = {}) {
    return new Promise((resolve) => {
      const request = {
        jsonrpc: '2.0',
        id: ++this.requestId,
        method,
        params
      };
      
      this.responses.set(this.requestId, (response) => {
        resolve(response);
      });
      
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }
  
  async listResources() {
    console.log('\n📦 Listing available resources...');
    const response = await this.sendRequest('resources/list');
    
    if (response.result && response.result.resources) {
      const resources = response.result.resources;
      console.log(`Found ${resources.length} resources:\n`);
      
      const components = resources.filter(r => r.uri.includes('/component/'));
      const templates = resources.filter(r => r.uri.includes('/template/'));
      
      if (templates.length > 0) {
        console.log('🏗️  Templates:');
        templates.forEach(t => {
          console.log(`   ${t.uri} - ${t.description}`);
        });
      }
      
      if (components.length > 0) {
        console.log('\n🎨 Components:');
        components.forEach(c => {
          console.log(`   ${c.uri} - ${c.description}`);
        });
      }
      
      return resources;
    } else {
      console.log('❌ Failed to list resources');
      return [];
    }
  }
  
  async readResource(uri) {
    console.log(`\n📖 Reading resource: ${uri}`);
    const response = await this.sendRequest('resources/read', { uri });
    
    if (response.result && response.result.contents) {
      const content = JSON.parse(response.result.contents[0].text);
      console.log(`✅ Successfully read resource:`);
      console.log(`   ID: ${content.id}`);
      console.log(`   Title: ${content.title}`);
      console.log(`   Description: ${content.description}`);
      console.log(`   Dependencies: ${content.dependencies?.join(', ') || 'None'}`);
      console.log(`   Files: ${content.files?.length || 0} files`);
      return content;
    } else if (response.error) {
      console.log(`❌ Error reading resource: ${response.error.message}`);
      return null;
    } else {
      console.log('❌ Unknown response format');
      return null;
    }
  }
  
  async listPrompts() {
    console.log('\n💬 Listing available prompts...');
    const response = await this.sendRequest('prompts/list');
    
    if (response.result && response.result.prompts) {
      const prompts = response.result.prompts;
      console.log(`Found ${prompts.length} prompts:\n`);
      
      prompts.forEach(p => {
        console.log(`📝 ${p.name}:`);
        console.log(`   ${p.description}`);
        console.log(`   Arguments: ${p.arguments.map(a => a.name + (a.required ? '*' : '')).join(', ')}`);
      });
      
      return prompts;
    } else {
      console.log('❌ Failed to list prompts');
      return [];
    }
  }
  
  startInteractive() {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\n🎯 Interactive MCP Client Ready!');
    console.log('================================');
    console.log('Available commands:');
    console.log('  list - List all resources');
    console.log('  read <uri> - Read a specific resource');
    console.log('  prompts - List available prompts');
    console.log('  quit - Exit the client');
    console.log('');
    
    const promptUser = () => {
      rl.question('mcp> ', async (input) => {
        const [command, ...args] = input.trim().split(' ');
        
        switch (command) {
          case 'list':
            await this.listResources();
            break;
            
          case 'read':
            if (args.length > 0) {
              await this.readResource(args[0]);
            } else {
              console.log('❌ Please provide a resource URI');
            }
            break;
            
          case 'prompts':
            await this.listPrompts();
            break;
            
          case 'quit':
          case 'exit':
            console.log('👋 Goodbye!');
            this.serverProcess.kill();
            rl.close();
            process.exit(0);
            break;
            
          default:
            console.log('❌ Unknown command. Try: list, read <uri>, prompts, quit');
        }
        
        promptUser();
      });
    };
    
    promptUser();
  }
}

// Start the interactive client
const client = new MCPClient();
client.start().catch(console.error);
