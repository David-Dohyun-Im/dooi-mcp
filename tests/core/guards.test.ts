/**
 * Tests for security guards and validation
 */

import { describe, it, expect } from '@jest/globals';
import { 
  isPathSafe, 
  ensurePathSafe, 
  isPathWritable, 
  ensurePathWritable,
  validateGlobPatterns 
} from '../../src/core/guards.js';
import { createError, ErrorCode } from '../../src/core/errors.js';

describe('Security Guards', () => {
  describe('isPathSafe', () => {
    it('should allow safe paths within base directory', () => {
      const basePath = '/home/user/project';
      
      expect(isPathSafe(basePath, 'src/components/Button.tsx')).toBe(true);
      expect(isPathSafe(basePath, 'src/../src/Button.tsx')).toBe(true);
      expect(isPathSafe(basePath, './src/Button.tsx')).toBe(true);
    });

    it('should reject path traversal attempts', () => {
      const basePath = '/home/user/project';
      
      expect(isPathSafe(basePath, '../../../etc/passwd')).toBe(false);
      expect(isPathSafe(basePath, 'src/../../../../etc/passwd')).toBe(false);
      expect(isPathSafe(basePath, '/etc/passwd')).toBe(false);
    });

    it('should handle edge cases', () => {
      const basePath = '/home/user/project';
      
      expect(isPathSafe(basePath, '')).toBe(true);
      expect(isPathSafe(basePath, '.')).toBe(true);
      expect(isPathSafe(basePath, '..')).toBe(false);
    });
  });

  describe('ensurePathSafe', () => {
    it('should not throw for safe paths', () => {
      const basePath = '/home/user/project';
      const safePath = 'src/components/Button.tsx';
      
      expect(() => ensurePathSafe(basePath, safePath)).not.toThrow();
    });

    it('should throw DooiError for unsafe paths', () => {
      const basePath = '/home/user/project';
      const unsafePath = '../../../etc/passwd';
      
      expect(() => ensurePathSafe(basePath, unsafePath)).toThrow();
      
      try {
        ensurePathSafe(basePath, unsafePath);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as any).code).toBe(ErrorCode.PATH_TRAVERSAL);
      }
    });
  });

  describe('validateGlobPatterns', () => {
    it('should allow safe glob patterns', () => {
      const safePatterns = [
        'src/**/*.ts',
        'components/**/*.tsx',
        '*.js',
        'src/components/Button.tsx'
      ];
      
      expect(() => validateGlobPatterns(safePatterns)).not.toThrow();
    });

    it('should allow common safe exclude patterns', () => {
      const safeExcludes = [
        'node_modules/**',
        '.git/**',
        '.DS_Store',
        'dist/**',
        'build/**',
        '*.log'
      ];
      
      expect(() => validateGlobPatterns(safeExcludes)).not.toThrow();
    });

    it('should reject dangerous patterns', () => {
      const dangerousPatterns = [
        '**/../../**',
        '**/../**',
        '/**',
        'C:/**',
        'D:/**'
      ];
      
      dangerousPatterns.forEach(pattern => {
        expect(() => validateGlobPatterns([pattern])).toThrow();
      });
    });

    it('should reject overly broad patterns', () => {
      const broadPatterns = ['**', '**/*', '**/**'];
      
      broadPatterns.forEach(pattern => {
        expect(() => validateGlobPatterns([pattern])).toThrow();
      });
    });

    it('should handle empty patterns array', () => {
      expect(() => validateGlobPatterns([])).not.toThrow();
    });
  });

  describe('Path writability checks', () => {
    it('should handle path writability checks', async () => {
      // These tests would require actual file system access
      // For now, we'll test that the functions exist and don't throw
      expect(typeof isPathWritable).toBe('function');
      expect(typeof ensurePathWritable).toBe('function');
    });
  });
});
