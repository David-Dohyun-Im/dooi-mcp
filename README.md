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

This is a work in progress. Current implementation status:

- ✅ Project foundation and MCP server setup
- ✅ Basic tool framework and error handling
- ✅ CLI integration for listing and fetching
- 🚧 File installation system
- 🚧 Text editing with AST support
- 🚧 Dependency management
- 🚧 Workflow tools
- 🚧 MCP resources and prompts

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
