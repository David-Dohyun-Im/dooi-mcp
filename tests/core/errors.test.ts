/**
 * Tests for error handling system
 */

import { describe, it, expect } from '@jest/globals';
import { 
  ErrorCode, 
  DooiError, 
  createError, 
  isDooiError,
  errorMessages,
  actionableGuidance 
} from '../../src/core/errors.js';

describe('Error Handling System', () => {
  describe('ErrorCode enum', () => {
    it('should contain all expected error codes', () => {
      expect(ErrorCode.CLI_NOT_FOUND).toBe('E_CLI_NOT_FOUND');
      expect(ErrorCode.LIST_UNAVAILABLE).toBe('E_LIST_UNAVAILABLE');
      expect(ErrorCode.FETCH_FAILED).toBe('E_FETCH_FAILED');
      expect(ErrorCode.INTERNAL_ERROR).toBe('E_INTERNAL_ERROR');
      expect(ErrorCode.INVALID_INPUT).toBe('E_INVALID_INPUT');
    });
  });

  describe('DooiError class', () => {
    it('should create error with required properties', () => {
      const error = new DooiError(
        ErrorCode.INVALID_INPUT,
        'Test error message',
        { test: 'detail' },
        'Test actionable guidance'
      );

      expect(error.name).toBe('DooiError');
      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(error.message).toBe('Test error message');
      expect(error.details).toEqual({ test: 'detail' });
      expect(error.actionable).toBe('Test actionable guidance');
    });

    it('should create error with optional properties', () => {
      const error = new DooiError(ErrorCode.INTERNAL_ERROR, 'Test message');

      expect(error.details).toBeUndefined();
      expect(error.actionable).toBeUndefined();
    });

    it('should serialize to JSON correctly', () => {
      const error = new DooiError(
        ErrorCode.INVALID_INPUT,
        'Test error',
        { test: 'detail' },
        'Test guidance'
      );

      const json = error.toJSON();
      expect(json).toEqual({
        name: 'DooiError',
        code: ErrorCode.INVALID_INPUT,
        message: 'Test error',
        details: { test: 'detail' },
        actionable: 'Test guidance'
      });
    });
  });

  describe('createError function', () => {
    it('should create error with default message', () => {
      const error = createError(ErrorCode.CLI_NOT_FOUND);
      
      expect(error.code).toBe(ErrorCode.CLI_NOT_FOUND);
      expect(error.message).toBe(errorMessages[ErrorCode.CLI_NOT_FOUND]);
      expect(error.actionable).toBe(actionableGuidance[ErrorCode.CLI_NOT_FOUND]);
    });

    it('should create error with custom message', () => {
      const error = createError(ErrorCode.INVALID_INPUT, 'Custom message');
      
      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
      expect(error.message).toBe('Custom message');
      expect(error.actionable).toBe(actionableGuidance[ErrorCode.INVALID_INPUT]);
    });

    it('should create error with details', () => {
      const details = { test: 'detail' };
      const error = createError(ErrorCode.INVALID_INPUT, 'Test', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('isDooiError function', () => {
    it('should identify DooiError instances', () => {
      const dooiError = new DooiError(ErrorCode.INVALID_INPUT, 'Test');
      const regularError = new Error('Test');

      expect(isDooiError(dooiError)).toBe(true);
      expect(isDooiError(regularError)).toBe(false);
      expect(isDooiError(null)).toBe(false);
      expect(isDooiError(undefined)).toBe(false);
    });
  });

  describe('Error messages and guidance', () => {
    it('should have messages for all error codes', () => {
      Object.values(ErrorCode).forEach(code => {
        expect(errorMessages[code]).toBeDefined();
        expect(typeof errorMessages[code]).toBe('string');
        expect(errorMessages[code].length).toBeGreaterThan(0);
      });
    });

    it('should have actionable guidance for all error codes', () => {
      Object.values(ErrorCode).forEach(code => {
        expect(actionableGuidance[code]).toBeDefined();
        expect(typeof actionableGuidance[code]).toBe('string');
        expect(actionableGuidance[code].length).toBeGreaterThan(0);
      });
    });
  });
});
