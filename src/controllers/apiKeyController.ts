/**
 * API Key Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles API key management endpoints
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { APIKeyModel, CreateAPIKeyData } from '../models/APIKeyModel';

/**
 * Create a new API key
 * POST /v2/api-keys
 * Admin only
 */
export async function createAPIKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, role, registryId, expiresAt } = req.body;

    // Validate required fields
    if (!name || !role) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and role are required',
      });
      return;
    }

    // Validate role
    const validRoles = ['admin', 'registry_owner', 'public'];
    if (!validRoles.includes(role)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
      return;
    }

    // Validate registryId for registry_owner role
    if (role === 'registry_owner' && !registryId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'registryId is required for registry_owner role',
      });
      return;
    }

    // Parse expiresAt if provided
    let expiresAtDate: Date | undefined;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid expiresAt date format',
        });
        return;
      }
    }

    // Create API key
    const data: CreateAPIKeyData = {
      name,
      role,
      registryId,
      expiresAt: expiresAtDate,
    };

    const apiKey = await APIKeyModel.create(data);

    // Return API key with plaintext key (only time it's available)
    res.status(201).json({
      message: 'API key created successfully',
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        role: apiKey.role,
        registryId: apiKey.registryId,
        key: apiKey.key, // Plaintext key - save this!
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
      },
      warning: 'Save this key securely. It will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create API key',
    });
  }
}

/**
 * List all API keys
 * GET /v2/api-keys
 * Admin only
 */
export async function listAPIKeys(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { role } = req.query;

    // Validate role filter if provided
    if (role && typeof role !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Role must be a string',
      });
      return;
    }

    // Get API keys
    const apiKeys = await APIKeyModel.list(role);

    // Return without keyHash
    const sanitizedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      role: key.role,
      registryId: key.registryId,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsedAt: key.lastUsedAt,
    }));

    res.status(200).json({
      data: sanitizedKeys,
      meta: {
        total: sanitizedKeys.length,
      },
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list API keys',
    });
  }
}

/**
 * Get API key by ID
 * GET /v2/api-keys/:id
 * Admin only
 */
export async function getAPIKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'ID is required',
      });
      return;
    }

    const apiKey = await APIKeyModel.findById(id);

    if (!apiKey) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found',
      });
      return;
    }

    // Return without keyHash
    res.status(200).json({
      data: {
        id: apiKey.id,
        name: apiKey.name,
        role: apiKey.role,
        registryId: apiKey.registryId,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
      },
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get API key',
    });
  }
}

/**
 * Delete (revoke) an API key
 * DELETE /v2/api-keys/:id
 * Admin only
 */
export async function deleteAPIKey(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'ID is required',
      });
      return;
    }

    // Check if API key exists
    const apiKey = await APIKeyModel.findById(id);
    if (!apiKey) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found',
      });
      return;
    }

    // Delete API key
    await APIKeyModel.delete(id);

    res.status(200).json({
      message: 'API key revoked successfully',
      data: {
        id: apiKey.id,
        name: apiKey.name,
      },
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete API key',
    });
  }
}
