# Dooi MCP Server API Documentation

## Overview

The Dooi MCP Server provides a comprehensive set of tools, resources, and prompts for working with dooi-ui components and templates. It implements the Model Context Protocol (MCP) specification for seamless integration with AI coding assistants.

## Table of Contents

- [Tools](#tools)
- [Resources](#resources)
- [Prompts](#prompts)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Tools

### Core Tools

#### `dooi.list`
List all available dooi-ui components and templates.

**Input Schema:**
```json
{}
```

**Output Schema:**
```json
{
  "items": [
    {
      "id": "string",
      "type": "template" | "component",
      "title": "string",
      "description": "string"
    }
  ],
  "raw": {
    "stdout": "string",
    "stderr": "string",
    "exitCode": "number"
  }
}
```

**Example:**
```javascript
const result = await dooi.list({});
console.log(result.items); // Array of available components/templates
```

#### `dooi.fetch`
Fetch a specific component or template with metadata.

**Input Schema:**
```json
{
  "id": "string",
  "ref": "string?",
  "options": {
    "timeoutMs": "number?",
    "env": "Record<string, string>?"
  }
}
```

**Output Schema:**
```json
{
  "stageDir": "string",
  "files": ["string"],
  "meta": {
    "id": "string",
    "title": "string?",
    "description": "string?",
    "dependencies": ["string"]?,
    "peerDependencies": ["string"]?,
    "uses": ["string"]?,
    "codeBlock": "string?"
  },
  "raw": {
    "stdout": "string",
    "stderr": "string",
    "exitCode": "number"
  }
}
```

**Example:**
```javascript
const result = await dooi.fetch({
  id: "ui/fluid-blob"
});
console.log(result.files); // ["components/ui/fluid-blob.tsx", "package.json"]
console.log(result.meta.dependencies); // ["three", "@react-three/fiber"]
```

#### `dooi.install`
Install files from staging directory to destination project.

**Input Schema:**
```json
{
  "stageDir": "string",
  "destRoot": "string",
  "pathMap": "Record<string, string>?",
  "include": ["string"]?,
  "exclude": ["string"]?,
  "mode": "skip" | "overwrite" | "rename"?,
  "dryRun": "boolean?"
}
```

**Output Schema:**
```json
{
  "installed": ["string"]?,
  "skipped": ["string"]?,
  "overwritten": ["string"]?,
  "renamed": ["string"]?,
  "count": "number"?
}
```

**Example:**
```javascript
const result = await dooi.install({
  stageDir: "/tmp/stage-123",
  destRoot: "/path/to/project",
  pathMap: {
    "components/": "src/components/"
  },
  dryRun: false
});
console.log(result.installed); // ["src/components/ui/Button.tsx"]
```

#### `dooi.textEdit`
Perform text replacements across files with pattern matching.

**Input Schema:**
```json
{
  "destRoot": "string",
  "plan": {
    "include": ["string"],
    "exclude": ["string"]?,
    "replacements": [
      {
        "find": "string?",
        "findRegex": "string?",
        "replaceWith": "string"
      }
    ],
    "options": {
      "dryRun": "boolean?",
      "limitChangedFiles": "number?",
      "previewContextLines": "number?"
    }
  }
}
```

**Output Schema:**
```json
{
  "changedFiles": ["string"],
  "changes": [
    {
      "file": "string",
      "line": "number",
      "column": "number",
      "oldText": "string",
      "newText": "string"
    }
  ]?,
  "skipped": [
    {
      "file": "string",
      "reason": "string"
    }
  ]?
}
```

**Example:**
```javascript
const result = await dooi.textEdit({
  destRoot: "/path/to/project",
  plan: {
    include: ["**/*.tsx", "**/*.md"],
    replacements: [
      { find: "{{BRAND}}", replaceWith: "MyCompany" }
    ],
    options: { dryRun: false }
  }
});
console.log(result.changedFiles); // ["README.md", "src/Header.tsx"]
```

#### `dooi.installDeps`
Install package dependencies using detected package manager.

**Input Schema:**
```json
{
  "cwd": "string",
  "packages": ["string"],
  "pm": "npm" | "yarn" | "pnpm"?,
  "flags": ["string"]?
}
```

**Output Schema:**
```json
{
  "pm": "string",
  "args": ["string"],
  "stdoutTail": "string"
}
```

**Example:**
```javascript
const result = await dooi.installDeps({
  cwd: "/path/to/project",
  packages: ["react", "react-dom"],
  pm: "npm"
});
console.log(result.pm); // "npm"
console.log(result.stdoutTail); // "added 2 packages..."
```

### Workflow Tools

#### `dooi.workflow.applyComponent`
Complete workflow for applying a component to a project.

**Input Schema:**
```json
{
  "id": "string",
  "destRoot": "string",
  "brand": "string?",
  "pathStrategy": "next-app" | "vite-react"?,
  "pathMap": "Record<string, string>?",
  "editPlan": "object?",
  "autoDeps": "boolean?"
}
```

**Output Schema:**
```json
{
  "installed": {
    "files": ["string"],
    "map": "Record<string, string>?"
  },
  "edits": {
    "changedFiles": ["string"]
  },
  "deps": {
    "installed": ["string"]
  }
}
```

**Example:**
```javascript
const result = await dooi.workflow.applyComponent({
  id: "ui/fluid-blob",
  destRoot: "/path/to/project",
  brand: "MyCompany",
  pathStrategy: "next-app",
  autoDeps: true
});
console.log(result.installed.files); // ["src/components/ui/fluid-blob.tsx"]
console.log(result.deps.installed); // ["three", "@react-three/fiber"]
```

#### `dooi.workflow.applyTemplate`
Complete workflow for applying a template to create a new project.

**Input Schema:** Same as `applyComponent`

**Output Schema:** Same as `applyComponent`

**Example:**
```javascript
const result = await dooi.workflow.applyTemplate({
  id: "landing-morphic",
  destRoot: "/path/to/new-project",
  brand: "MyCompany",
  pathStrategy: "next-app",
  autoDeps: true
});
```

### Utility Tools

#### `dooi.resolve.uses`
Resolve component dependencies from staging directory.

#### `dooi.fetchBatch`
Batch fetch multiple components/templates.

## Resources

The server provides dynamic resource discovery for all available dooi-ui components and templates.

### Resource URI Format
```
dooi://{type}/{id}
```

Examples:
- `dooi://component/ui/fluid-blob`
- `dooi://template/landing-morphic`

### Resource Content
Resources return JSON content with complete metadata:

```json
{
  "id": "ui/fluid-blob",
  "title": "Fluid Blob Component",
  "description": "Animated fluid blob component",
  "dependencies": ["three", "@react-three/fiber"],
  "peerDependencies": ["react", "react-dom"],
  "files": ["components/ui/fluid-blob.tsx", "package.json"],
  "codeBlock": "const FluidBlob = () => { ... }"
}
```

## Prompts

### `select-component`
Guide users to select appropriate components based on their needs.

**Arguments:**
- `useCase` (required): The use case or purpose for the component
- `framework` (optional): Target framework (react, next, vue, etc.)
- `style` (optional): Preferred style (minimal, modern, animated, etc.)

**Example:**
```javascript
const prompt = await dooi.getPrompt("select-component", {
  useCase: "hero section for landing page",
  framework: "next",
  style: "modern"
});
```

### `select-template`
Guide users to select appropriate templates for their project.

**Arguments:**
- `projectType` (required): Type of project (landing, dashboard, blog, etc.)
- `framework` (optional): Target framework (next, vite, nuxt, etc.)
- `features` (optional): Required features (auth, payments, cms, etc.)

### `apply-component`
Guide users through applying a component to their project.

**Arguments:**
- `componentId` (required): The ID of the component to apply
- `projectPath` (required): Path to the target project
- `brandName` (optional): Brand name for customization

### `apply-template`
Guide users through applying a template to create a new project.

**Arguments:**
- `templateId` (required): The ID of the template to apply
- `projectPath` (required): Path where to create the new project
- `projectName` (optional): Name of the new project

## Error Handling

The server uses structured error handling with specific error codes and actionable guidance.

### Error Codes

- `E_CLI_NOT_FOUND`: Dooi-ui CLI not found
- `E_LIST_UNAVAILABLE`: Failed to list available items
- `E_FETCH_FAILED`: Failed to fetch component/template
- `E_STAGE_MISSING`: Staging directory is missing
- `E_NO_MATCHES`: No files found matching patterns
- `E_DEST_NOT_WRITABLE`: Destination directory not writable
- `E_PATH_TRAVERSAL`: Dangerous path traversal detected
- `E_INVALID_REPLACEMENT`: Invalid text replacement pattern
- `E_INVALID_REGEX`: Invalid regular expression
- `E_PARSE_FAILED`: Failed to parse file content
- `E_TOO_MANY_CHANGES`: Too many changes requested
- `E_PM_NOT_FOUND`: Package manager not found
- `E_PM_EXIT`: Package manager execution failed
- `E_INSTALL_FAILED`: Package installation failed
- `E_INVALID_INPUT`: Invalid input parameters
- `E_OPERATION_TIMEOUT`: Operation timed out
- `E_PERMISSION_DENIED`: Permission denied
- `E_INTERNAL_ERROR`: Internal server error

### Error Response Format

```json
{
  "error": true,
  "code": "E_INVALID_INPUT",
  "message": "Invalid input parameters",
  "details": {
    "field": "value"
  },
  "actionable": "Please provide valid parameters"
}
```

## Examples

### Complete Component Application Workflow

```javascript
// 1. List available components
const components = await dooi.list({});

// 2. Get guidance for component selection
const guidance = await dooi.getPrompt("select-component", {
  useCase: "animated hero section",
  framework: "next",
  style: "modern"
});

// 3. Apply the selected component
const result = await dooi.workflow.applyComponent({
  id: "ui/fluid-blob",
  destRoot: "/path/to/project",
  brand: "MyCompany",
  pathStrategy: "next-app",
  autoDeps: true
});

console.log(`Installed ${result.installed.files.length} files`);
console.log(`Installed ${result.deps.installed.length} dependencies`);
```

### Custom Text Editing

```javascript
const result = await dooi.textEdit({
  destRoot: "/path/to/project",
  plan: {
    include: ["**/*.tsx", "**/*.md"],
    exclude: ["node_modules/**", "dist/**"],
    replacements: [
      { find: "{{BRAND}}", replaceWith: "MyCompany" },
      { find: "{{YEAR}}", replaceWith: "2025" },
      { findRegex: "console\\.log\\(.*\\)", replaceWith: "// Removed console.log" }
    ],
    options: {
      dryRun: false,
      limitChangedFiles: 50
    }
  }
});
```

### Resource Discovery

```javascript
// Get all available resources
const resources = await dooi.getResources();

// Get specific resource content
const resource = await dooi.readResource("dooi://component/ui/fluid-blob");
const metadata = JSON.parse(resource.contents[0].text);
console.log(metadata.dependencies); // ["three", "@react-three/fiber"]
```

## Security Features

- **Path Traversal Protection**: Prevents access outside allowed directories
- **Glob Pattern Validation**: Validates include/exclude patterns for safety
- **Input Validation**: Comprehensive input validation using Zod schemas
- **Permission Checks**: Verifies write permissions before operations
- **Timeout Protection**: Prevents hanging operations with configurable timeouts

## Performance Considerations

- **Parallel Operations**: Batch operations run in parallel when possible
- **Efficient File Matching**: Uses optimized glob patterns for file discovery
- **Memory Management**: Streams large files to prevent memory issues
- **Caching**: Caches frequently accessed resources and metadata
- **Dry Run Support**: Preview operations before execution

## Integration Guidelines

### MCP Client Integration

```javascript
// Connect to the MCP server
const client = new MCPClient("dooi-mcp");

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool("dooi.list", {});

// Get resources
const resources = await client.listResources();

// Get prompts
const prompts = await client.listPrompts();
```

### Error Handling Best Practices

```javascript
try {
  const result = await dooi.workflow.applyComponent(options);
  console.log("Success:", result);
} catch (error) {
  if (error.code === "E_CLI_NOT_FOUND") {
    console.log("Please install dooi-ui: npm install -g dooi-ui");
  } else if (error.code === "E_PATH_TRAVERSAL") {
    console.log("Invalid path provided");
  } else {
    console.log("Error:", error.message);
    console.log("Actionable:", error.actionable);
  }
}
```

## Version Information

- **Server Version**: 1.0.0
- **MCP Protocol**: Latest
- **Node.js**: >=18.0.0
- **TypeScript**: ^5.0.0

For more information, see the [GitHub repository](https://github.com/your-org/dooi-mcp).
