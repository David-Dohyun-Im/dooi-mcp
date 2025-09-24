# Dooi MCP Server Usage Guide

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/dooi-mcp.git
cd dooi-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Basic Usage

```bash
# List available components and templates
npx dooi-ui list

# Fetch a specific component
npx dooi-ui get ui/fluid-blob

# The MCP server provides programmatic access to these operations
```

## MCP Client Integration

### Connecting to the Server

```javascript
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';

const client = new MCPClient({
  name: "dooi-mcp",
  version: "1.0.0"
});

// Connect to the server
await client.connect();
```

### Using Tools

```javascript
// List available components
const components = await client.callTool("dooi.list", {});

// Fetch a component
const component = await client.callTool("dooi.fetch", {
  id: "ui/fluid-blob"
});

// Apply a component to your project
const result = await client.callTool("dooi.workflow.applyComponent", {
  id: "ui/fluid-blob",
  destRoot: "/path/to/your/project",
  brand: "MyCompany",
  pathStrategy: "next-app"
});
```

### Using Resources

```javascript
// List all available resources
const resources = await client.listResources();

// Read a specific resource
const resource = await client.readResource("dooi://component/ui/fluid-blob");
const metadata = JSON.parse(resource.contents[0].text);
```

### Using Prompts

```javascript
// Get component selection guidance
const guidance = await client.getPrompt("select-component", {
  useCase: "hero section",
  framework: "next",
  style: "modern"
});

// Get template selection guidance
const templateGuidance = await client.getPrompt("select-template", {
  projectType: "landing page",
  framework: "next"
});
```

## Common Workflows

### 1. Adding a Component to an Existing Project

```javascript
// Step 1: Get guidance on component selection
const selectionPrompt = await client.getPrompt("select-component", {
  useCase: "animated button",
  framework: "react",
  style: "modern"
});

// Step 2: Apply the selected component
const result = await client.callTool("dooi.workflow.applyComponent", {
  id: "ui/animated-button",
  destRoot: "/path/to/your/react/project",
  brand: "YourBrand",
  pathStrategy: "vite-react",
  autoDeps: true
});

console.log(`Installed ${result.installed.files.length} files`);
console.log(`Installed ${result.deps.installed.length} dependencies`);
```

### 2. Creating a New Project from Template

```javascript
// Step 1: Get guidance on template selection
const templatePrompt = await client.getPrompt("select-template", {
  projectType: "landing page",
  framework: "next",
  features: "modern design, responsive"
});

// Step 2: Apply the selected template
const result = await client.callTool("dooi.workflow.applyTemplate", {
  id: "landing-morphic",
  destRoot: "/path/to/new/project",
  brand: "MyCompany",
  pathStrategy: "next-app",
  autoDeps: true
});

console.log("New project created successfully!");
```

### 3. Custom Text Editing

```javascript
// Perform custom text replacements
const result = await client.callTool("dooi.textEdit", {
  destRoot: "/path/to/project",
  plan: {
    include: ["**/*.tsx", "**/*.md"],
    exclude: ["node_modules/**", "dist/**"],
    replacements: [
      { find: "{{BRAND}}", replaceWith: "MyCompany" },
      { find: "{{YEAR}}", replaceWith: "2025" },
      { 
        findRegex: "console\\.log\\(.*\\)", 
        replaceWith: "// Removed console.log" 
      }
    ],
    options: {
      dryRun: false,
      limitChangedFiles: 100
    }
  }
});

console.log(`Modified ${result.changedFiles.length} files`);
```

### 4. Batch Component Installation

```javascript
// Fetch multiple components
const components = ["ui/button", "ui/card", "ui/input"];
const results = [];

for (const componentId of components) {
  const result = await client.callTool("dooi.workflow.applyComponent", {
    id: componentId,
    destRoot: "/path/to/project",
    brand: "MyCompany",
    pathStrategy: "next-app",
    autoDeps: true
  });
  results.push(result);
}

console.log(`Installed ${results.length} components`);
```

## Path Mapping Strategies

### Next.js App Router

```javascript
const pathMap = {
  "components/": "src/components/",
  "ui/": "src/components/ui/",
  "lib/": "src/lib/",
  "hooks/": "src/hooks/",
  "utils/": "src/utils/",
  "types/": "src/types/",
  "public/": "public/",
  "assets/": "public/assets/"
};
```

### Vite React

```javascript
const pathMap = {
  "components/": "src/components/",
  "ui/": "src/components/ui/",
  "lib/": "src/lib/",
  "hooks/": "src/hooks/",
  "utils/": "src/utils/",
  "types/": "src/types/",
  "public/": "public/",
  "assets/": "src/assets/"
};
```

### Custom Mapping

```javascript
const customPathMap = {
  "components/ui/": "src/ui/",
  "components/forms/": "src/forms/",
  "lib/utils/": "src/utils/",
  "styles/": "src/styles/"
};
```

## Error Handling

### Common Error Scenarios

```javascript
try {
  const result = await client.callTool("dooi.fetch", {
    id: "nonexistent-component"
  });
} catch (error) {
  switch (error.code) {
    case "E_CLI_NOT_FOUND":
      console.log("Please install dooi-ui: npm install -g dooi-ui");
      break;
    case "E_FETCH_FAILED":
      console.log("Component not found or network error");
      break;
    case "E_PATH_TRAVERSAL":
      console.log("Invalid path provided");
      break;
    default:
      console.log("Error:", error.message);
      console.log("Actionable:", error.actionable);
  }
}
```

### Graceful Degradation

```javascript
// Try to apply component, fallback to manual installation
async function applyComponentSafely(componentId, destRoot, brand) {
  try {
    return await client.callTool("dooi.workflow.applyComponent", {
      id: componentId,
      destRoot,
      brand,
      autoDeps: true
    });
  } catch (error) {
    console.warn("Workflow failed, trying manual steps:", error.message);
    
    // Fallback to manual steps
    const fetchResult = await client.callTool("dooi.fetch", { id: componentId });
    const installResult = await client.callTool("dooi.install", {
      stageDir: fetchResult.stageDir,
      destRoot,
      dryRun: false
    });
    
    return {
      installed: { files: installResult.installed || [] },
      edits: { changedFiles: [] },
      deps: { installed: [] }
    };
  }
}
```

## Advanced Usage

### Custom Edit Plans

```javascript
const customEditPlan = {
  include: ["**/*.tsx", "**/*.ts", "**/*.md"],
  exclude: ["node_modules/**", "dist/**", "*.test.*"],
  replacements: [
    { find: "{{BRAND}}", replaceWith: "MyCompany" },
    { find: "{{VERSION}}", replaceWith: "1.0.0" },
    { 
      findRegex: "import.*from ['\"]react['\"]", 
      replaceWith: "import React from 'react'" 
    }
  ],
  options: {
    dryRun: false,
    limitChangedFiles: 50,
    previewContextLines: 3
  }
};

const result = await client.callTool("dooi.textEdit", {
  destRoot: "/path/to/project",
  plan: customEditPlan
});
```

### Package Manager Integration

```javascript
// Install dependencies with custom package manager
const depsResult = await client.callTool("dooi.installDeps", {
  cwd: "/path/to/project",
  packages: ["react", "react-dom", "typescript"],
  pm: "pnpm",
  flags: ["--save-dev"]
});

console.log(`Used ${depsResult.pm} to install packages`);
console.log(`Command: ${depsResult.pm} ${depsResult.args.join(' ')}`);
```

### Resource Discovery and Filtering

```javascript
// Get all available resources
const resources = await client.listResources();

// Filter components by type
const components = resources.resources.filter(r => 
  r.uri.includes('/component/')
);

// Filter by specific criteria
const uiComponents = components.filter(r => 
  r.uri.includes('/ui/')
);

console.log(`Found ${uiComponents.length} UI components`);
```

## Best Practices

### 1. Always Use Dry Run First

```javascript
// Preview changes before applying
const preview = await client.callTool("dooi.install", {
  stageDir: fetchResult.stageDir,
  destRoot: "/path/to/project",
  dryRun: true
});

console.log("Files that would be installed:", preview.actions);
console.log("Total files:", preview.count);

// Apply if preview looks good
if (preview.count > 0) {
  const result = await client.callTool("dooi.install", {
    stageDir: fetchResult.stageDir,
    destRoot: "/path/to/project",
    dryRun: false
  });
}
```

### 2. Handle Dependencies Properly

```javascript
// Check for peer dependencies
const component = await client.callTool("dooi.fetch", { id: "ui/component" });

if (component.meta.peerDependencies?.length > 0) {
  console.log("Peer dependencies required:", component.meta.peerDependencies);
  
  // Install peer dependencies first
  await client.callTool("dooi.installDeps", {
    cwd: "/path/to/project",
    packages: component.meta.peerDependencies
  });
}
```

### 3. Use Appropriate Path Strategies

```javascript
// Detect project type and use appropriate strategy
function detectProjectType(projectPath) {
  if (fs.existsSync(path.join(projectPath, 'next.config.js'))) {
    return 'next-app';
  } else if (fs.existsSync(path.join(projectPath, 'vite.config.js'))) {
    return 'vite-react';
  }
  return 'next-app'; // default
}

const pathStrategy = detectProjectType("/path/to/project");

const result = await client.callTool("dooi.workflow.applyComponent", {
  id: "ui/component",
  destRoot: "/path/to/project",
  pathStrategy,
  autoDeps: true
});
```

### 4. Implement Proper Error Recovery

```javascript
async function robustComponentInstallation(componentId, destRoot, brand) {
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await client.callTool("dooi.workflow.applyComponent", {
        id: componentId,
        destRoot,
        brand,
        autoDeps: true
      });
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Troubleshooting

### Common Issues

1. **CLI Not Found**
   ```bash
   # Install dooi-ui globally
   npm install -g dooi-ui
   
   # Or use npx
   npx dooi-ui list
   ```

2. **Permission Denied**
   ```bash
   # Check directory permissions
   ls -la /path/to/project
   
   # Fix permissions if needed
   chmod 755 /path/to/project
   ```

3. **Package Manager Not Found**
   ```bash
   # Ensure package manager is installed
   npm --version
   # or
   yarn --version
   # or
   pnpm --version
   ```

4. **Path Traversal Errors**
   - Ensure all paths are within the allowed directory
   - Use relative paths when possible
   - Check path mapping configuration

### Debug Mode

```javascript
// Enable debug logging
process.env.DEBUG = 'dooi-mcp:*';

// Or set log level
process.env.LOG_LEVEL = 'DEBUG';
```

### Performance Optimization

```javascript
// Use batch operations when possible
const components = ["ui/button", "ui/card", "ui/input"];

// Fetch all components in parallel
const fetchPromises = components.map(id => 
  client.callTool("dooi.fetch", { id })
);

const fetchResults = await Promise.all(fetchPromises);

// Install all components in parallel
const installPromises = fetchResults.map((result, index) =>
  client.callTool("dooi.install", {
    stageDir: result.stageDir,
    destRoot: "/path/to/project",
    dryRun: false
  })
);

const installResults = await Promise.all(installPromises);
```

## Examples Repository

Check out the [examples directory](./examples/) for complete working examples:

- [Basic Component Installation](./examples/basic-component.js)
- [Template Application](./examples/template-application.js)
- [Custom Text Editing](./examples/custom-editing.js)
- [Batch Operations](./examples/batch-operations.js)
- [Error Handling](./examples/error-handling.js)

## Support

- **Documentation**: [API Reference](./API.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/dooi-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/dooi-mcp/discussions)
