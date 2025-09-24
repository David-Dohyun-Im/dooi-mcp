/**
 * Integration tests for workflow system
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { executeWorkflow, generateBrandEditPlan, validateWorkflowOptions } from '../../src/core/workflow.js';
import { createError, ErrorCode } from '../../src/core/errors.js';

// Mock the tool handlers
jest.mock('../../src/capabilities/tools/fetch.js');
jest.mock('../../src/capabilities/tools/install.js');
jest.mock('../../src/capabilities/tools/installDeps.js');
jest.mock('../../src/capabilities/tools/textEdit.js');
jest.mock('../../src/core/pm.js');

describe('Workflow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('validateWorkflowOptions', () => {
    it('should validate correct options', () => {
      const validOptions = {
        id: 'ui/button',
        destRoot: '/tmp/test',
        brand: 'MyBrand',
        pathStrategy: 'next-app' as const,
        autoDeps: true
      };

      expect(() => validateWorkflowOptions(validOptions)).not.toThrow();
    });

    it('should reject missing ID', () => {
      const invalidOptions = {
        destRoot: '/tmp/test'
      } as any;

      expect(() => validateWorkflowOptions(invalidOptions)).toThrow();
    });

    it('should reject missing destRoot', () => {
      const invalidOptions = {
        id: 'ui/button'
      } as any;

      expect(() => validateWorkflowOptions(invalidOptions)).toThrow();
    });

    it('should reject invalid path strategy', () => {
      const invalidOptions = {
        id: 'ui/button',
        destRoot: '/tmp/test',
        pathStrategy: 'invalid-strategy'
      } as any;

      expect(() => validateWorkflowOptions(invalidOptions)).toThrow();
    });
  });

  describe('generateBrandEditPlan', () => {
    it('should generate correct edit plan for brand', () => {
      const plan = generateBrandEditPlan('MyCompany');

      expect(plan.include).toContain('**/*.tsx');
      expect(plan.include).toContain('**/*.ts');
      expect(plan.include).toContain('**/*.jsx');
      expect(plan.include).toContain('**/*.js');
      expect(plan.include).toContain('**/*.md');
      expect(plan.include).toContain('**/*.json');

      expect(plan.exclude).toContain('node_modules/**');
      expect(plan.exclude).toContain('.git/**');
      expect(plan.exclude).toContain('dist/**');

      expect(plan.replacements).toHaveLength(5);
      expect(plan.replacements[0]).toEqual({
        find: '{{BRAND}}',
        replaceWith: 'MyCompany'
      });
      expect(plan.replacements[1]).toEqual({
        find: '{{COMPANY}}',
        replaceWith: 'MyCompany'
      });
      expect(plan.replacements[4]).toEqual({
        find: 'dooi',
        replaceWith: 'mycompany'
      });

      expect(plan.options.dryRun).toBe(false);
      expect(plan.options.limitChangedFiles).toBe(100);
      expect(plan.options.previewContextLines).toBe(3);
    });

    it('should handle different brand names', () => {
      const plan1 = generateBrandEditPlan('AcmeCorp');
      const plan2 = generateBrandEditPlan('TechStart');

      expect(plan1.replacements[0].replaceWith).toBe('AcmeCorp');
      expect(plan2.replacements[0].replaceWith).toBe('TechStart');
      expect(plan1.replacements[4].replaceWith).toBe('acmecorp');
      expect(plan2.replacements[4].replaceWith).toBe('techstart');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute complete workflow successfully', async () => {
      // Mock successful fetch
      const { handleFetch } = await import('../../src/capabilities/tools/fetch.js');
      (handleFetch as jest.MockedFunction<any>).mockResolvedValue({
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx', 'README.md'],
        meta: {
          id: 'ui/button',
          title: 'Button Component',
          description: 'A button component',
          dependencies: ['react'],
          peerDependencies: ['react-dom']
        }
      });

      // Mock successful install
      const { handleInstall } = await import('../../src/capabilities/tools/install.js');
      (handleInstall as jest.MockedFunction<any>).mockResolvedValue({
        installed: ['components/ui/Button.tsx'],
        skipped: [],
        overwritten: [],
        renamed: []
      });

      // Mock successful text edit
      const { handleTextEdit } = await import('../../src/capabilities/tools/textEdit.js');
      (handleTextEdit as jest.MockedFunction<any>).mockResolvedValue({
        changedFiles: ['README.md'],
        changes: []
      });

      // Mock successful dependency installation
      const { handleInstallDeps } = await import('../../src/capabilities/tools/installDeps.js');
      (handleInstallDeps as jest.MockedFunction<any>).mockResolvedValue({
        pm: 'npm',
        args: ['install', 'react'],
        stdoutTail: 'Success'
      });

      // Mock package manager detection
      const { detectPackageManager } = await import('../../src/core/pm.js');
      (detectPackageManager as jest.MockedFunction<any>).mockResolvedValue({
        name: 'npm',
        lockFile: 'package-lock.json',
        installCommand: ['install'],
        addCommand: ['install'],
        runCommand: ['run']
      });

      const result = await executeWorkflow({
        id: 'ui/button',
        destRoot: '/tmp/test',
        brand: 'MyBrand',
        pathStrategy: 'next-app',
        autoDeps: true,
        dryRun: false
      });

      expect(result.success).toBe(true);
      expect(result.summary.totalSteps).toBe(4);
      expect(result.summary.successfulSteps).toBe(4);
      expect(result.summary.failedSteps).toBe(0);
      expect(result.summary.errors).toHaveLength(0);

      expect(result.steps.fetch?.success).toBe(true);
      expect(result.steps.install?.success).toBe(true);
      expect(result.steps.textEdit?.success).toBe(true);
      expect(result.steps.installDeps?.success).toBe(true);
    });

    it('should handle fetch failure', async () => {
      const { handleFetch } = await import('../../src/capabilities/tools/fetch.js');
      (handleFetch as jest.MockedFunction<any>).mockRejectedValue(new Error('Fetch failed'));

      const result = await executeWorkflow({
        id: 'ui/nonexistent',
        destRoot: '/tmp/test',
        autoDeps: false,
        dryRun: false
      });

      expect(result.success).toBe(false);
      expect(result.summary.totalSteps).toBe(1);
      expect(result.summary.successfulSteps).toBe(0);
      expect(result.summary.failedSteps).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0]).toContain('Fetch failed');

      expect(result.steps.fetch?.success).toBe(false);
      expect(result.steps.install).toBeUndefined();
    });

    it('should handle install failure gracefully', async () => {
      const { handleFetch } = await import('../../src/capabilities/tools/fetch.js');
      (handleFetch as jest.MockedFunction<any>).mockResolvedValue({
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx'],
        meta: { id: 'ui/button', dependencies: [] }
      });

      const { handleInstall } = await import('../../src/capabilities/tools/install.js');
      (handleInstall as jest.MockedFunction<any>).mockRejectedValue(new Error('Install failed'));

      const result = await executeWorkflow({
        id: 'ui/button',
        destRoot: '/tmp/test',
        autoDeps: false,
        dryRun: false
      });

      expect(result.success).toBe(false);
      expect(result.summary.totalSteps).toBe(2);
      expect(result.summary.successfulSteps).toBe(1);
      expect(result.summary.failedSteps).toBe(1);
      expect(result.summary.errors).toHaveLength(1);
      expect(result.summary.errors[0]).toContain('Install failed');

      expect(result.steps.fetch?.success).toBe(true);
      expect(result.steps.install?.success).toBe(false);
    });

    it('should skip text edit when no edit plan provided', async () => {
      const { handleFetch } = await import('../../src/capabilities/tools/fetch.js');
      (handleFetch as jest.MockedFunction<any>).mockResolvedValue({
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx'],
        meta: { id: 'ui/button', dependencies: [] }
      });

      const { handleInstall } = await import('../../src/capabilities/tools/install.js');
      (handleInstall as jest.MockedFunction<any>).mockResolvedValue({
        installed: ['components/ui/Button.tsx'],
        skipped: [],
        overwritten: [],
        renamed: []
      });

      const result = await executeWorkflow({
        id: 'ui/button',
        destRoot: '/tmp/test',
        autoDeps: false,
        dryRun: false
      });

      expect(result.summary.totalSteps).toBe(2); // fetch + install, no text edit
      expect(result.steps.textEdit).toBeUndefined();
    });

    it('should skip dependency installation when autoDeps is false', async () => {
      const { handleFetch } = await import('../../src/capabilities/tools/fetch.js');
      (handleFetch as jest.MockedFunction<any>).mockResolvedValue({
        stageDir: '/tmp/stage-123',
        files: ['components/ui/Button.tsx'],
        meta: { 
          id: 'ui/button', 
          dependencies: ['react'],
          peerDependencies: ['react-dom']
        }
      });

      const { handleInstall } = await import('../../src/capabilities/tools/install.js');
      (handleInstall as jest.MockedFunction<any>).mockResolvedValue({
        installed: ['components/ui/Button.tsx'],
        skipped: [],
        overwritten: [],
        renamed: []
      });

      const result = await executeWorkflow({
        id: 'ui/button',
        destRoot: '/tmp/test',
        autoDeps: false,
        dryRun: false
      });

      expect(result.summary.totalSteps).toBe(2); // fetch + install, no deps
      expect(result.steps.installDeps).toBeUndefined();
    });
  });
});
