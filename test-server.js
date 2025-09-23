#!/usr/bin/env node

// Simple test to check if the server starts and responds
import { spawn } from 'child_process';

console.log('Starting server test...');

const server = spawn('node', ['dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('STDERR:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  console.log('Final output:', output);
  console.log('Final error:', errorOutput);
});

// Send a simple request
setTimeout(() => {
  console.log('Sending request...');
  server.stdin.write('{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "arguments": {}}\n');
  
  setTimeout(() => {
    console.log('Killing server...');
    server.kill();
  }, 5000);
}, 1000);
