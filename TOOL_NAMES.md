# Dooi MCP Server - Tool Names

## Fixed Tool Names (MCP Compatible)

The tool names have been updated to comply with MCP naming requirements (pattern: `^[a-zA-Z0-9_-]{1,64}$`).

### Core Tools
- `dooi_list` - Enumerate available templates/components from dooi-ui
- `dooi_fetch` - Fetch a template/component into a staging directory  
- `dooi_resolve_uses` - Derive additional required component IDs from staging directory
- `dooi_fetchBatch` - Fetch multiple components/templates at once
- `dooi_install` - Copy files from staging directory to project with preview
- `dooi_textEdit` - Perform text-only replacements preserving code structure
- `dooi_installDeps` - Install npm packages using specified package manager

### Workflow Tools
- `dooi_workflow_applyComponent` - One-shot component installation workflow
- `dooi_workflow_applyTemplate` - One-shot template installation workflow

## Usage Examples

### Basic Discovery
```
"List available dooi components" → uses dooi_list
"Show me the dooi catalog" → uses dooi_list
```

### Component Operations  
```
"Fetch a hero component" → uses dooi_fetch
"Install a card component" → uses dooi_install
"Show me component dependencies" → uses dooi_resolve_uses
```

### Workflow Operations
```
"Apply a landing page template" → uses dooi_workflow_applyTemplate
"Install a hero component with custom branding" → uses dooi_workflow_applyComponent
```

## Migration Notes

- **Old names** (with dots): `dooi.list`, `dooi.fetch`, `dooi.resolve.uses`, etc.
- **New names** (with underscores): `dooi_list`, `dooi_fetch`, `dooi_resolve_uses`, etc.
- All functionality remains the same
- Tool descriptions and parameters unchanged
- MCP protocol compliance achieved
