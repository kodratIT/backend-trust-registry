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
 * @swagger
 * /v2/recognitions:
 *   post:
 *     summary: Create a recognition relationship
 *     description: Create a new recognition between registries (admin only)
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorityRegistryId
 *               - entityId
 *               - action
 *               - resource
 *             properties:
 *               authorityRegistryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the authority registry
 *               entityId:
 *                 type: string
 *                 description: DID of the entity being recognized
 *               action:
 *                 type: string
 *                 description: Action scope (govern, recognize)
 *               resource:
 *                 type: string
 *                 description: Resource scope
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Recognition created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Recognition already exists
 */
export async function createRecognition(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { authorityRegistryId, entityId, action, resource, validFrom, validUntil, metadata } = req.body;

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
        metadata: metadata || null,
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
 * @swagger
 * /v2/recognitions:
 *   get:
 *     summary: List all recognitions
 *     description: Retrieve recognitions with filtering (admin only)
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: authorityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of recognitions
 */
export async function listRecognitions(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      authorityId,
      entityId,
      action,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Record<string, unknown> = {};
    if (authorityId) where.authorityId = authorityId;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;

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
 * @swagger
 * /v2/recognitions/{id}:
 *   get:
 *     summary: Get recognition by ID
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recognition details
 *       404:
 *         description: Not found
 */
export async function getRecognition(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
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
 * @swagger
 * /v2/recognitions/{id}:
 *   delete:
 *     summary: Revoke a recognition
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recognition revoked
 *       404:
 *         description: Not found
 */
export async function deleteRecognition(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
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
