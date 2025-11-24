/**
 * Authentication Middleware
 * ToIP Trust Registry v2 Backend
 *
 * Validates API keys and attaches user info to requests
 */

/* eslint-disable no-console */

import { Request, Response, NextFunction } from 'express';
import { APIKey } from '@prisma/client';
import { APIKeyModel } from '../models/APIKeyModel';

/**
 * Extended Request interface with API key info
 */
export interface AuthenticatedRequest extends Request {
  apiKey?: APIKey;
  user?: {
    id: string;
    role: string;
    registryId?: string;
  };
}

/**
 * Authentication middleware
 * Validates X-API-Key header and attaches user info to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    const apiKey = req.header('X-API-Key');

    // Check if API key is provided
    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key is required. Please provide X-API-Key header.',
      });
      return;
    }

    // Verify API key
    const verifyResult = await APIKeyModel.verify(apiKey);

    // Check if key is valid
    if (!verifyResult.valid || !verifyResult.apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: verifyResult.reason || 'Invalid API key',
      });
      return;
    }

    // Attach API key and user info to request
    req.apiKey = verifyResult.apiKey;
    req.user = {
      id: verifyResult.apiKey.id,
      role: verifyResult.apiKey.role,
      registryId: verifyResult.apiKey.registryId || undefined,
    };

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if API key is provided, but doesn't require it
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    const apiKey = req.header('X-API-Key');

    // If no API key provided, continue without authentication
    if (!apiKey) {
      next();
      return;
    }

    // Verify API key
    const verifyResult = await APIKeyModel.verify(apiKey);

    // If valid, attach user info
    if (verifyResult.valid && verifyResult.apiKey) {
      req.apiKey = verifyResult.apiKey;
      req.user = {
        id: verifyResult.apiKey.id,
        role: verifyResult.apiKey.role,
        registryId: verifyResult.apiKey.registryId || undefined,
      };
    }

    // Continue regardless of validation result
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // Continue even if error occurs
    next();
  }
}
