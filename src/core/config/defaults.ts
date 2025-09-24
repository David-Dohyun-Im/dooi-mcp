/**
 * Default file extensions, options, and policies
 */

export const DEFAULT_INCLUDE_PATTERNS = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.css',
  '**/*.scss',
  '**/*.sass',
  '**/*.less',
  '**/*.html',
  '**/*.htm',
  '**/*.json',
  '**/*.md',
  '**/*.txt',
  '**/*.svg',
  '**/*.png',
  '**/*.jpg',
  '**/*.jpeg',
  '**/*.gif',
  '**/*.webp',
  '**/*.ico',
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.eot',
  '**/*.otf'
];

export const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  '*.tmp',
  '*.temp',
  '.env*',
  'dist/**',
  'build/**',
  '.next/**',
  '.nuxt/**',
  '.vscode/**',
  '.idea/**',
  '*.swp',
  '*.swo',
  '*~'
];

export const TEXT_FILE_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.sass', '.less',
  '.html', '.htm', '.json', '.md', '.txt', '.xml', '.yaml', '.yml',
  '.env', '.gitignore', '.eslintrc', '.prettierrc'
];

export const BINARY_FILE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.mp3', '.wav', '.flac', '.aac',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'
];

export const MAX_FILES_PER_OPERATION = 1000;
export const MAX_FILE_SIZE_MB = 50;
export const DEFAULT_TIMEOUT_MS = 30000;
export const DEFAULT_PREVIEW_CONTEXT_LINES = 3;

export const SAFE_REPLACEMENT_PATTERNS = [
  // Common brand/company name patterns
  /\b(?:company|brand|organization|corp|inc|ltd|llc)\b/gi,
  // Common placeholder patterns
  /\{\{(?:BRAND|COMPANY|NAME|TITLE)\}\}/gi,
  // Common text patterns that are safe to replace
  /\b(?:lorem|ipsum|dolor|sit|amet)\b/gi
];

export const DANGEROUS_REPLACEMENT_PATTERNS = [
  // Patterns that could break code structure
  /[{}[\]();]/g,
  // Import/export statements
  /^(?:import|export|from|require)\s+/gm,
  // Function declarations
  /^(?:function|const|let|var|class|interface|type|enum)\s+/gm,
  // JSX tags
  /<[^>]+>/g
];

export interface DefaultOptions {
  include: string[];
  exclude: string[];
  maxFiles: number;
  maxFileSizeMB: number;
  timeoutMs: number;
  previewContextLines: number;
  conflictMode: 'skip' | 'overwrite' | 'rename';
  dryRun: boolean;
}

export const DEFAULT_OPTIONS: DefaultOptions = {
  include: DEFAULT_INCLUDE_PATTERNS,
  exclude: DEFAULT_EXCLUDE_PATTERNS,
  maxFiles: MAX_FILES_PER_OPERATION,
  maxFileSizeMB: MAX_FILE_SIZE_MB,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  previewContextLines: DEFAULT_PREVIEW_CONTEXT_LINES,
  conflictMode: 'skip',
  dryRun: true
};
