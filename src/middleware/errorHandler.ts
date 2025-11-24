/**
 * Error Handler Middleware
 * ToIP Trust Registry v2 Backend
 *
 * Global error handling for Express application
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { env } from '../config/env';

/**
 * Custom Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
  });
}

/**
 * Global Error Handler
 * Catches all errors thrown in the application
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  // Default error response
  let statusCode = 500;
  let errorName = 'Internal Server Error';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  // Handle different error types
  if (err instanceof AppError) {
    // Custom application errors
    statusCode = err.statusCode;
    errorName = err.name;
    message = err.message;
  } else if (err instanceof PrismaClientKnownRequestError) {
    // Prisma database errors
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    errorName = prismaError.error;
    message = prismaError.message;
    details = prismaError.details;
  } else if (err instanceof PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = 400;
    errorName = 'Validation Error';
    message = 'Invalid data provided';
  } else if (err instanceof SyntaxError && 'body' in err) {
    // JSON parsing errors
    statusCode = 400;
    errorName = 'Bad Request';
    message = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    // Validation errors
    statusCode = 400;
    errorName = 'Validation Error';
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    // JWT/Auth errors
    statusCode = 401;
    errorName = 'Unauthorized';
    message = err.message || 'Authentication failed';
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: errorName,
    message,
  };

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: PrismaClientKnownRequestError): {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
} {
  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      return {
        statusCode: 409,
        error: 'Conflict',
        message: 'A record with this value already exists',
        details: {
          field: err.meta?.target,
        },
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: 404,
        error: 'Not Found',
        message: 'The requested record was not found',
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid reference to related record',
        details: {
          field: err.meta?.field_name,
        },
      };

    case 'P2014':
      // Required relation violation
      return {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Required relation is missing',
      };

    default:
      return {
        statusCode: 500,
        error: 'Database Error',
        message: 'A database error occurred',
      };
  }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
