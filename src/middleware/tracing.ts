/**
 * Request Tracing Middleware
 * ToIP Trust Registry v2 Backend
 *
 * Handles X-Request-ID header for request correlation
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Extended Request interface with request ID
 */
export interface TracedRequest extends Request {
  requestId?: string;
}

/**
 * Request tracing middleware
 * - Extracts X-Request-ID from request header if present
 * - Generates a new UUID if not present
 * - Attaches to request object and response header
 */
export function tracingMiddleware(
  req: TracedRequest,
  res: Response,
  next: NextFunction
): void {
  // Extract or generate request ID
  const requestId = req.header('X-Request-ID') || randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Attach to response header
  res.setHeader('X-Request-ID', requestId);

  next();
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string | undefined {
  return (req as TracedRequest).requestId;
}
