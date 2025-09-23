/**
 * Zod schemas for MCP tool input/output validation
 */

import { z } from 'zod';

// Common schemas
const stringNonEmpty = z.string().min(1);
const stringOptional = z.string().optional();
const numberPositive = z.number().positive();
const booleanOptional = z.boolean().optional();

// List tool schemas
export const ListInputSchema = z.object({});
export const ListOutputSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    type: z.enum(['template', 'component']),
    title: z.string(),
    description: z.string()
  })),
  raw: z.object({
    stdout: z.string(),
    stderr: z.string()
  })
});

// Fetch tool schemas
export const FetchInputSchema = z.object({
  id: stringNonEmpty,
  ref: stringOptional,
  options: z.object({
    timeoutMs: numberPositive.optional(),
    env: z.record(z.string()).optional()
  }).optional()
});

export const FetchOutputSchema = z.object({
  stageDir: z.string(),
  files: z.array(z.string()),
  meta: z.object({
    id: z.string(),
    title: stringOptional,
    description: stringOptional,
    dependencies: z.array(z.string()).optional(),
    peerDependencies: z.array(z.string()).optional(),
    uses: z.array(z.string()).optional(),
    codeBlock: stringOptional
  }),
  raw: z.object({
    stdout: z.string(),
    stderr: z.string(),
    exitCode: z.number()
  })
});

// Resolve uses tool schemas
export const ResolveUsesInputSchema = z.object({
  stageDir: stringNonEmpty
});

export const ResolveUsesOutputSchema = z.object({
  requiredIds: z.array(z.string())
});

// Fetch batch tool schemas
export const FetchBatchInputSchema = z.object({
  ids: z.array(stringNonEmpty).min(1)
});

export const FetchBatchOutputSchema = z.object({
  stages: z.array(z.object({
    id: z.string(),
    stageDir: z.string(),
    files: z.array(z.string())
  }))
});

// Install tool schemas
export const InstallInputSchema = z.object({
  stageDir: stringNonEmpty,
  destRoot: stringNonEmpty,
  pathMap: z.record(z.string()).optional(),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  mode: z.enum(['skip', 'overwrite', 'rename']).optional(),
  dryRun: booleanOptional
});

export const InstallOutputSchema = z.object({
  actions: z.array(z.object({
    from: z.string(),
    to: z.string(),
    existsAction: z.enum(['skip', 'overwrite', 'rename'])
  })).optional(),
  count: numberPositive.optional(),
  installed: z.array(z.string()).optional(),
  skipped: z.array(z.string()).optional(),
  overwritten: z.array(z.string()).optional(),
  renamed: z.array(z.string()).optional()
});

// Text edit tool schemas
export const TextEditInputSchema = z.object({
  destRoot: stringNonEmpty,
  plan: z.object({
    include: z.array(stringNonEmpty).min(1),
    exclude: z.array(z.string()).optional(),
    replacements: z.array(z.object({
      find: stringOptional,
      findRegex: stringOptional,
      replaceWith: z.string()
    })).min(1),
    options: z.object({
      dryRun: booleanOptional,
      limitChangedFiles: numberPositive.optional(),
      previewContextLines: numberPositive.optional()
    }).optional()
  })
});

export const TextEditOutputSchema = z.object({
  changedFiles: z.array(z.string()),
  changes: z.array(z.object({
    file: z.string(),
    line: z.number(),
    column: z.number(),
    oldText: z.string(),
    newText: z.string()
  })),
  skipped: z.array(z.object({
    file: z.string(),
    reason: z.string()
  })),
  previews: z.array(z.object({
    file: z.string(),
    changes: z.array(z.object({
      line: z.number(),
      column: z.number(),
      oldText: z.string(),
      newText: z.string()
    })),
    context: z.object({
      before: z.array(z.string()),
      after: z.array(z.string())
    })
  })).optional()
});

// Install deps tool schemas
export const InstallDepsInputSchema = z.object({
  cwd: stringNonEmpty,
  packages: z.array(stringNonEmpty).min(1),
  pm: z.enum(['npm', 'yarn', 'pnpm']).optional(),
  flags: z.array(z.string()).optional()
});

export const InstallDepsOutputSchema = z.object({
  pm: z.string(),
  args: z.array(z.string()),
  stdoutTail: z.string()
});

// Workflow tool schemas
export const WorkflowInputSchema = z.object({
  id: stringNonEmpty,
  destRoot: stringNonEmpty,
  brand: stringOptional,
  pathStrategy: z.enum(['next-app', 'vite-react']).optional(),
  pathMap: z.record(z.string()).optional(),
  editPlan: z.object({
    include: z.array(stringNonEmpty).min(1),
    exclude: z.array(z.string()).optional(),
    replacements: z.array(z.object({
      find: stringOptional,
      findRegex: stringOptional,
      replaceWith: z.string()
    })).min(1),
    options: z.object({
      dryRun: booleanOptional,
      limitChangedFiles: numberPositive.optional(),
      previewContextLines: numberPositive.optional()
    }).optional()
  }).optional().or(z.object({})),
  autoDeps: booleanOptional
});

export const WorkflowOutputSchema = z.object({
  installed: z.object({
    files: z.array(z.string()),
    map: z.record(z.string()).optional()
  }),
  edits: z.object({
    changedFiles: z.array(z.string())
  }),
  deps: z.object({
    installed: z.array(z.string())
  })
});

// Error response schema
export const ErrorResponseSchema = z.object({
  name: z.string(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  actionable: z.string().optional()
});

// Type exports
export type ListInput = z.infer<typeof ListInputSchema>;
export type ListOutput = z.infer<typeof ListOutputSchema>;
export type FetchInput = z.infer<typeof FetchInputSchema>;
export type FetchOutput = z.infer<typeof FetchOutputSchema>;
export type ResolveUsesInput = z.infer<typeof ResolveUsesInputSchema>;
export type ResolveUsesOutput = z.infer<typeof ResolveUsesOutputSchema>;
export type FetchBatchInput = z.infer<typeof FetchBatchInputSchema>;
export type FetchBatchOutput = z.infer<typeof FetchBatchOutputSchema>;
export type InstallInput = z.infer<typeof InstallInputSchema>;
export type InstallOutput = z.infer<typeof InstallOutputSchema>;
export type TextEditInput = z.infer<typeof TextEditInputSchema>;
export type TextEditOutput = z.infer<typeof TextEditOutputSchema>;
export type InstallDepsInput = z.infer<typeof InstallDepsInputSchema>;
export type InstallDepsOutput = z.infer<typeof InstallDepsOutputSchema>;
export type WorkflowInput = z.infer<typeof WorkflowInputSchema>;
export type WorkflowOutput = z.infer<typeof WorkflowOutputSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
