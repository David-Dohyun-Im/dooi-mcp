# Implementation Plan: Dooi MCP Server

**Project:** dooi-mcp  
**Status:** Implementation Plan v1.0  
**Created:** 2025-01-27  
**Based on:** PRD v0.2, Architecture v1.0, MCP Tools Specification v1.0

---

## Executive Summary

This implementation plan outlines the development of `dooi-mcp`, an MCP (Model Context Protocol) server that enables coding agents to safely consume dooi templates/components and adapt them to target projects without structural changes. The server provides a focused set of tools for fetching, installing, and performing text-only edits on dooi assets.

## Project Overview

### Core Purpose
- Enable coding agents to discover and fetch dooi templates/components
- Install assets into target projects using path mapping
- Perform safe, text-only edits (JSX text nodes, string literals, plain text)
- Install required dependencies automatically

### Key Design Principles
- **Agent-first**: Deterministic APIs, JSON outputs for reliable chaining
- **Safety-first**: Default dry-run mode, no structural code changes
- **Minimal surface**: Focused toolset without opinionated project scaffolding

---

## Technical Architecture

### Technology Stack
- **Runtime**: Node.js ≥ 18
- **Language**: TypeScript
- **MCP Framework**: `@modelcontextprotocol/sdk`
- **CLI Integration**: `npx dooi-ui` commands
- **AST Parsing**: Babel (for JSX/TypeScript text node editing)
- **Package Managers**: npm/yarn/pnpm support
- **File Operations**: Node.js fs, glob patterns

### Core Components
1. **Transport Layer**: MCP stdio communication
2. **Capabilities**: Tools, Resources, Prompts (MCP 3-pillar)
3. **Core Modules**: Stage management, file operations, text editing, dependency installation
4. **Safety Guards**: Path traversal prevention, permission checks

---

## Implementation Phases

## Phase 1: Project Foundation (Day 1)

### 1.1 Project Setup
- [ ] Initialize TypeScript project with proper configuration
- [ ] Set up package.json with dependencies
- [ ] Create mcp-manifest.json for MCP server registration
- [ ] Configure .gitignore and .env.example
- [ ] Set up basic project structure

### 1.2 Core Infrastructure
- [ ] **`src/server.ts`**: Main MCP server entry point
- [ ] **`src/adapters/mcp/transport.ts`**: Stdio transport wrapper
- [ ] **`src/adapters/mcp/schema.ts`**: Zod schemas for input/output validation
- [ ] **`src/adapters/mcp/responders.ts`**: Tool/resource/prompt registration
- [ ] **`src/core/errors.ts`**: Error codes and helpers
- [ ] **`src/core/logger.ts`**: stderr-only logging system
- [ ] **`src/core/types.ts`**: Core type definitions

### 1.3 Basic Tool Framework
- [ ] **`src/capabilities/tools/index.ts`**: Tool name→handler mapping
- [ ] Implement basic tool registration and routing
- [ ] Set up error handling and response formatting

**Deliverable**: Working MCP server skeleton with basic tool registration

---

## Phase 2: Stage Management & CLI Integration (Day 2)

### 2.1 Stage Management
- [ ] **`src/core/stage.ts`**: Temporary directory and token management
- [ ] **`src/core/exec.ts`**: execa wrapper with timeout and logging
- [ ] **`src/core/guards.ts`**: Path traversal prevention and permission checks

### 2.2 CLI Integration
- [ ] **`src/core/parse/cliOutput.ts`**: Parse `npx dooi-ui get` stdout
- [ ] **`src/capabilities/tools/list.ts`**: `dooi.list` implementation
- [ ] **`src/capabilities/tools/fetch.ts`**: `dooi.fetch` implementation

### 2.3 Dependency Resolution
- [ ] **`src/core/parse/uses.ts`**: Infer component dependencies from imports
- [ ] **`src/capabilities/tools/resolveUses.ts`**: `dooi.resolve.uses` implementation
- [ ] **`src/capabilities/tools/fetchBatch.ts`**: `dooi.fetchBatch` implementation

**Deliverable**: Working CLI integration with stage management and dependency resolution

---

## Phase 3: File Installation System (Day 3)

### 3.1 Copy Operations
- [ ] **`src/core/copy.ts`**: Glob planning, path mapping, and copy operations
- [ ] **`src/core/config/defaults.ts`**: Default file extensions and options
- [ ] **`src/core/config/pathStrategies/next-app.ts`**: Next.js app directory strategy
- [ ] **`src/core/config/pathStrategies/vite-react.ts`**: Vite React strategy (optional)

### 3.2 Installation Tool
- [ ] **`src/capabilities/tools/install.ts`**: `dooi.install` with dry-run support
- [ ] Implement conflict resolution modes (skip/overwrite/rename)
- [ ] Add path traversal protection
- [ ] Implement dry-run preview functionality

**Deliverable**: Complete file installation system with safety guards

---

## Phase 4: Text Editing System (Day 4)

### 4.1 AST-Based Text Editing
- [ ] **`src/edits/astText.ts`**: JSXText/StringLiteral/TemplateElement modifications
- [ ] **`src/edits/plainText.ts`**: Plain text file replacements
- [ ] **`src/edits/apply.ts`**: EditPlan execution with routing and reporting

### 4.2 Text Edit Tool
- [ ] **`src/capabilities/tools/textEdit.ts`**: `dooi.textEdit` implementation
- [ ] Support for regex and exact string replacements
- [ ] File type detection and appropriate editing strategy
- [ ] Change limiting and preview functionality

**Deliverable**: Safe text-only editing system preserving code structure

---

## Phase 5: Dependency Management (Day 5)

### 5.1 Package Manager Integration
- [ ] **`src/core/deps.ts`**: npm/yarn/pnpm runner
- [ ] **`src/capabilities/tools/installDeps.ts`**: `dooi.installDeps` implementation
- [ ] Package manager detection and command mapping
- [ ] Log streaming and error handling

**Deliverable**: Automated dependency installation system

---

## Phase 6: Workflow Tools (Day 6)

### 6.1 Workflow Convenience Tools
- [ ] **`src/capabilities/tools/workflow/common.ts`**: Shared workflow steps and rollback hooks
- [ ] **`src/capabilities/tools/workflow/applyComponent.ts`**: `dooi.workflow.applyComponent`
- [ ] **`src/capabilities/tools/workflow/applyTemplate.ts`**: `dooi.workflow.applyTemplate`
- [ ] Implement one-shot workflows with proper error handling and rollback

**Deliverable**: High-level workflow tools for common use cases

---

## Phase 7: MCP Resources & Prompts (Day 7)

### 7.1 Resource System
- [ ] **`src/capabilities/resources/index.ts`**: Resource routing
- [ ] **`src/capabilities/resources/catalog.ts`**: `mcp://dooi/catalog`
- [ ] **`src/capabilities/resources/stageTree.ts`**: `mcp://dooi/stage/{token}/tree`
- [ ] **`src/capabilities/resources/stageMeta.ts`**: `mcp://dooi/stage/{token}/meta`

### 7.2 Prompt System
- [ ] **`src/capabilities/prompts/index.ts`**: Prompt routing
- [ ] **`src/capabilities/prompts/quick_start.prompt.md`**: Quick start guidance
- [ ] **`src/capabilities/prompts/plan_install.prompt.md`**: Installation planning
- [ ] **`src/capabilities/prompts/generate_text_edits.prompt.md`**: Text edit generation

**Deliverable**: Complete MCP resources and prompts system

---

## Phase 8: Testing & Documentation (Day 8)

### 8.1 Testing
- [ ] Unit tests for core modules
- [ ] Integration tests for tool workflows
- [ ] Error handling and edge case testing
- [ ] Cross-platform compatibility testing (macOS/Linux)

### 8.2 Documentation
- [ ] **README.md**: Setup and usage instructions
- [ ] Tool documentation with examples
- [ ] Error code reference
- [ ] Best practices guide

### 8.3 Examples
- [ ] Example agent workflows
- [ ] Sample path mappings
- [ ] Common text edit patterns

**Deliverable**: Production-ready system with comprehensive documentation

---

## Tool Specifications Summary

### Core Tools
1. **`dooi.list`**: Enumerate available templates/components
2. **`dooi.fetch`**: Fetch item into staging directory
3. **`dooi.resolve.uses`**: Derive additional required component IDs
4. **`dooi.fetchBatch`**: Fetch multiple IDs with deduplication
5. **`dooi.install`**: Copy from stage to project with preview
6. **`dooi.textEdit`**: Text-only replacements preserving structure
7. **`dooi.installDeps`**: Install npm packages

### Workflow Tools
8. **`dooi.workflow.applyComponent`**: One-shot component installation
9. **`dooi.workflow.applyTemplate`**: One-shot template installation

### MCP Resources
- `mcp://dooi/catalog`: Available items catalog
- `mcp://dooi/stage/{token}/tree`: Staging directory file tree
- `mcp://dooi/stage/{token}/meta`: Staging directory metadata

### MCP Prompts
- `dooi/quick_start`: Quick start workflow guidance
- `dooi/plan_install`: Installation planning assistance
- `dooi/generate_text_edits`: Text edit generation guidance

---

## Error Handling Strategy

### Error Categories
- **E_CLI_NOT_FOUND**: dooi-ui CLI not available
- **E_FETCH_FAILED**: Failed to fetch component/template
- **E_PARSE_META**: Failed to parse CLI output metadata
- **E_STAGE_MISSING**: Staging directory not found
- **E_NO_MATCHES**: No files match installation criteria
- **E_DEST_NOT_WRITABLE**: Destination not writable
- **E_PATH_TRAVERSAL**: Path traversal attempt detected
- **E_INVALID_REPLACEMENT**: Invalid text replacement pattern
- **E_INVALID_REGEX**: Invalid regex pattern
- **E_PARSE_FAILED**: File parsing failed
- **E_TOO_MANY_CHANGES**: Too many files would be changed
- **E_PM_NOT_FOUND**: Package manager not found
- **E_PM_EXIT**: Package manager execution failed

### Error Response Format
All errors return structured JSON with:
- Error code
- Human-readable message
- Actionable guidance
- Raw output (when applicable)

---

## Security Considerations

### Path Security
- Prevent directory traversal attacks
- Validate all file paths against allowed patterns
- Check write permissions before operations

### Execution Security
- Only execute known CLI commands (`npx dooi-ui`)
- Limit package manager operations to install/add commands
- No arbitrary code execution

### Data Security
- No external network access beyond dooi-ui
- Staging directories cleaned up automatically
- No sensitive data logging

---

## Performance Targets

### Response Times
- Fetch operations: Bounded by network (dooi-ui CLI)
- Install planning: <1 second for 1k files
- Text editing: <20 seconds for ~1k files on dev laptop
- Dependency installation: Bounded by package manager

### Resource Usage
- Staging directories: Cleaned up after operations
- Memory usage: Efficient streaming for large files
- CPU usage: Minimal for text operations

---

## Quality Assurance

### Critical Test Scenarios
1. **Template Happy Path**: Complete template installation workflow
2. **Component Installation**: Single component with dependency resolution
3. **Conflict Handling**: Existing file conflicts with skip mode
4. **Parser Fallback**: Unusual syntax handling
5. **Error Recovery**: Graceful failure handling

### Acceptance Criteria
- Works on macOS (Apple Silicon) and Linux with Node ≥ 18
- Only text nodes/literals modified, structure preserved
- Dry-run functionality documented and demonstrated
- All tools return valid JSON responses
- Error handling provides actionable guidance

---

## Risk Mitigation

### Technical Risks
- **CLI Output Variance**: Implement resilient parsing with fallbacks
- **Large Repository I/O**: Use include/exclude defaults, consider streaming
- **Regex Over-matching**: Prefer exact matches, document safe patterns

### Mitigation Strategies
- Treat metadata parsing as optional enhancement
- Implement file count limits and progress reporting
- Provide safe default patterns and validation

---

## Future Enhancements (vNext)

### Planned Features
- `preview.diff`: Show line-by-line diffs using git diff
- `revert`: Restore from staging for last install
- Placeholder-only mode with schema validation
- Advanced conflict resolution strategies
- Streaming copy operations for large files

### Extension Points
- Additional path strategies (Vue, Svelte, etc.)
- Custom text edit patterns
- Integration with other MCP servers
- Advanced dependency resolution

---

## Success Metrics

### Functional Metrics
- All 9 core tools implemented and tested
- 3 MCP resources working correctly
- 3 MCP prompts providing helpful guidance
- Error handling covers all edge cases

### Quality Metrics
- 100% test coverage for core modules
- Zero path traversal vulnerabilities
- All operations support dry-run mode
- Documentation covers all use cases

### Performance Metrics
- Install planning under 1s for 1k files
- Text editing under 20s for 1k files
- Memory usage remains stable during operations
- Cleanup operations complete successfully

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building the dooi-mcp server. The phased approach ensures steady progress while maintaining quality and security standards. Each phase builds upon the previous one, creating a solid foundation for a production-ready MCP server that enables safe and efficient integration of dooi templates and components into coding agent workflows.

The focus on safety, determinism, and agent-first design ensures that the server will be reliable and useful for automated coding workflows while maintaining the flexibility needed for various project structures and use cases.
