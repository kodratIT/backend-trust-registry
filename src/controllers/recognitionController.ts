/**
 * Recognition Controller
 * ToIP Trust Registry v2 Backend
 *
 * CRUD operations for Registry Recognition relationships
 */

/* eslint-disable no-console */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authenticate';

const prisma = new PrismaClient();

/**
 * Request body for creating recognition
 */
interface CreateRecognitionBody {
  authorityRegistryId: string;
  entityId: string;
  action: string;
  resource: string;
  validFrom?: string;
  validUntil?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

/**
 * Create a new recognition relationship
 * Swagger documentation is in routes/recognitionRoutes.ts
 */
export async function createRecognition(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as CreateRecognitionBody;
    const authorityRegistryId = body.authorityRegistryId;
    const entityId = body.entityId;
    const action = body.action;
    const resource = body.resource;
    const validFrom = body.validFrom;
    const validUntil = body.validUntil;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const metadata = body.metadata;

    // Validate required fields
    if (!authorityRegistryId || !entityId || !action || !resource) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'authorityRegistryId, entityId, action, and resource are required',
      });
      return;
    }

    // Verify authority registry exists
    const authority = await prisma.trustRegistry.findUnique({
      where: { id: authorityRegistryId },
    });

    if (!authority) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Authority registry not found',
      });
      return;
    }

    // Check for existing recognition
    const existing = await prisma.registryRecognition.findUnique({
      where: {
        authorityId_entityId_action_resource: {
          authorityId: authorityRegistryId,
          entityId,
          action,
          resource,
        },
      },
    });

    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: 'Recognition already exists for this authority-entity-action-resource combination',
      });
      return;
    }

    // Create recognition
    const recognition = await prisma.registryRecognition.create({
      data: {
        authorityId: authorityRegistryId,
        entityId,
        action,
        resource,
        recognized: true,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: metadata ?? undefined,
      },
      include: {
        authority: {
          select: { id: true, name: true, ecosystemDid: true },
        },
      },
    });

    res.status(201).json({
      message: 'Recognition created successfully',
      data: recognition,
    });
  } catch (error) {
    console.error('Error creating recognition:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create recognition',
    });
  }
}

/**
 * List all recognitions with filtering
 * Swagger documentation is in routes/recognitionRoutes.ts
 */
export async function listRecognitions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';
    const authorityId = req.query.authorityId as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const action = req.query.action as string | undefined;

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (authorityId) {
      where.authorityId = authorityId;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (action) {
      where.action = action;
    }

    const [recognitions, total] = await Promise.all([
      prisma.registryRecognition.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          authority: {
            select: { id: true, name: true, ecosystemDid: true },
          },
        },
      }),
      prisma.registryRecognition.count({ where }),
    ]);

    res.status(200).json({
      data: recognitions,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error listing recognitions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list recognitions',
    });
  }
}

/**
 * Get recognition by ID
 * Swagger documentation is in routes/recognitionRoutes.ts
 */
export async function getRecognition(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const recognition = await prisma.registryRecognition.findUnique({
      where: { id },
      include: {
        authority: {
          select: { id: true, name: true, ecosystemDid: true },
        },
      },
    });

    if (!recognition) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Recognition not found',
      });
      return;
    }

    res.status(200).json({ data: recognition });
  } catch (error) {
    console.error('Error getting recognition:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get recognition',
    });
  }
}

/**
 * Revoke/delete a recognition
 * Swagger documentation is in routes/recognitionRoutes.ts
 */
export async function deleteRecognition(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const recognition = await prisma.registryRecognition.findUnique({
      where: { id },
    });

    if (!recognition) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Recognition not found',
      });
      return;
    }

    await prisma.registryRecognition.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Recognition revoked successfully',
      data: { id },
    });
  } catch (error) {
    console.error('Error deleting recognition:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete recognition',
    });
  }
}
