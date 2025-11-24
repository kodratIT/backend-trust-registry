/**
 * Authorization Middleware (RBAC)
 * ToIP Trust Registry v2 Backend
 *
 * Role-based access control for API endpoints
 */

/* eslint-disable no-console */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticate';

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<string, number> = {
  public: 1,
  registry_owner: 2,
  admin: 3,
};

/**
 * Authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 *
 * @param allowedRoles - Array of roles that are allowed to access the endpoint
 * @returns Express middleware function
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required. Please provide a valid API key.',
        });
        return;
      }

      // Check if user has one of the allowed roles
      const userRole = req.user.role;
      const hasPermission = allowedRoles.includes(userRole);

      if (!hasPermission) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${userRole}`,
        });
        return;
      }

      // User has permission, continue
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authorization',
      });
    }
  };
}

/**
 * Check if user has minimum role level
 *
 * @param requiredRole - Minimum required role
 * @returns Express middleware function
 */
export function requireMinimumRole(requiredRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.role;
      const userLevel = ROLE_HIERARCHY[userRole] || 0;
      const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

      if (userLevel < requiredLevel) {
        res.status(403).json({
          error: 'Forbidden',
          message: `Insufficient permissions. Required: ${requiredRole}, Your role: ${userRole}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authorization',
      });
    }
  };
}

/**
 * Check if user is admin
 */
export const requireAdmin = authorize('admin');

/**
 * Check if user is registry owner or admin
 */
export const requireRegistryOwner = authorize('registry_owner', 'admin');

/**
 * Check if user owns the specified registry
 *
 * @param getRegistryId - Function to extract registry ID from request
 * @returns Express middleware function
 */
export function requireRegistryAccess(
  getRegistryId: (req: AuthenticatedRequest) => string | undefined
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
        return;
      }

      // Admins have access to all registries
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Get registry ID from request
      const requestedRegistryId = getRegistryId(req);

      // Check if user is registry owner
      if (req.user.role === 'registry_owner') {
        // Check if user owns this registry
        if (req.user.registryId !== requestedRegistryId) {
          res.status(403).json({
            error: 'Forbidden',
            message: 'You do not have access to this registry',
          });
          return;
        }
      } else {
        // Public users don't have write access
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions to access this registry',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Registry access check error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authorization',
      });
    }
  };
}

/**
 * Allow public access (no authentication required)
 * This is just a marker middleware for documentation purposes
 */
export function allowPublic(_req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  next();
}
