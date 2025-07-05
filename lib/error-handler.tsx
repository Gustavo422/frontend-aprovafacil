import { logger } from './logger';
import { AppError } from '../types';

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: unknown, context?: string): AppError {
    if (error instanceof Error) {
      const appError: AppError = {
        code: this.getErrorCode(error),
        message: error.message,
        details: {
          name: error.name,
          stack: error.stack,
          context,
        },
      };

      logger.error('Application error occurred', {
        error: appError,
        context,
      });

      return appError;
    }

    if (typeof error === 'string') {
      const appError: AppError = {
        code: 'UNKNOWN_ERROR',
        message: error,
        details: { context },
      };

      logger.error('String error occurred', {
        error: appError,
        context,
      });

      return appError;
    }

    const appError: AppError = {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: {
        originalError: error,
        context,
      },
    };

    logger.error('Unknown error occurred', {
      error: appError,
      context,
    });

    return appError;
  }

  private getErrorCode(error: Error): string {
    // Map common error types to error codes
    const errorCodeMap: Record<string, string> = {
      ValidationError: 'VALIDATION_ERROR',
      AuthenticationError: 'AUTH_ERROR',
      AuthorizationError: 'FORBIDDEN',
      NotFoundError: 'NOT_FOUND',
      DatabaseError: 'DATABASE_ERROR',
      NetworkError: 'NETWORK_ERROR',
      TimeoutError: 'TIMEOUT_ERROR',
    };

    return errorCodeMap[error.name] || 'INTERNAL_ERROR';
  }

  public createError(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): AppError {
    return {
      code,
      message,
      details,
    };
  }

  public isAppError(error: unknown): error is AppError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Custom error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}
