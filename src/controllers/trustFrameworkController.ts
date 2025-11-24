/**
 * Trust Framework Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles trust framework CRUD operations
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
 * Create a new trust framework
 * POST /v2/trust-frameworks
 * Admin only
 */
export async function createTrustFramework(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      name,
      version,
      description,
      governanceFrameworkUrl,
      legalAgreements,
      jurisdictions,
      contexts,
      status,
    } = req.body;

    // Validate required fields
    if (!name || !version) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and version are required',
      });
      return;
    }

    // Create trust framework
    const trustFramework = await prisma.trustFramework.create({
      data: {
        name,
        version,
        description,
        governanceFrameworkUrl,
        legalAgreements,
        jurisdictions,
        contexts,
        status: status || 'active',
      },
    });

    res.status(201).json({
      message: 'Trust framework created successfully',
      data: trustFramework,
    });
  } catch (error) {
    console.error('Error creating trust framework:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create trust framework',
    });
  }
}

/**
 * List all trust frameworks with pagination and filtering
 * GET /v2/trust-frameworks
 * Public access
 */
export async function listTrustFrameworks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '10', status, jurisdiction } = req.query;

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

    if (jurisdiction && typeof jurisdiction === 'string') {
      where.jurisdictions = {
        path: '$',
        array_contains: jurisdiction,
      };
    }

    // Get total count
    const total = await prisma.trustFramework.count({ where });

    // Get paginated results
    const skip = (pageNum - 1) * limitNum;
    const trustFrameworks = await prisma.trustFramework.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data: trustFrameworks,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing trust frameworks:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list trust frameworks',
    });
  }
}

/**
 * Get a single trust framework by ID
 * GET /v2/trust-frameworks/:id
 * Public access
 */
export async function getTrustFramework(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const trustFramework = await prisma.trustFramework.findUnique({
      where: { id },
      include: {
        trustRegistries: true,
        credentialSchemas: true,
      },
    });

    if (!trustFramework) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust framework not found',
      });
      return;
    }

    res.status(200).json({
      data: trustFramework,
    });
  } catch (error) {
    console.error('Error getting trust framework:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get trust framework',
    });
  }
}

/**
 * Update a trust framework
 * PUT /v2/trust-frameworks/:id
 * Admin only
 */
export async function updateTrustFramework(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      version,
      description,
      governanceFrameworkUrl,
      legalAgreements,
      jurisdictions,
      contexts,
      status,
    } = req.body;

    // Check if trust framework exists
    const existing = await prisma.trustFramework.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Trust framework not found',
      });
      return;
    }

    // Update trust framework
    const trustFramework = await prisma.trustFramework.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(version && { version }),
        ...(description !== undefined && { description }),
        ...(governanceFrameworkUrl !== undefined && { governanceFrameworkUrl }),
        ...(legalAgreements !== undefined && { legalAgreements }),
        ...(jurisdictions !== undefined && { jurisdictions }),
        ...(contexts !== undefined && { contexts }),
        ...(status && { status }),
      },
    });

    res.status(200).json({
      message: 'Trust framework updated successfully',
      data: trustFramework,
    });
  } catch (error) {
    console.error('Error updating trust framework:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update trust framework',
    });
  }
}
