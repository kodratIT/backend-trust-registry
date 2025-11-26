/**
 * Audit Middleware
 * ToIP Trust Registry v2 Backend
 *
 * Middleware to automatically log requests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';
import { logSuccess, logFailure } from '../services/auditService';

// Map HTTP methods to action names
const methodToAction: Record<string, string> = {
  GET: 'read',
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

// Extract resource type from path
function getResourceType(path: string): string {
  const parts = path.split('/').filter(Boolean);
  // Skip 'v2' prefix
  if (parts[0] === 'v2' && parts.length > 1) {
    return parts[1] || 'unknown';
  }
  return parts[0] || 'unknown';
}

// Extract resource ID from path
function getResourceId(path: string): string | undefined {
  const parts = path.split('/').filter(Boolean);
  // Look for UUID or DID patterns
  for (let i = 2; i < parts.length; i++) {
    const part = parts[i];
    if (!part) {continue;}
    // UUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(part)) {
      return part;
    }
    // DID pattern (URL encoded)
    if (part.startsWith('did') || decodeURIComponent(part).startsWith('did:')) {
      return decodeURIComponent(part);
    }
  }
  return undefined;
}

/**
 * Audit middleware - logs all API requests
 */
export function auditMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function (body: any): Response {
    const duration = Date.now() - startTime;
    const action = methodToAction[req.method] || req.method.toLowerCase();
    const resourceType = getResourceType(req.path);
    const resourceId = getResourceId(req.path);
    const actor = req.user?.id;

    const details: Record<string, any> = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    // Don't log request body for security (may contain sensitive data)
    // But log query params for GET requests
    if (req.method === 'GET' && Object.keys(req.query).length > 0) {
      details.query = req.query;
    }

    // Log based on status code
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // Don't await - fire and forget
      void logSuccess(actor, action, resourceType, resourceId, details);
    } else {
      void logFailure(actor, action, resourceType, resourceId, details);
    }

    return originalSend.call(this, body);
  };

  next();
}

/**
 * Selective audit middleware - only audit specific routes
 */
export function auditRoute(action: string, resourceType: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (body: any): Response {
      const duration = Date.now() - startTime;
      const resourceId = getResourceId(req.path);
      const actor = req.user?.id;

      const details: Record<string, any> = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      if (res.statusCode >= 200 && res.statusCode < 400) {
        void logSuccess(actor, action, resourceType, resourceId, details);
      } else {
        void logFailure(actor, action, resourceType, resourceId, details);
      }

      return originalSend.call(this, body);
    };

    next();
  };
}
