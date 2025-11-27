/**
 * TRQP Error Classes
 * ToIP Trust Registry v2 Backend
 *
 * RFC 7807 Problem Details compliant error classes
 */

/**
 * Base Problem Details Error (RFC 7807)
 */
export class ProblemDetailsError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly instance?: string;

  constructor(
    status: number,
    title: string,
    detail: string,
    type?: string,
    instance?: string
  ) {
    super(detail);
    this.name = 'ProblemDetailsError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.type = type || `https://api.trustregistry.io/problems/${title.toLowerCase().replace(/\s+/g, '-')}`;
    this.instance = instance;
    Object.setPrototypeOf(this, ProblemDetailsError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      ...(this.instance && { instance: this.instance }),
    };
  }
}

/**
 * 400 Bad Request - Validation Error
 */
export class ValidationError extends ProblemDetailsError {
  public readonly errors?: Array<{ field: string; message: string }>;

  constructor(detail: string, errors?: Array<{ field: string; message: string }>, instance?: string) {
    super(400, 'Validation Error', detail, undefined, instance);
    this.name = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      ...(this.errors && { errors: this.errors }),
    };
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends ProblemDetailsError {
  constructor(detail: string = 'Authentication required', instance?: string) {
    super(401, 'Unauthorized', detail, undefined, instance);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ProblemDetailsError {
  constructor(detail: string = 'Insufficient permissions', instance?: string) {
    super(403, 'Forbidden', detail, undefined, instance);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ProblemDetailsError {
  constructor(detail: string = 'Resource not found', instance?: string) {
    super(404, 'Not Found', detail, undefined, instance);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends ProblemDetailsError {
  constructor(detail: string = 'Resource already exists', instance?: string) {
    super(409, 'Conflict', detail, undefined, instance);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends ProblemDetailsError {
  constructor(detail: string = 'An unexpected error occurred', instance?: string) {
    super(500, 'Internal Server Error', detail, undefined, instance);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
