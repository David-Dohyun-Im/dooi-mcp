/**
 * Tests for dooi.list tool
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { handleList } from '../../src/capabilities/tools/list.js';
import { execa } from 'execa';

// Mock execa
jest.mock('execa');

describe('dooi.list tool', () => {
  const mockExeca = execa as jest.Mocked<typeof execa>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('handleList', () => {
    it('should parse component list successfully', async () => {
      const mockOutput = `
🎨 Dooi UI - Available Components & Templates

📦 Components:
• Cards/ShuffleGridDemo
• ui/fluid-blob
• ui/shuffle-grid

🏗️ Templates:
• landing-morphic: Landing – Morphic Dreams
• pricing-classic: Pricing – Classic Design

Usage: npx dooi-ui list
      `;

      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: mockOutput,
        stderr: '',
        command: 'npx dooi-ui list',
        failed: false,
        killed: false,
        signal: null,
        timedOut: false
      } as any);

      const result = await handleList({});

      expect(result.items).toHaveLength(5);
      expect(result.items[0]).toEqual({
        id: 'Cards/ShuffleGridDemo',
        type: 'component',
        title: 'Cards/ShuffleGridDemo',
        description: 'Component from dooi-ui'
      });
      expect(result.items[3]).toEqual({
        id: 'landing-morphic',
        type: 'template',
        title: 'landing-morphic',
        description: 'Landing – Morphic Dreams'
      });
      expect(result.raw).toBeDefined();
    });

    it('should handle empty output gracefully', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: '',
        stderr: '',
        command: 'npx dooi-ui list',
        failed: false,
        killed: false,
        signal: null,
        timedOut: false
      } as any);

      const result = await handleList({});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('parsing-failed');
    });

    it('should handle CLI not found error', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'command not found: npx',
        command: 'npx dooi-ui list',
        failed: true,
        killed: false,
        signal: null,
        timedOut: false
      } as any);

      await expect(handleList({})).rejects.toThrow('Dooi-ui CLI not found');
    });

    it('should handle other CLI errors', async () => {
      mockExeca.mockResolvedValue({
        exitCode: 1,
        stdout: '',
        stderr: 'Some other error',
        command: 'npx dooi-ui list',
        failed: true,
        killed: false,
        signal: null,
        timedOut: false
      } as any);

      await expect(handleList({})).rejects.toThrow('Unable to list available templates/components');
    });

    it('should handle unexpected errors', async () => {
      mockExeca.mockRejectedValue(new Error('Unexpected error'));

      await expect(handleList({})).rejects.toThrow('Unexpected error in dooi.list');
    });

    it('should validate empty input', async () => {
      // This should not throw as the schema allows empty input
      mockExeca.mockResolvedValue({
        exitCode: 0,
        stdout: 'No components available',
        stderr: '',
        command: 'npx dooi-ui list',
        failed: false,
        killed: false,
        signal: null,
        timedOut: false
      } as any);

      const result = await handleList({});
      expect(result).toBeDefined();
    });
  });
});
