#!/usr/bin/env node

// Debug AST parsing
import { parse } from '@babel/parser';
import * as t from '@babel/types';
import traverse from '@babel/traverse';

const content = `import React from "react";

const MyComponent = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <p>This is a test component with some text to replace.</p>
    </div>
  );
};

export default MyComponent;`;

console.log('Testing AST parsing...');

try {
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  
  console.log('AST parsed successfully');
  
  let foundText = false;
  traverse.default(ast, {
    enter(path) {
      const node = path.node;
      
      if (t.isJSXText(node)) {
        console.log('Found JSX text:', node.value);
        foundText = true;
      }
    }
  });
  
  console.log('Found JSX text:', foundText);
  
} catch (error) {
  console.error('AST parsing failed:', error);
}
