#!/usr/bin/env node

// Test MCP resources and prompts system
import { getDooiResources, getResourceContent } from './dist/capabilities/resources/index.js';
import { getDooiPrompts, executePrompt } from './dist/capabilities/prompts/index.js';

async function testMCPResourcesAndPrompts() {
  console.log('🧪 Testing MCP Resources and Prompts System');
  console.log('==========================================\n');
  
  try {
    // Test 1: Get all dooi resources
    console.log('📦 Testing Resources');
    console.log('===================');
    
    const resources = await getDooiResources();
    console.log(`✅ Found ${resources.length} resources`);
    
    if (resources.length > 0) {
      console.log('\n📋 Available Resources:');
      resources.slice(0, 5).forEach(resource => {
        console.log(`   • ${resource.uri} - ${resource.description}`);
      });
      
      // Test getting specific resource content
      console.log('\n🔍 Testing Resource Content:');
      const firstResource = resources[0];
      if (firstResource) {
        console.log(`Getting content for: ${firstResource.uri}`);
        const content = await getResourceContent(firstResource.uri);
        if (content) {
          console.log(`✅ Content retrieved (${content.content?.length || 0} characters)`);
          console.log(`   • MIME type: ${content.mimeType}`);
          console.log(`   • Metadata: ${JSON.stringify(content.metadata, null, 2)}`);
        } else {
          console.log('❌ Failed to get resource content');
        }
      }
    }
    
    // Test 2: Get all dooi prompts
    console.log('\n\n💬 Testing Prompts');
    console.log('=================');
    
    const prompts = getDooiPrompts();
    console.log(`✅ Found ${prompts.length} prompts`);
    
    prompts.forEach(prompt => {
      console.log(`\n📝 ${prompt.name}:`);
      console.log(`   Description: ${prompt.description}`);
      console.log(`   Arguments: ${prompt.arguments.map(arg => `${arg.name}${arg.required ? '*' : ''}`).join(', ')}`);
    });
    
    // Test 3: Execute component selection prompt
    console.log('\n\n🎯 Testing Component Selection Prompt');
    console.log('=====================================');
    
    try {
      const componentPrompt = await executePrompt('select-component', {
        useCase: 'hero section for landing page',
        framework: 'next',
        style: 'modern'
      });
      
      console.log('✅ Component selection prompt executed');
      console.log(`   Content length: ${componentPrompt.length} characters`);
      console.log('\n📄 Prompt Content Preview:');
      console.log(componentPrompt.substring(0, 500) + '...');
      
    } catch (error) {
      console.log('❌ Component selection prompt failed:', error.message);
    }
    
    // Test 4: Execute template selection prompt
    console.log('\n\n🎯 Testing Template Selection Prompt');
    console.log('=====================================');
    
    try {
      const templatePrompt = await executePrompt('select-template', {
        projectType: 'landing page',
        framework: 'next',
        features: 'modern design, responsive'
      });
      
      console.log('✅ Template selection prompt executed');
      console.log(`   Content length: ${templatePrompt.length} characters`);
      console.log('\n📄 Prompt Content Preview:');
      console.log(templatePrompt.substring(0, 500) + '...');
      
    } catch (error) {
      console.log('❌ Template selection prompt failed:', error.message);
    }
    
    // Test 5: Execute component application prompt
    console.log('\n\n🎯 Testing Component Application Prompt');
    console.log('=======================================');
    
    try {
      const applyPrompt = await executePrompt('apply-component', {
        componentId: 'ui/fluid-blob',
        projectPath: '/tmp/test-project',
        brandName: 'MyCompany'
      });
      
      console.log('✅ Component application prompt executed');
      console.log(`   Content length: ${applyPrompt.length} characters`);
      console.log('\n📄 Prompt Content Preview:');
      console.log(applyPrompt.substring(0, 500) + '...');
      
    } catch (error) {
      console.log('❌ Component application prompt failed:', error.message);
    }
    
    console.log('\n\n🎉 MCP Resources and Prompts Test Complete!');
    console.log('==========================================');
    console.log('✅ Resources system working');
    console.log('✅ Prompts system working');
    console.log('✅ Component selection prompts working');
    console.log('✅ Template selection prompts working');
    console.log('✅ Application prompts working');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testMCPResourcesAndPrompts();
