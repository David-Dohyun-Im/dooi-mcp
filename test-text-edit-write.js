#!/usr/bin/env node

// Test the text editing functionality with actual file writing
import { applyEditPlan } from './dist/edits/apply.js';
import { writeFile, readFile } from 'fs/promises';

async function testTextEditWrite() {
  console.log('Testing text edit with file writing...');
  
  // Create test file
  const testContent = `import React from "react";

const MyComponent = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <p>This is a test component with some text to replace.</p>
      <span>Another text to replace</span>
    </div>
  );
};

export default MyComponent;`;

  await writeFile('/tmp/test-project/test-component-write.tsx', testContent);
  console.log('Created test file');
  
  try {
    // Test with dry run first
    console.log('\n=== DRY RUN ===');
    const dryResult = await applyEditPlan({
      destRoot: '/tmp/test-project',
      plan: {
        include: ['test-component-write.tsx'],
        exclude: [],
        replacements: [
          { find: 'Hello World', replaceWith: 'Welcome to Dooi' },
          { find: 'Another text to replace', replaceWith: 'Replaced text' }
        ],
        options: {
          dryRun: true,
          limitChangedFiles: 10,
          previewContextLines: 2
        }
      },
      dryRun: true
    });
    
    console.log('Dry run result:', JSON.stringify(dryResult, null, 2));
    
    // Test with actual file writing
    console.log('\n=== ACTUAL WRITE ===');
    const writeResult = await applyEditPlan({
      destRoot: '/tmp/test-project',
      plan: {
        include: ['test-component-write.tsx'],
        exclude: [],
        replacements: [
          { find: 'Hello World', replaceWith: 'Welcome to Dooi' },
          { find: 'Another text to replace', replaceWith: 'Replaced text' }
        ],
        options: {
          dryRun: false,
          limitChangedFiles: 10,
          previewContextLines: 2
        }
      },
      dryRun: false
    });
    
    console.log('Write result:', JSON.stringify(writeResult, null, 2));
    
    // Read the modified file
    const modifiedContent = await readFile('/tmp/test-project/test-component-write.tsx', 'utf8');
    console.log('\n=== MODIFIED FILE CONTENT ===');
    console.log(modifiedContent);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testTextEditWrite();
