/**
 * Core type definitions for dooi-mcp server
 */

export interface StageDir {
  path: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface CopyAction {
  from: string;
  to: string;
  existsAction: 'skip' | 'overwrite' | 'rename';
}

export interface CopyPlan {
  actions: CopyAction[];
  count: number;
}

export interface CopyResult {
  installed: string[];
  skipped: string[];
  overwritten: string[];
  renamed: string[];
}

export interface TextReplacement {
  find?: string;
  findRegex?: string;
  replaceWith: string;
}

export interface EditPlan {
  include: string[];
  exclude?: string[];
  replacements: TextReplacement[];
  options?: {
    dryRun?: boolean;
    limitChangedFiles?: number;
    previewContextLines?: number;
  };
}

export interface EditChange {
  file: string;
  line: number;
  column: number;
  oldText: string;
  newText: string;
}

export interface EditResult {
  changedFiles: string[];
  changes: EditChange[];
  skipped: Array<{
    file: string;
    reason: string;
  }>;
}

export interface EditPreview {
  file: string;
  changes: EditChange[];
  context: {
    before: string[];
    after: string[];
  };
}

export interface ComponentMeta {
  id: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  uses?: string[];
  codeBlock?: string;
}

export interface FetchResult {
  stageDir: string;
  files: string[];
  meta: ComponentMeta;
  raw: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };
}

export interface BatchFetchResult {
  stages: Array<{
    id: string;
    stageDir: string;
    files: string[];
  }>;
}

export interface ListItem {
  id: string;
  type: 'template' | 'component';
  title: string;
  description: string;
}

export interface ListResult {
  items: ListItem[];
  raw: {
    stdout: string;
    stderr: string;
  };
}

export interface ResolveUsesResult {
  requiredIds: string[];
}

export interface InstallDepsResult {
  pm: string;
  args: string[];
  stdoutTail: string;
}

export interface WorkflowResult {
  installed: {
    files: string[];
    map?: Record<string, string>;
  };
  edits: {
    changedFiles: string[];
  };
  deps: {
    installed: string[];
  };
}

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export type ConflictMode = 'skip' | 'overwrite' | 'rename';

export type PathStrategy = 'next-app' | 'vite-react' | string;

export interface PathMapping {
  [sourcePath: string]: string;
}

export interface StageInfo {
  token: string;
  stageDir: string;
  files: string[];
}

export interface StageMeta {
  id: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  peerDependencies?: string[];
  uses?: string[];
}
