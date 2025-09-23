#!/usr/bin/env node

// Test the new LLM-empowered list system
import { spawn } from 'child_process';

async function testLLMEmpoweredList() {
  console.log('🧠 Testing LLM-Empowered List System');
  console.log('====================================\n');
  
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
  
  // Test the new list command
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.list',
      arguments: {}
    }
  };
  
  console.log('📤 Getting LLM-empowered list...');
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Got LLM-empowered list!');
    
    const result = response.result;
    
    // MCP response is in content array, need to parse the text
    let actualResult;
    if (result.content && result.content[0] && result.content[0].text) {
      actualResult = JSON.parse(result.content[0].text);
    } else {
      actualResult = result;
    }
    
    console.log('\n📄 Raw Response Structure:');
    console.log(JSON.stringify(actualResult, null, 2));
    
    console.log('\n🎯 LLM-Empowered Components:');
    console.log('============================');
    
    actualResult.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.id}`);
      console.log(`   Type: ${item.type}`);
      console.log(`   Title: ${item.title}`);
      console.log(`   Description: ${item.description}`);
      if (item.tags && item.tags.length > 0) {
        console.log(`   Tags: ${item.tags.join(', ')}`);
      }
      if (item.category) {
        console.log(`   Category: ${item.category}`);
      }
      if (item.complexity) {
        console.log(`   Complexity: ${item.complexity}`);
      }
    });
    
    console.log('\n🧠 LLM Decision Examples:');
    console.log('=========================');
    
    // Show how LLM can now make decisions based on tags and descriptions
    const threeDComponents = actualResult.items.filter(item => 
      item.tags && item.tags.some(tag => tag.includes('3d'))
    );
    
    const animationComponents = actualResult.items.filter(item => 
      item.tags && item.tags.some(tag => tag.includes('animation'))
    );
    
    const heroComponents = actualResult.items.filter(item => 
      item.tags && item.tags.some(tag => tag.includes('hero'))
    );
    
    console.log('\nUser: "3D 배경을 만들어줘"');
    console.log('→ LLM can choose from 3D-tagged components:');
    threeDComponents.forEach(comp => {
      console.log(`   • ${comp.id}: ${comp.description}`);
    });
    
    console.log('\nUser: "애니메이션 효과를 추가해줘"');
    console.log('→ LLM can choose from animation-tagged components:');
    animationComponents.forEach(comp => {
      console.log(`   • ${comp.id}: ${comp.description}`);
    });
    
    console.log('\nUser: "Hero 섹션을 만들어줘"');
    console.log('→ LLM can choose from hero-tagged components:');
    heroComponents.forEach(comp => {
      console.log(`   • ${comp.id}: ${comp.description}`);
    });
    
    console.log('\n🎯 Benefits of New System:');
    console.log('==========================');
    console.log('✅ No hardcoded recommendations');
    console.log('✅ LLM makes decisions based on tags and descriptions');
    console.log('✅ More flexible and adaptable');
    console.log('✅ Better component discovery through metadata');
    
  } else if (response && response.error) {
    console.log('❌ FAILED: List command failed');
    console.log(`   Error: ${response.error.message}`);
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 LLM-Empowered List Test Complete');
}

testLLMEmpoweredList();
