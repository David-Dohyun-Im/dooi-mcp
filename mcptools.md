# PRD: Dooi MCP Server (for `dooi`)

**Owner:** Sungho Park (행님)
**Editor/Implementer:** GPT-5 Thinking
**Doc Status:** Draft v0.2
**Last Updated:** 2025-09-23 (Asia/Seoul)

---

## 1) Overview

`dooi-mcp` is an MCP server that enables coding agents to safely consume **dooi** templates/components and adapt them to a target project **without structural changes**. The server exposes a focused set of tools that:

1. Discover and fetch a dooi template/component into a **staging directory**.
2. **Preview & install** chosen files into the user project using **path mapping**.
3. Perform **text‑only edits** (JSX text nodes, string/template literals, and plain text) with glob scoping.
4. Install any required **dependencies** declared by the asset.

Design is agent‑first: deterministic APIs, idempotent where possible, JSON outputs for reliable chaining.

---

## 2) Goals & Non‑Goals

### Goals

* Minimal, reliable MCP surface for fetching, installing, **text‑only** editing.
* **Dry‑run previews** required before file writes.
* Precise placement via `pathMap` & pluggable `pathStrategy`.
* Never modify code structure (AST touches only text nodes/literals).
* JSON contracts suitable for agent orchestration.

### Non‑Goals

* No opinionated project scaffolding beyond copy/edit.
* No GUI; stdio MCP only.
* No generative templating beyond text replacement.
* No code format/lint enforcement.

---

## 3) Users & Key Use Cases

### Users

* **Coding Agents**: automate landing setup, component import, branding copy changes.
* **Developers**: manual runs from an MCP‑aware client for reproducible installs.

### Key Use Cases

1. **Landing template** (e.g., `landing-morphic`) → place under `app/` & `src/components/`, update brand strings, install `three` + `@react-three/fiber`.
2. **Single component** (e.g., `ui/fluid-blob`) → install to `src/components/ui/`, update demo copy only.
3. **Batch copy editing** across installed files using regex, preserving structure.

---

## 4) Scope

### In Scope (v1)

* Tools: `dooi.list`, `dooi.fetch`, `dooi.install` (with dry‑run), `dooi.textEdit`, `dooi.installDeps`, `dooi.resolve.uses`, `dooi.fetchBatch`.
* Workflow convenience tools: `dooi.workflow.applyComponent`, `dooi.workflow.applyTemplate`.
* Glob‑based include/exclude; default safe policies.
* Stdout parsing (best effort) to surface dependencies and used components from `npx dooi-ui get`.

### Future (vNext)

* `preview.diff` (show line diffs via `git diff --no-index`).
* `revert` (restore from stage for last install).
* Placeholder‑only mode (`{{BRAND}}`) with schema.
* Overwrite/merge strategies and conflict prompts.

---

## 5) Architecture

* **Transport:** MCP stdio via `@modelcontextprotocol/sdk`.
* **Capabilities (MCP 3‑pillar):** Tools, Resources, Prompts (see §§ 9–11).
* **Core Modules:** fetch (stage mgmt + CLI exec + parse), install (glob→copy + pathMap), textEdits (AST‑guarded text only), deps (package manager runner), guards (path traversal/permissions), logger (stderr only).
* **Data Objects:** `stageDir` (temp), `destRoot` (project), `pathMap` (rel→rel), `EditPlan` (include/exclude/replacements).

---

## 6) Project Structure

**Top‑level:** *Option A (lightweight)*
**`src/` layout:** *Option B (pro, expanded)*

```
dooi-mcp/
├─ package.json
├─ tsconfig.json
├─ mcp-manifest.json
├─ .gitignore
├─ .env.example
├─ README.md
└─ src/
   ├─ server.ts
   ├─ adapters/
   │  └─ mcp/
   │     ├─ transport.ts          # Stdio transport wrapper
   │     ├─ schema.ts             # Zod schemas (shared I/O)
   │     └─ responders.ts         # register tools/resources/prompts
   ├─ capabilities/
   │  ├─ tools/
   │  │  ├─ index.ts              # name→handler map & export
   │  │  ├─ list.ts               # dooi.list
   │  │  ├─ fetch.ts              # dooi.fetch
   │  │  ├─ resolveUses.ts        # dooi.resolve.uses
   │  │  ├─ fetchBatch.ts         # dooi.fetchBatch
   │  │  ├─ install.ts            # dooi.install
   │  │  ├─ textEdit.ts           # dooi.textEdit
   │  │  ├─ installDeps.ts        # dooi.installDeps
   │  │  └─ workflow/
   │  │     ├─ applyComponent.ts  # dooi.workflow.applyComponent
   │  │     ├─ applyTemplate.ts   # dooi.workflow.applyTemplate
   │  │     └─ common.ts          # shared steps/rollback hooks
   │  ├─ resources/
   │  │  ├─ index.ts              # router
   │  │  ├─ catalog.ts            # mcp://dooi/catalog
   │  │  ├─ stageTree.ts          # mcp://dooi/stage/{t}/tree
   │  │  └─ stageMeta.ts          # mcp://dooi/stage/{t}/meta
   │  └─ prompts/
   │     ├─ index.ts
   │     ├─ quick_start.prompt.md       # dooi/quick_start
   │     ├─ plan_install.prompt.md      # dooi/plan_install
   │     └─ generate_text_edits.prompt.md # dooi/generate_text_edits
   ├─ core/
   │  ├─ stage.ts                # temp dir/token mgmt
   │  ├─ copy.ts                 # glob plan + pathMap + copy
   │  ├─ deps.ts                 # npm|yarn|pnpm runner
   │  ├─ exec.ts                 # execa wrapper (timeout/log)
   │  ├─ guards.ts               # path traversal/permissions
   │  ├─ errors.ts               # error codes/helpers
   │  ├─ logger.ts               # stderr-only logger
   │  ├─ types.ts                # EditPlan/CopyAction/etc
   │  ├─ config/
   │  │  ├─ defaults.ts          # default extensions/options
   │  │  └─ pathStrategies/
   │  │     ├─ next-app.ts       # app/, src/components/* rules
   │  │     └─ vite-react.ts     # optional alt strategy
   │  └─ parse/
   │     ├─ cliOutput.ts         # parse `npx dooi-ui get` stdout
   │     └─ uses.ts              # infer `uses` from imports
   └─ edits/
      ├─ astText.ts              # JSXText/StringLiteral/TemplateElement
      ├─ plainText.ts            # plain-text replace
      └─ apply.ts                # run EditPlan (routing/dry-run/report)
```

---

## 7) Tool Specifications (dooi.\*)

> All tools return a **single JSON object** in the MCP `content` payload.

### 7.1 `dooi.list`

* **Purpose:** Enumerate available templates/components.
* **Input:** `{}`
* **Behavior:** Try `npx dooi-ui list`; on unsupported, return guidance with raw output.
* **Output:** `{ items: [{ id, type, title, description }], raw: { stdout, stderr } }`
* **Errors:** `E_CLI_NOT_FOUND`, `E_LIST_UNAVAILABLE`

### 7.2 `dooi.fetch`

* **Purpose:** Fetch an item into an ephemeral **stageDir**.
* **Input:** `{ id: string, ref?: string, options?: { timeoutMs?: number, env?: object } }`
* **Behavior:** create temp, run `npx dooi-ui get <id>`, glob files, parse stdout for `title/description/dependencies/peerDependencies/uses/files`.
* **Output:** `{ stageDir, files: string[], meta: { id, title?, description?, dependencies?, peerDependencies?, uses?, codeBlock? }, raw: { stdout, stderr, exitCode } }`
* **Errors:** `E_CLI_NOT_FOUND`, `E_FETCH_FAILED`, `E_PARSE_META`

### 7.3 `dooi.resolve.uses`

* **Purpose:** Derive additional required component IDs.
* **Input:** `{ stageDir: string }`
* **Behavior:** Prefer `meta.uses`; otherwise scan imports and infer (`ui/*`, `Hero/*`, etc.).
* **Output:** `{ requiredIds: string[] }`

### 7.4 `dooi.fetchBatch`

* **Purpose:** Fetch multiple IDs at once; skip duplicates.
* **Input:** `{ ids: string[] }`
* **Output:** `{ stages: [{ id, stageDir, files: string[] }] }`

### 7.5 `dooi.install`

* **Purpose:** Copy from stage to project with preview & conflict policy.
* **Input:** `{ stageDir, destRoot, pathMap?: Record<string,string>, include?: string[], exclude?: string[], mode?: "skip"|"overwrite"|"rename", dryRun?: boolean }`
* **Behavior:** compute plan; prevent path traversal; dry-run returns plan; commit executes copy.
* **Output:** dry-run `{ actions: [{ from,to,existsAction }], count }`; commit `{ installed, skipped, overwritten, renamed }`
* **Errors:** `E_STAGE_MISSING`, `E_NO_MATCHES`, `E_DEST_NOT_WRITABLE`, `E_PATH_TRAVERSAL`

### 7.6 `dooi.textEdit`

* **Purpose:** **Text‑only** replacements, preserving structure.
* **Input:** `{ destRoot, plan: { include: string[], exclude?: string[], replacements: [{ find?: string, findRegex?: string, replaceWith: string }], options?: { dryRun?: boolean, limitChangedFiles?: number, previewContextLines?: number } } }`
* **Behavior:** Code files parsed with Babel (`jsx`, `typescript`) and modify **JSXText**, **StringLiteral**, **TemplateElement** only; text files via global replace; binaries skipped.
* **Output (commit):** `{ changedFiles, changes: [{ file, changes }], skipped: [{ file, reason }] }` (dry‑run adds previews)
* **Errors:** `E_NO_MATCHES`, `E_INVALID_REPLACEMENT`, `E_INVALID_REGEX`, `E_PARSE_FAILED`, `E_TOO_MANY_CHANGES`

### 7.7 `dooi.installDeps`

* **Purpose:** Install npm packages.
* **Input:** `{ cwd: string, packages: string[], pm?: 'npm'|'yarn'|'pnpm', flags?: string[] }`
* **Behavior:** resolve PM; map to args (`npm install` / `yarn add` / `pnpm add`); stream logs.
* **Output:** `{ pm, args: string[], stdoutTail: string }`
* **Errors:** `E_PM_NOT_FOUND`, `E_PM_EXIT`

### 7.8 Workflow tools (convenience)

* **`dooi.workflow.applyComponent`** — one‑shot component flow: fetch → resolve.uses → fetchBatch → install(dry→commit) → textEdit → installDeps.

  * **Input:** `{ id, destRoot, brand?, pathStrategy?: 'next-app'|string, pathMap?: object, editPlan?: object, autoDeps?: boolean }`
  * **Output:** `{ installed: { files, map? }, edits: { changedFiles }, deps: { installed: string[] } }`
* **`dooi.workflow.applyTemplate`** — one‑shot template flow (same schema; `id` is template).

---

## 8) Non‑Functional Requirements

* **Safety:** Default to dry‑run; no overwrite in v1 unless explicitly chosen.
* **Determinism:** Same inputs → same outputs; JSON‑serializable.
* **Performance:** Fetch: bounded by network; Install plan <1s/1k files; Text edit up to \~1k files on a dev laptop <20s.
* **Portability:** Node.js ≥ 18; macOS/Linux/WSL.
* **Security:** No external network beyond `npx dooi-ui`; no arbitrary code exec beyond package managers.
* **Logging:** stdout is protocol; **log to stderr only**.

---

## 9) MCP Capabilities — Tools

* `dooi.list`, `dooi.fetch`, `dooi.resolve.uses`, `dooi.fetchBatch`, `dooi.install`, `dooi.textEdit`, `dooi.installDeps`, `dooi.workflow.applyComponent`, `dooi.workflow.applyTemplate`.

## 10) MCP Capabilities — Resources

* `mcp://dooi/catalog` → `{ items, generatedAt }`
* `mcp://dooi/stage/{token}/tree` → `{ stageDir, files }`
* `mcp://dooi/stage/{token}/meta` → `{ id, title?, description?, dependencies?, peerDependencies?, uses? }`

## 11) MCP Capabilities — Prompts

* `dooi/quick_start` (vars: `{ id, destRoot }`) → plan: fetch → install(dry) → install → textEdit → installDeps
* `dooi/plan_install` (vars: `{ stageTree, destRoot, projectType }`) → propose `pathMap`, include/exclude
* `dooi/generate_text_edits` (vars: `{ brandName, replacements[], toneHints? }`) → safe replacements

---

## 12) Error Handling & Edge Cases

* CLI missing/blocked → actionable message (`dooi not found`) + hint to use `npx`.
* Empty globs → guidance on include/exclude.
* Copy conflicts → v1 default `skip`, report `skipped`.
* Parser failure → plain‑text fallback; if still failing, skip with reason.
* Permissions → fail fast with offending path.

---

## 13) QA Plan & Acceptance Criteria

**Critical Scenarios**

1. Template happy path: fetch → install(dry) → install → textEdit → deps OK; brand copy updated with no structural break.
2. Component‑only path: resolves `uses` (e.g., `ui/fluid-blob`), installs into `src/components/`.
3. Conflicts: existing dest files → `skipped>0`, no overwrite in default mode.
4. Parser fallback: unusual syntax handled or safely skipped.

**Acceptance**

* Passes on macOS (Apple Silicon) & Linux with Node ≥ 18.
* Only text nodes/literals modified; structure preserved.
* Dry‑run documented and demonstrated.

---

## 14) Milestones

* **M0 – Skeleton (1 day):** server boot, capability ads, handlers.
* **M1 – Fetch/Install (1–2 days):** stage mgmt, glob plan, dry‑run & commit copy.
* **M2 – Text Edits (1–2 days):** AST + fallback, globs, counters.
* **M3 – Deps Install (0.5 day):** npm/yarn/pnpm runner.
* **M4 – Parsing polish (0.5 day):** robust stdout parse to meta.
* **M5 – QA & Examples (0.5 day):** example flows, tests.

---

## 15) Risks & Mitigations

* **CLI output variance** → resilient parsing; treat meta as optional enhancement.
* **Large repos (I/O)** → include/exclude defaults; consider streaming copy (vNext).
* **Regex over‑match** → prefer exact `find`; document safe patterns; `limitChangedFiles` guard.

---

## 16) Out of Scope

* Project bootstrap (Next.js init, ESLint/Prettier config).
* Design token systems or theme engines.
* Binary asset optimization or image processing.

---

## 17) Appendix

### Example Agent Flow — Component

1. `dooi.fetch { id: "Hero/FluidBlobDemo" }`
2. `dooi.resolve.uses { stageDir }` → `requiredIds=["ui/fluid-blob"]`
3. `dooi.fetchBatch { ids: ["ui/fluid-blob"] }`
4. `dooi.install { stageDir, destRoot, pathMap, dryRun: true }` → confirm
5. `dooi.install { ... dryRun: false }`
6. `dooi.textEdit { destRoot, plan: { include: ["**/*.{ts,tsx,md}"], replacements: [{ find: "Morphic Dreams", replaceWith: "XYZ" }] } }`
7. `dooi.installDeps { cwd: destRoot, packages: ["three","@react-three/fiber"], pm: "npm" }`

### Example Agent Flow — Template

1. `dooi.fetch { id: "landing-morphic" }`
2. `dooi.resolve.uses { stageDir }` → `requiredIds=["ui/fluid-blob","Hero/MorphicDreamsDemo"]`
3. `dooi.fetchBatch { ids: requiredIds }`
4. `dooi.install { stageDir, destRoot, pathMap, dryRun: true }`
5. `dooi.install { ... dryRun: false }`
6. `dooi.textEdit { destRoot, plan }`
7. `dooi.installDeps { cwd: destRoot, packages: ["three","@react-three/fiber"], pm: "npm" }`

---

## 18) Template Package Source

* The templates/components consumed by this server are distributed via the npm package **dooi-ui**.
* Source: [https://www.npmjs.com/package/dooi-ui](https://www.npmjs.com/package/dooi-ui)
* The CLI command `npx dooi-ui get <id>` fetches assets originating from **dooi-ui**. Pin exact versions when stability is critical (e.g., `npx dooi-ui@<version>` and align with `dooi-ui@<version>`).

**End of PRD**
