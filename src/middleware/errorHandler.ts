/**
 * Error Handler Middleware
 * ToIP Trust Registry v2 Backend
 *
 * Global error handling for Express application
 * Supports RFC 7807 Problem Details format
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { Request, Response, NextFunction } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import { env } from '../config/env';
import { ProblemDetailsError } from '../errors/trqpErrors';

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
 * RFC 7807 Problem Details response format
 */
interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

/**
 * Build RFC 7807 Problem Details response
 */
function buildProblemDetails(
  status: number,
  title: string,
  detail: string,
  instance?: string,
  errors?: Array<{ field: string; message: string }>
): ProblemDetails {
  return {
    type: `https://api.trustregistry.io/problems/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail,
    ...(instance && { instance }),
    ...(errors && { errors }),
  };
}

/**
 * 404 Not Found Handler
 * Catches all requests that don't match any routes
 */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  const problemDetails = buildProblemDetails(
    404,
    'Not Found',
    `Cannot ${req.method} ${req.path}`,
    req.path
  );
  res.status(404).contentType('application/problem+json').json(problemDetails);
}

/**
 * Global Error Handler
 * Catches all errors thrown in the application
 * Returns RFC 7807 Problem Details format
 */
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  // Handle ProblemDetailsError (RFC 7807 compliant)
  if (err instanceof ProblemDetailsError) {
    const response: ProblemDetails = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: err.instance || req.path,
    };
    if (env.NODE_ENV === 'development') {
      response.stack = err.stack;
    }
    res.status(err.status).contentType('application/problem+json').json(response);
    return;
  }

  // Default error values
  let statusCode = 500;
  let title = 'Internal Server Error';
  let detail = 'An unexpected error occurred';
  let errors: Array<{ field: string; message: string }> | undefined;

  // Handle different error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    title = err.name;
    detail = err.message;
  } else if (err instanceof PrismaClientKnownRequestError) {
    const prismaError = handlePrismaError(err);
    statusCode = prismaError.statusCode;
    title = prismaError.error;
    detail = prismaError.message;
    if (prismaError.details) {
      errors = [{ field: String(prismaError.details.field || 'unknown'), message: detail }];
    }
  } else if (err instanceof PrismaClientValidationError) {
    statusCode = 400;
    title = 'Validation Error';
    detail = 'Invalid data provided';
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    title = 'Bad Request';
    detail = 'Invalid JSON in request body';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    title = 'Validation Error';
    detail = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    title = 'Unauthorized';
    detail = err.message || 'Authentication failed';
  }

  // Build RFC 7807 Problem Details response
  const problemDetails = buildProblemDetails(statusCode, title, detail, req.path, errors);

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    problemDetails.stack = err.stack;
  }

  res.status(statusCode).contentType('application/problem+json').json(problemDetails);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(err: PrismaClientKnownRequestError): {
  statusCode: number;
  error: string;
  message: string;
  details?: { field?: unknown };
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
