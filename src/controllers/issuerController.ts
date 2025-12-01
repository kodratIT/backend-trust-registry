/**
 * Issuer Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles issuer CRUD operations
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';
import { validateDIDFormat, resolveDID } from '../services/didResolver';

const prisma = new PrismaClient();

// Valid status values
const VALID_STATUSES = ['pending', 'active', 'suspended', 'revoked'];
const VALID_ACCREDITATION_LEVELS = ['high', 'medium', 'low'];

/**
 * Create/Register a new issuer
 * POST /v2/issuers
 * Admin or registry owner only
 */
export async function createIssuer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      did,
      name,
      registryId,
      trustFrameworkId,
      status,
      jurisdictions,
      contexts,
      accreditationLevel,
      accreditationDetails,
      validFrom,
      validUntil,
      endpoint,
      metadata,
      credentialTypes,
    } = req.body;

    // Validate required fields
    if (!did || !registryId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'did and registryId are required',
      });
      return;
    }

    // Validate DID format
    const didValidation = validateDIDFormat(did);
    if (!didValidation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: didValidation.error,
      });
      return;
    }

    // Try to resolve DID
    const didResolution = await resolveDID(did);
    if (!didResolution.valid) {
      console.warn(`DID resolution warning for ${did}: ${didResolution.error}`);
    }

    // Check if registry exists
    const registry = await prisma.trustRegistry.findUnique({
      where: { id: registryId },
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
      if (req.user.registryId !== registryId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only create issuers in your own registry',
        });
        return;
      }
    }

    // Check if issuer DID already exists
    const existingIssuer = await prisma.issuer.findUnique({
      where: { did },
    });

    if (existingIssuer) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An issuer with this DID already exists',
      });
      return;
    }

    // Validate trust framework if provided
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

    // Validate accreditation level if provided
    if (accreditationLevel && !VALID_ACCREDITATION_LEVELS.includes(accreditationLevel)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid accreditationLevel. Must be one of: ${VALID_ACCREDITATION_LEVELS.join(', ')}`,
      });
      return;
    }

    // Create issuer
    const issuer = await prisma.issuer.create({
      data: {
        did,
        name,
        registryId,
        trustFrameworkId,
        status: status || 'pending',
        jurisdictions: jurisdictions || null,
        contexts: contexts || null,
        accreditationLevel,
        accreditationDetails: accreditationDetails || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        endpoint,
        metadata: metadata || null,
        lifecycle: {
          createdAt: new Date().toISOString(),
          createdBy: req.user?.id || 'system',
        },
      },
      include: {
        registry: { select: { id: true, name: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
      },
    });

    // Link credential types if provided
    if (credentialTypes && Array.isArray(credentialTypes) && credentialTypes.length > 0) {
      await prisma.issuerCredentialType.createMany({
        data: credentialTypes.map((schemaId: string) => ({
          issuerId: issuer.id,
          schemaId,
        })),
        skipDuplicates: true,
      });
    }

    // Create initial status history
    await prisma.statusHistory.create({
      data: {
        entityType: 'issuer',
        entityId: issuer.id,
        issuerId: issuer.id,
        status: issuer.status,
        previousStatus: null,
        reason: 'Initial registration',
        changedBy: req.user?.id || 'system',
      },
    });

    res.status(201).json({
      message: 'Issuer registered successfully',
      data: issuer,
    });
  } catch (error) {
    console.error('Error creating issuer:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create issuer',
    });
  }
}


/**
 * List all issuers with pagination and filtering
 * GET /v2/issuers
 * Public access
 */
export async function listIssuers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      registryId,
      trustFrameworkId,
      status,
      jurisdiction,
      context,
      accreditationLevel,
      did,
    } = req.query;

    // Parse pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid page number' });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid limit. Must be between 1 and 100' });
      return;
    }

    // Build where clause
    const where: any = {};

    if (registryId && typeof registryId === 'string') {
      where.registryId = registryId;
    }

    if (trustFrameworkId && typeof trustFrameworkId === 'string') {
      where.trustFrameworkId = trustFrameworkId;
    }

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (accreditationLevel && typeof accreditationLevel === 'string') {
      where.accreditationLevel = accreditationLevel;
    }

    if (did && typeof did === 'string') {
      where.did = { contains: did, mode: 'insensitive' };
    }

    // Jurisdiction filtering (JSON array contains)
    if (jurisdiction && typeof jurisdiction === 'string') {
      where.jurisdictions = { array_contains: [{ code: jurisdiction }] };
    }

    // Context filtering
    if (context && typeof context === 'string') {
      where.contexts = { array_contains: [context] };
    }

    const total = await prisma.issuer.count({ where });
    const skip = (pageNum - 1) * limitNum;

    const issuers = await prisma.issuer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        registry: { select: { id: true, name: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: {
            schema: { select: { id: true, name: true, type: true, version: true } },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      data: issuers,
      meta: { total, page: pageNum, limit: limitNum, totalPages },
    });
  } catch (error) {
    console.error('Error listing issuers:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list issuers' });
  }
}

/**
 * Get issuer by DID
 * GET /v2/issuers/:did
 * Public access
 */
export async function getIssuer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;

    const issuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: {
            schema: { select: { id: true, name: true, type: true, version: true, jsonSchema: true } },
          },
        },
        statusHistory: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
        delegationsAsRoot: {
          where: { status: 'active' },
          select: { id: true, delegateIssuerDid: true, scope: true, delegatedAt: true },
        },
        delegationsAsDelegate: {
          where: { status: 'active' },
          select: { id: true, rootIssuerDid: true, scope: true, delegatedAt: true },
        },
      },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    res.status(200).json({ data: issuer });
  } catch (error) {
    console.error('Error getting issuer:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get issuer' });
  }
}

/**
 * Update issuer
 * PUT /v2/issuers/:did
 * Admin or registry owner only
 */
export async function updateIssuer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const {
      name,
      trustFrameworkId,
      jurisdictions,
      contexts,
      accreditationLevel,
      accreditationDetails,
      validFrom,
      validUntil,
      endpoint,
      metadata,
    } = req.body;

    const existing = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== existing.registryId) {
        res.status(403).json({ error: 'Forbidden', message: 'You can only update issuers in your own registry' });
        return;
      }
    }

    // Validate trust framework if provided
    if (trustFrameworkId) {
      const tf = await prisma.trustFramework.findUnique({ where: { id: trustFrameworkId } });
      if (!tf) {
        res.status(400).json({ error: 'Bad Request', message: 'Trust framework not found' });
        return;
      }
    }

    // Validate accreditation level
    if (accreditationLevel && !VALID_ACCREDITATION_LEVELS.includes(accreditationLevel)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid accreditationLevel. Must be one of: ${VALID_ACCREDITATION_LEVELS.join(', ')}`,
      });
      return;
    }

    const issuer = await prisma.issuer.update({
      where: { did: decodeURIComponent(did) },
      data: {
        ...(name !== undefined && { name }),
        ...(trustFrameworkId !== undefined && { trustFrameworkId }),
        ...(jurisdictions !== undefined && { jurisdictions }),
        ...(contexts !== undefined && { contexts }),
        ...(accreditationLevel !== undefined && { accreditationLevel }),
        ...(accreditationDetails !== undefined && { accreditationDetails }),
        ...(validFrom !== undefined && { validFrom: validFrom ? new Date(validFrom) : null }),
        ...(validUntil !== undefined && { validUntil: validUntil ? new Date(validUntil) : null }),
        ...(endpoint !== undefined && { endpoint }),
        ...(metadata !== undefined && { metadata }),
      },
      include: {
        registry: { select: { id: true, name: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
      },
    });

    res.status(200).json({ message: 'Issuer updated successfully', data: issuer });
  } catch (error) {
    console.error('Error updating issuer:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update issuer' });
  }
}


/**
 * Update issuer status
 * PATCH /v2/issuers/:did/status
 * Admin or registry owner only
 */
export async function updateIssuerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { status, reason, statusDetails } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Bad Request', message: 'status is required' });
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
      return;
    }

    const existing = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== existing.registryId) {
        res.status(403).json({ error: 'Forbidden', message: 'You can only update issuers in your own registry' });
        return;
      }
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['active', 'revoked'],
      active: ['suspended', 'revoked'],
      suspended: ['active', 'revoked'],
      revoked: [], // Terminal state
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid status transition from '${existing.status}' to '${status}'`,
      });
      return;
    }

    // Update issuer status
    const issuer = await prisma.issuer.update({
      where: { did: decodeURIComponent(did) },
      data: {
        status,
        statusDetails: statusDetails || null,
      },
      include: {
        registry: { select: { id: true, name: true } },
      },
    });

    // Create status history entry
    await prisma.statusHistory.create({
      data: {
        entityType: 'issuer',
        entityId: issuer.id,
        issuerId: issuer.id,
        status,
        previousStatus: existing.status,
        reason: reason || null,
        changedBy: req.user?.id || 'system',
      },
    });

    res.status(200).json({ message: 'Issuer status updated successfully', data: issuer });
  } catch (error) {
    console.error('Error updating issuer status:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update issuer status' });
  }
}

/**
 * Get issuer status history
 * GET /v2/issuers/:did/status-history
 * Public access
 */
export async function getIssuerStatusHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { page = '1', limit = '20' } = req.query;

    const issuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
      select: { id: true },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const total = await prisma.statusHistory.count({
      where: { entityType: 'issuer', entityId: issuer.id },
    });

    const history = await prisma.statusHistory.findMany({
      where: { entityType: 'issuer', entityId: issuer.id },
      orderBy: { timestamp: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    });

    res.status(200).json({
      data: history,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error getting issuer status history:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get status history' });
  }
}

/**
 * Add credential type to issuer
 * POST /v2/issuers/:did/credential-types
 * Admin or registry owner only
 */
export async function addCredentialType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { schemaId } = req.body as { schemaId: string };

    if (!schemaId) {
      res.status(400).json({ error: 'Bad Request', message: 'schemaId is required' });
      return;
    }

    const issuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Check authorization
    if (req.user?.role === 'registry_owner' && req.user.registryId !== issuer.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only modify issuers in your own registry' });
      return;
    }

    // Check schema exists
    const schema = await prisma.credentialSchema.findUnique({ where: { id: schemaId } });
    if (!schema) {
      res.status(404).json({ error: 'Not Found', message: 'Credential schema not found' });
      return;
    }

    // Check if already linked
    const existing = await prisma.issuerCredentialType.findUnique({
      where: { issuerId_schemaId: { issuerId: issuer.id, schemaId } },
    });

    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Credential type already linked to issuer' });
      return;
    }

    await prisma.issuerCredentialType.create({
      data: { issuerId: issuer.id, schemaId },
    });

    res.status(201).json({ message: 'Credential type added to issuer successfully' });
  } catch (error) {
    console.error('Error adding credential type:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add credential type' });
  }
}

/**
 * Remove credential type from issuer
 * DELETE /v2/issuers/:did/credential-types/:schemaId
 * Admin or registry owner only
 */
export async function removeCredentialType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const schemaId = req.params.schemaId as string;

    const issuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(did) },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Check authorization
    if (req.user?.role === 'registry_owner' && req.user.registryId !== issuer.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only modify issuers in your own registry' });
      return;
    }

    const link = await prisma.issuerCredentialType.findUnique({
      where: { issuerId_schemaId: { issuerId: issuer.id, schemaId } },
    });

    if (!link) {
      res.status(404).json({ error: 'Not Found', message: 'Credential type not linked to issuer' });
      return;
    }

    await prisma.issuerCredentialType.delete({
      where: { issuerId_schemaId: { issuerId: issuer.id, schemaId } },
    });

    res.status(200).json({ message: 'Credential type removed from issuer successfully' });
  } catch (error) {
    console.error('Error removing credential type:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to remove credential type' });
  }
}
