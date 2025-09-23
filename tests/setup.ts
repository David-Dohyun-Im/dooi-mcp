/**
 * Jest test setup
 */

import { jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock process.stderr.write to avoid test output noise
const originalStderrWrite = process.stderr.write;
process.stderr.write = jest.fn() as any;

// Restore stderr after tests
afterAll(() => {
  process.stderr.write = originalStderrWrite;
});

// Set test timeout
jest.setTimeout(30000);
