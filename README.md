# Dooi MCP Server

An MCP (Model Context Protocol) server that enables coding agents to safely consume dooi templates/components and adapt them to target projects without structural changes.

## Features

- **Safe Template/Component Fetching**: Download dooi templates and components into staging directories
- **Text-Only Editing**: Perform safe text replacements that preserve code structure
- **Dependency Management**: Automatically install required npm packages
- **Path Mapping**: Flexible file placement with customizable path strategies
- **Dry-Run Support**: Preview changes before applying them
- **Agent-First Design**: JSON APIs optimized for coding agent workflows

## Installation

```bash
npm install
npm run build
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Usage

The server provides the following MCP tools:

### Core Tools

- `dooi.list` - List available templates/components
- `dooi.fetch` - Fetch a template/component into staging
- `dooi.resolve.uses` - Resolve component dependencies
- `dooi.fetchBatch` - Fetch multiple items at once
- `dooi.install` - Install files from staging to project
- `dooi.textEdit` - Perform text-only replacements
- `dooi.installDeps` - Install npm packages

### Workflow Tools

- `dooi.workflow.applyComponent` - One-shot component installation
- `dooi.workflow.applyTemplate` - One-shot template installation

## Configuration

Copy `env.example` to `.env` and adjust settings:

```bash
cp env.example .env
```

Key configuration options:

- `LOG_LEVEL` - Logging verbosity (debug, info, warn, error)
- `DEFAULT_TIMEOUT_MS` - CLI operation timeout
- `DEFAULT_PACKAGE_MANAGER` - Preferred package manager
- `DEFAULT_DRY_RUN` - Enable dry-run mode by default

## Prerequisites

- Node.js ≥ 18
- `dooi-ui` package (installed via npm or available via npx)

## Architecture

The server is built with TypeScript and follows the MCP protocol:

```
src/
├── server.ts                 # Main server entry point
├── adapters/mcp/            # MCP protocol adapters
├── capabilities/            # Tools, resources, prompts
├── core/                   # Core business logic
└── edits/                  # Text editing system
```

## Safety Features

- **Path Traversal Protection**: Prevents directory traversal attacks
- **Dry-Run Defaults**: Preview changes before applying
- **Structure Preservation**: Only modifies text nodes, never code structure
- **Permission Checks**: Validates write permissions before operations
- **Error Handling**: Comprehensive error codes with actionable guidance

## Development Status

**🎉 Production Ready!** All core features have been implemented and tested:

- ✅ **Phase 1**: Project foundation and MCP server setup
- ✅ **Phase 2**: CLI integration for listing and fetching
- ✅ **Phase 3**: File installation system with path mapping
- ✅ **Phase 4**: Text editing with AST support
- ✅ **Phase 5**: Dependency management and package manager integration
- ✅ **Phase 6**: Workflow automation tools
- ✅ **Phase 7**: MCP resources and prompts system
- ✅ **Phase 8**: Comprehensive testing and documentation

## ✨ Key Features

- **🎨 Component Discovery**: Browse and fetch dooi-ui components and templates
- **🚀 Smart Installation**: Intelligent file placement with path mapping strategies
- **✏️ Text Editing**: AST-powered text replacements with pattern matching
- **📦 Dependency Management**: Automatic package installation with npm/yarn/pnpm support
- **🔄 Workflow Automation**: Complete component/template application workflows
- **🤖 AI Integration**: MCP resources and prompts for guided operations
- **🔒 Security First**: Path traversal protection and input validation
- **⚡ High Performance**: Parallel operations and efficient file handling

## 🎯 MCP Capabilities

### Tools (9 total)
- Core tools for listing, fetching, installing, and editing
- Workflow tools for complete component/template application
- Utility tools for dependency resolution and batch operations

### Resources
- Dynamic discovery of dooi-ui components and templates
- Rich metadata with dependencies and file information
- JSON content format for easy consumption

### Prompts
- Intelligent guidance for component/template selection
- Step-by-step application instructions
- Context-aware recommendations based on project requirements

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please use the GitHub issue tracker.
