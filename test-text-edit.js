#!/usr/bin/env node

// Test the text editing functionality directly
import { applyEditPlan } from './dist/edits/apply.js';

async function testTextEdit() {
  console.log('Testing text edit functionality...');
  
  try {
    const result = await applyEditPlan({
      destRoot: '/tmp/test-project',
      plan: {
        include: ['test-component.tsx'],
        exclude: [],
        replacements: [
          { find: 'Hello World', replaceWith: 'Welcome to Dooi' }
        ],
        options: {
          dryRun: true,
          limitChangedFiles: 10,
          previewContextLines: 2
        }
      },
      dryRun: true
    });
    
    console.log('Text edit result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTextEdit();
