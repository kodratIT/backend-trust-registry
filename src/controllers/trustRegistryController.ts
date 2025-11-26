/**
 * Trust Registry Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles trust registry CRUD operations
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new trust registry
 * POST /v2/registries
 * Admin only
 */
export async function createTrustRegistry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, description, trustFrameworkId, ecosystemDid, governanceAuthority, status } =
      req.body;

    // Validate required fields
    if (!name || !ecosystemDid) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and ecosystemDid are required',
      });
      return;
    }

    // Validate trust framework exists if provided
    if (trustFrameworkId) {
      const trustFramework = await prisma.trustFramework.findUnique({
        where: { id: trustFrameworkId },
      });

      if (!trustFramework) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Trust framework not found',
        });
        return;
      }
    }

    // Check if ecosystemDid already exists
    const existingRegistry = await prisma.trustRegistry.findFirst({
      where: { ecosystemDid },
    });

    if (existingRegistry) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A registry with this ecosystemDid already exists',
      });
      return;
    }

    // Create trust registry
    const trustRegistry = await prisma.trustRegistry.create({
      data: {
        name,
        description,
        trustFrameworkId,
        ecosystemDid,
        governanceAuthority,
        status: status || 'active',
      },
      include: {
        trustFramework: true,
      },
    });

    res.status(201).json({
      message: 'Trust registry created successfully',
      data: trustRegistry,
    });
  } catch (error) {
    console.error('Error creating trust registry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create trust registry',
    });
  }
}

/**
 * List all trust registries with pagination and filtering
 * GET /v2/registries
 * Public access
 */
export async function listTrustRegistries(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '10', status, trustFrameworkId, ecosystemDid } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid page number',
      });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid limit. Must be between 1 and 100',
      });
      return;
    }

    // Build where clause
    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (trustFrameworkId && typeof trustFrameworkId === 'string') {
      where.trustFrameworkId = trustFrameworkId;
    }

    if (ecosystemDid && typeof ecosystemDid === 'string') {
      where.ecosystemDid = {
        contains: ecosystemDid,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.trustRegistry.count({ where });

    // Get paginated results
    const skip = (pageNum - 1) * limitNum;
    const trustRegistries = await prisma.trustRegistry.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        trustFramework: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data: trustRegistries,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing trust registries:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list trust registries',
    });
  }
}

/**
 * Get a single trust registry by ID
 * GET /v2/registries/:id
 * Public access
 */
export async function getTrustRegistry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const trustRegistry = await prisma.trustRegistry.findUnique({
      where: { id },
      include: {
        trustFramework: true,
        credentialSchemas: true,
        issuers: {
          select: {
            id: true,
            did: true,
            name: true,
            status: true,
          },
        },
        verifiers: {
          select: {
            id: true,
            did: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!trustRegistry) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
      return;
    }

    res.status(200).json({
      data: trustRegistry,
    });
  } catch (error) {
    console.error('Error getting trust registry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get trust registry',
    });
  }
}

/**
 * Update a trust registry
 * PUT /v2/registries/:id
 * Admin or registry owner only
 */
export async function updateTrustRegistry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description, trustFrameworkId, governanceAuthority, status } = req.body;

    // Check if trust registry exists
    const existing = await prisma.trustRegistry.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own registry',
        });
        return;
      }
    }

    // Validate trust framework exists if provided
    if (trustFrameworkId) {
      const trustFramework = await prisma.trustFramework.findUnique({
        where: { id: trustFrameworkId },
      });

      if (!trustFramework) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Trust framework not found',
        });
        return;
      }
    }

    // Update trust registry
    const trustRegistry = await prisma.trustRegistry.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(trustFrameworkId !== undefined && { trustFrameworkId }),
        ...(governanceAuthority !== undefined && { governanceAuthority }),
        ...(status && { status }),
      },
      include: {
        trustFramework: true,
      },
    });

    res.status(200).json({
      message: 'Trust registry updated successfully',
      data: trustRegistry,
    });
  } catch (error) {
    console.error('Error updating trust registry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update trust registry',
    });
  }
}

/**
 * Link a trust registry to a trust framework
 * PATCH /v2/registries/:id/trust-framework
 * Admin or registry owner only
 */
export async function linkTrustFramework(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { trustFrameworkId } = req.body;

    // Validate trustFrameworkId is provided
    if (!trustFrameworkId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'trustFrameworkId is required',
      });
      return;
    }

    // Check if trust registry exists
    const registry = await prisma.trustRegistry.findUnique({
      where: { id },
    });

    if (!registry) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own registry',
        });
        return;
      }
    }

    // Check if trust framework exists
    const trustFramework = await prisma.trustFramework.findUnique({
      where: { id: trustFrameworkId },
    });

    if (!trustFramework) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust framework not found',
      });
      return;
    }

    // Check if trust framework is active
    if (trustFramework.status !== 'active') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot link to inactive or deprecated trust framework',
      });
      return;
    }

    // Update trust registry with trust framework link
    const updatedRegistry = await prisma.trustRegistry.update({
      where: { id },
      data: {
        trustFrameworkId,
      },
      include: {
        trustFramework: true,
      },
    });

    res.status(200).json({
      message: 'Trust registry linked to trust framework successfully',
      data: updatedRegistry,
    });
  } catch (error) {
    console.error('Error linking trust framework:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to link trust framework',
    });
  }
}

/**
 * Unlink a trust registry from its trust framework
 * DELETE /v2/registries/:id/trust-framework
 * Admin or registry owner only
 */
export async function unlinkTrustFramework(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    // Check if trust registry exists
    const registry = await prisma.trustRegistry.findUnique({
      where: { id },
      include: {
        trustFramework: true,
      },
    });

    if (!registry) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== id) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own registry',
        });
        return;
      }
    }

    // Check if registry is linked to a trust framework
    if (!registry.trustFrameworkId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Trust registry is not linked to any trust framework',
      });
      return;
    }

    // Update trust registry to remove trust framework link
    const updatedRegistry = await prisma.trustRegistry.update({
      where: { id },
      data: {
        trustFrameworkId: null,
      },
    });

    res.status(200).json({
      message: 'Trust registry unlinked from trust framework successfully',
      data: updatedRegistry,
    });
  } catch (error) {
    console.error('Error unlinking trust framework:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unlink trust framework',
    });
  }
}
