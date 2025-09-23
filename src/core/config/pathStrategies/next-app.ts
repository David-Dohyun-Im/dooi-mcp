/**
 * Next.js App Router path strategy
 */

import type { PathMapping } from '../../types.js';

/**
 * Default path mappings for Next.js App Router projects
 */
export const NEXT_APP_PATH_MAPPINGS: PathMapping = {
  // App directory structure
  'app/page.tsx': 'app/page.tsx',
  'app/layout.tsx': 'app/layout.tsx',
  'app/globals.css': 'app/globals.css',
  
  // Component directories
  'components/': 'src/components/',
  'ui/': 'src/components/ui/',
  'lib/': 'src/lib/',
  'hooks/': 'src/hooks/',
  'utils/': 'src/utils/',
  'types/': 'src/types/',
  
  // Page components
  'pages/': 'app/',
  'page/': 'app/',
  
  // Assets
  'public/': 'public/',
  'assets/': 'public/assets/',
  'images/': 'public/images/',
  'icons/': 'public/icons/',
  
  // Styles
  'styles/': 'src/styles/',
  'css/': 'src/styles/',
  'scss/': 'src/styles/',
  
  // Configuration files (keep in root)
  'package.json': 'package.json',
  'tsconfig.json': 'tsconfig.json',
  'next.config.js': 'next.config.js',
  'next.config.ts': 'next.config.ts',
  'tailwind.config.js': 'tailwind.config.js',
  'tailwind.config.ts': 'tailwind.config.ts',
  '.env.example': '.env.example',
  '.gitignore': '.gitignore',
  'README.md': 'README.md'
};

/**
 * Get path mapping for Next.js App Router
 */
export function getNextAppPathMapping(customMapping?: PathMapping): PathMapping {
  return {
    ...NEXT_APP_PATH_MAPPINGS,
    ...customMapping
  };
}

/**
 * Validate path mapping for Next.js App Router
 */
export function validateNextAppPathMapping(mapping: PathMapping): void {
  const validDestinations = [
    'app/',
    'src/',
    'public/',
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'next.config.ts',
    'tailwind.config.js',
    'tailwind.config.ts',
    '.env.example',
    '.gitignore',
    'README.md'
  ];
  
  for (const [source, dest] of Object.entries(mapping)) {
    const isValidDestination = validDestinations.some(valid => 
      dest.startsWith(valid) || dest === valid
    );
    
    if (!isValidDestination) {
      throw new Error(`Invalid destination path for Next.js App Router: ${dest}`);
    }
  }
}

/**
 * Get default include patterns for Next.js projects
 */
export function getNextAppIncludePatterns(): string[] {
  return [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.css',
    '**/*.scss',
    '**/*.sass',
    '**/*.less',
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
}

/**
 * Get default exclude patterns for Next.js projects
 */
export function getNextAppExcludePatterns(): string[] {
  return [
    'node_modules/**',
    '.git/**',
    '.next/**',
    'dist/**',
    'build/**',
    '.DS_Store',
    'Thumbs.db',
    '*.log',
    '*.tmp',
    '*.temp',
    '.env*',
    '.vscode/**',
    '.idea/**',
    '*.swp',
    '*.swo',
    '*~'
  ];
}
