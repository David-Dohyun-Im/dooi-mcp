#!/usr/bin/env node

// Test the LLM-friendly categorized list
import { spawn } from 'child_process';

async function testLLMFriendlyList() {
  console.log('🧠 Testing LLM-Friendly Categorized List');
  console.log('=========================================\n');
  
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
  
  // Test the enhanced list command
  const test = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'dooi.list',
      arguments: {}
    }
  };
  
  console.log('📤 Getting LLM-friendly categorized list...');
  serverProcess.stdin.write(JSON.stringify(test) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  serverProcess.kill();
  
  // Check result
  const response = responses.find(r => r.id === 1);
  if (response && response.result) {
    console.log('✅ SUCCESS: Got categorized list!');
    
    console.log('\n📄 Raw Response Structure:');
    console.log(JSON.stringify(response.result, null, 2));
    
    const result = response.result;
    
    // MCP response is in content array, need to parse the text
    let actualResult;
    if (result.content && result.content[0] && result.content[0].text) {
      actualResult = JSON.parse(result.content[0].text);
    } else {
      actualResult = result;
    }
    
    const categorized = actualResult.categorizedItems;
    
    if (!categorized) {
      console.log('❌ categorizedItems not found in response');
      return;
    }
    
    console.log('\n🎯 LLM-Friendly Categories:');
    console.log('============================');
    
    console.log('\n📋 By Type:');
    console.log(`   Templates: ${categorized.byType.templates.length}`);
    categorized.byType.templates.forEach(t => {
      console.log(`     • ${t.id}: ${t.title}`);
    });
    
    console.log(`   Components: ${categorized.byType.components.length}`);
    categorized.byType.components.forEach(c => {
      console.log(`     • ${c.id}: ${c.title}`);
    });
    
    console.log('\n🏷️ By Category:');
    console.log(`   UI Components: ${categorized.byCategory.ui.length}`);
    categorized.byCategory.ui.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   Hero Sections: ${categorized.byCategory.hero.length}`);
    categorized.byCategory.hero.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   Card Components: ${categorized.byCategory.cards.length}`);
    categorized.byCategory.cards.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log('\n💡 By Use Case:');
    console.log(`   Background Effects: ${categorized.byUseCase.background.length}`);
    categorized.byUseCase.background.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   Animations: ${categorized.byUseCase.animation.length}`);
    categorized.byUseCase.animation.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   Layout Templates: ${categorized.byUseCase.layout.length}`);
    categorized.byUseCase.layout.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log('\n🚀 Recommendations:');
    console.log(`   For 3D Effects: ${categorized.recommendations.for3D.length}`);
    categorized.recommendations.for3D.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   For Animations: ${categorized.recommendations.forAnimation.length}`);
    categorized.recommendations.forAnimation.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log(`   For Landing Pages: ${categorized.recommendations.forLanding.length}`);
    categorized.recommendations.forLanding.forEach(c => {
      console.log(`     • ${c.id}: ${c.description}`);
    });
    
    console.log('\n🧠 LLM Decision Examples:');
    console.log('=========================');
    console.log('User: "3D 배경을 만들어줘"');
    console.log('→ LLM should choose from:', categorized.recommendations.for3D.map(c => c.id).join(', '));
    
    console.log('\nUser: "애니메이션 효과를 추가해줘"');
    console.log('→ LLM should choose from:', categorized.recommendations.forAnimation.map(c => c.id).join(', '));
    
    console.log('\nUser: "랜딩 페이지를 만들어줘"');
    console.log('→ LLM should choose from:', categorized.recommendations.forLanding.map(c => c.id).join(', '));
    
  } else if (response && response.error) {
    console.log('❌ FAILED: List command failed');
    console.log(`   Error: ${response.error.message}`);
  } else {
    console.log('⏳ No response received');
  }
  
  console.log('\n🎯 LLM-Friendly List Test Complete');
  console.log('==================================');
  console.log('Now LLMs can easily:');
  console.log('  • Find components by use case');
  console.log('  • Get recommendations based on user intent');
  console.log('  • Make informed decisions about which components to use');
}

testLLMFriendlyList();
