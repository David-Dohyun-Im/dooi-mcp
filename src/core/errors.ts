/**
 * Error codes and helpers for dooi-mcp server
 */

export enum ErrorCode {
  // CLI related errors
  CLI_NOT_FOUND = 'E_CLI_NOT_FOUND',
  LIST_UNAVAILABLE = 'E_LIST_UNAVAILABLE',
  FETCH_FAILED = 'E_FETCH_FAILED',
  PARSE_META = 'E_PARSE_META',
  
  // Stage management errors
  STAGE_MISSING = 'E_STAGE_MISSING',
  STAGE_EXPIRED = 'E_STAGE_EXPIRED',
  STAGE_CREATION_FAILED = 'E_STAGE_CREATION_FAILED',
  
  // Installation errors
  NO_MATCHES = 'E_NO_MATCHES',
  DEST_NOT_WRITABLE = 'E_DEST_NOT_WRITABLE',
  PATH_TRAVERSAL = 'E_PATH_TRAVERSAL',
  INVALID_PATH_MAP = 'E_INVALID_PATH_MAP',
  
  // Text editing errors
  INVALID_REPLACEMENT = 'E_INVALID_REPLACEMENT',
  INVALID_REGEX = 'E_INVALID_REGEX',
  PARSE_FAILED = 'E_PARSE_FAILED',
  TOO_MANY_CHANGES = 'E_TOO_MANY_CHANGES',
  
  // Dependency management errors
  PM_NOT_FOUND = 'E_PM_NOT_FOUND',
  PM_EXIT = 'E_PM_EXIT',
  INSTALL_FAILED = 'E_INSTALL_FAILED',
  
  // General errors
  INVALID_INPUT = 'E_INVALID_INPUT',
  OPERATION_TIMEOUT = 'E_OPERATION_TIMEOUT',
  PERMISSION_DENIED = 'E_PERMISSION_DENIED',
  INTERNAL_ERROR = 'E_INTERNAL_ERROR'
}

export class DooiError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly actionable?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
    actionable?: string
  ) {
    super(message);
    this.name = 'DooiError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    if (actionable !== undefined) {
      this.actionable = actionable;
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      actionable: this.actionable
    };
  }
}

export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCode.CLI_NOT_FOUND]: 'dooi-ui CLI not found. Please install with: npm install -g dooi-ui',
  [ErrorCode.LIST_UNAVAILABLE]: 'Unable to list available templates/components',
  [ErrorCode.FETCH_FAILED]: 'Failed to fetch template/component',
  [ErrorCode.PARSE_META]: 'Failed to parse metadata from CLI output',
  
  [ErrorCode.STAGE_MISSING]: 'Staging directory not found',
  [ErrorCode.STAGE_EXPIRED]: 'Staging directory has expired',
  [ErrorCode.STAGE_CREATION_FAILED]: 'Failed to create staging directory',
  
  [ErrorCode.NO_MATCHES]: 'No files match the specified criteria',
  [ErrorCode.DEST_NOT_WRITABLE]: 'Destination directory is not writable',
  [ErrorCode.PATH_TRAVERSAL]: 'Path traversal attempt detected',
  [ErrorCode.INVALID_PATH_MAP]: 'Invalid path mapping configuration',
  
  [ErrorCode.INVALID_REPLACEMENT]: 'Invalid text replacement pattern',
  [ErrorCode.INVALID_REGEX]: 'Invalid regular expression',
  [ErrorCode.PARSE_FAILED]: 'Failed to parse file content',
  [ErrorCode.TOO_MANY_CHANGES]: 'Too many files would be changed',
  
  [ErrorCode.PM_NOT_FOUND]: 'Package manager not found',
  [ErrorCode.PM_EXIT]: 'Package manager execution failed',
  [ErrorCode.INSTALL_FAILED]: 'Package installation failed',
  
  [ErrorCode.INVALID_INPUT]: 'Invalid input parameters',
  [ErrorCode.OPERATION_TIMEOUT]: 'Operation timed out',
  [ErrorCode.PERMISSION_DENIED]: 'Permission denied',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error'
};

export const actionableGuidance: Record<ErrorCode, string> = {
  [ErrorCode.CLI_NOT_FOUND]: 'Run: npm install -g dooi-ui or use npx dooi-ui instead',
  [ErrorCode.LIST_UNAVAILABLE]: 'Check if dooi-ui is properly installed and accessible',
  [ErrorCode.FETCH_FAILED]: 'Verify the component/template ID exists and network connectivity',
  [ErrorCode.PARSE_META]: 'This is a parsing issue; raw CLI output is included for debugging',
  
  [ErrorCode.STAGE_MISSING]: 'Ensure the staging directory path is correct',
  [ErrorCode.STAGE_EXPIRED]: 'Re-fetch the component/template to get a new staging directory',
  [ErrorCode.STAGE_CREATION_FAILED]: 'Check disk space and write permissions',
  
  [ErrorCode.NO_MATCHES]: 'Adjust include/exclude patterns or check file paths',
  [ErrorCode.DEST_NOT_WRITABLE]: 'Check write permissions for the destination directory',
  [ErrorCode.PATH_TRAVERSAL]: 'Use relative paths within the allowed scope',
  [ErrorCode.INVALID_PATH_MAP]: 'Ensure all paths in the mapping are valid and relative',
  
  [ErrorCode.INVALID_REPLACEMENT]: 'Use valid string patterns or escape special characters',
  [ErrorCode.INVALID_REGEX]: 'Check regex syntax and escape special characters properly',
  [ErrorCode.PARSE_FAILED]: 'File may have syntax errors; check the file content',
  [ErrorCode.TOO_MANY_CHANGES]: 'Use more specific patterns or increase the limit',
  
  [ErrorCode.PM_NOT_FOUND]: 'Install npm, yarn, or pnpm package manager',
  [ErrorCode.PM_EXIT]: 'Check package names and network connectivity',
  [ErrorCode.INSTALL_FAILED]: 'Verify package names and repository access',
  
  [ErrorCode.INVALID_INPUT]: 'Check input parameters against the API specification',
  [ErrorCode.OPERATION_TIMEOUT]: 'Increase timeout or check system performance',
  [ErrorCode.PERMISSION_DENIED]: 'Check file and directory permissions',
  [ErrorCode.INTERNAL_ERROR]: 'This is a bug; please report with details'
};

export function createError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>
): DooiError {
  const finalMessage = message || errorMessages[code];
  const actionable = actionableGuidance[code];
  
  return new DooiError(code, finalMessage, details, actionable);
}

export function isDooiError(error: unknown): error is DooiError {
  return error instanceof DooiError;
}
