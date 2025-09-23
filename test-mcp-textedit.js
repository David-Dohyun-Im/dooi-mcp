#!/usr/bin/env node

// Test the textEdit tool directly through the handleTextEdit function
import { handleTextEdit } from './dist/capabilities/tools/textEdit.js';

async function testTextEditTool() {
  console.log('Testing dooi.textEdit tool directly...');
  
  try {
    const result = await handleTextEdit({
      destRoot: '/tmp/test-project',
      plan: {
        include: ['test-component.tsx'],
        replacements: [
          { find: 'Hello World', replaceWith: 'Welcome to Dooi' }
        ],
        options: {
          dryRun: true,
          previewContextLines: 2
        }
      }
    });
    
    console.log('TextEdit tool result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTextEditTool();
