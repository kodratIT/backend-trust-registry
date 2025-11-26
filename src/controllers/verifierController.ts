/**
 * Verifier Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles verifier CRUD operations
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

const VALID_STATUSES = ['pending', 'active', 'suspended', 'revoked'];
const VALID_ACCREDITATION_LEVELS = ['high', 'medium', 'low'];

/**
 * Create/Register a new verifier
 * POST /v2/verifiers
 */
export async function createVerifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      did, name, registryId, trustFrameworkId, status, jurisdictions, contexts,
      accreditationLevel, accreditationDetails, validFrom, validUntil, endpoint, metadata, credentialTypes,
    } = req.body;

    if (!did || !registryId) {
      res.status(400).json({ error: 'Bad Request', message: 'did and registryId are required' });
      return;
    }

    const didValidation = validateDIDFormat(did);
    if (!didValidation.valid) {
      res.status(400).json({ error: 'Bad Request', message: didValidation.error });
      return;
    }

    const didResolution = await resolveDID(did);
    if (!didResolution.valid) {
      console.warn(`DID resolution warning for ${did}: ${didResolution.error}`);
    }

    const registry = await prisma.trustRegistry.findUnique({ where: { id: registryId } });
    if (!registry) {
      res.status(404).json({ error: 'Not Found', message: 'Trust registry not found' });
      return;
    }

    if (req.user?.role === 'registry_owner' && req.user.registryId !== registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only create verifiers in your own registry' });
      return;
    }

    const existingVerifier = await prisma.verifier.findUnique({ where: { did } });
    if (existingVerifier) {
      res.status(409).json({ error: 'Conflict', message: 'A verifier with this DID already exists' });
      return;
    }

    if (trustFrameworkId) {
      const tf = await prisma.trustFramework.findUnique({ where: { id: trustFrameworkId } });
      if (!tf) {
        res.status(400).json({ error: 'Bad Request', message: 'Trust framework not found' });
        return;
      }
    }

    if (accreditationLevel && !VALID_ACCREDITATION_LEVELS.includes(accreditationLevel)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid accreditationLevel. Must be one of: ${VALID_ACCREDITATION_LEVELS.join(', ')}`,
      });
      return;
    }

    const verifier = await prisma.verifier.create({
      data: {
        did, name, registryId, trustFrameworkId,
        status: status || 'pending',
        jurisdictions: jurisdictions || null,
        contexts: contexts || null,
        accreditationLevel,
        accreditationDetails: accreditationDetails || null,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        endpoint, metadata: metadata || null,
        lifecycle: { createdAt: new Date().toISOString(), createdBy: req.user?.id || 'system' },
      },
      include: {
        registry: { select: { id: true, name: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
      },
    });

    if (credentialTypes && Array.isArray(credentialTypes) && credentialTypes.length > 0) {
      await prisma.verifierCredentialType.createMany({
        data: credentialTypes.map((schemaId: string) => ({ verifierId: verifier.id, schemaId })),
        skipDuplicates: true,
      });
    }

    await prisma.statusHistory.create({
      data: {
        entityType: 'verifier', entityId: verifier.id, status: verifier.status,
        previousStatus: null, reason: 'Initial registration', changedBy: req.user?.id || 'system',
      },
    });

    res.status(201).json({ message: 'Verifier registered successfully', data: verifier });
  } catch (error) {
    console.error('Error creating verifier:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create verifier' });
  }
}

/**
 * List all verifiers
 * GET /v2/verifiers
 */
export async function listVerifiers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '10', registryId, trustFrameworkId, status, jurisdiction, accreditationLevel, did } = req.query;

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

    const where: any = {};
    if (registryId && typeof registryId === 'string') {where.registryId = registryId;}
    if (trustFrameworkId && typeof trustFrameworkId === 'string') {where.trustFrameworkId = trustFrameworkId;}
    if (status && typeof status === 'string') {where.status = status;}
    if (accreditationLevel && typeof accreditationLevel === 'string') {where.accreditationLevel = accreditationLevel;}
    if (did && typeof did === 'string') {where.did = { contains: did, mode: 'insensitive' };}
    if (jurisdiction && typeof jurisdiction === 'string') {where.jurisdictions = { array_contains: [{ code: jurisdiction }] };}

    const total = await prisma.verifier.count({ where });
    const skip = (pageNum - 1) * limitNum;

    const verifiers = await prisma.verifier.findMany({
      where, skip, take: limitNum, orderBy: { createdAt: 'desc' },
      include: {
        registry: { select: { id: true, name: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: { include: { schema: { select: { id: true, name: true, type: true, version: true } } } },
      },
    });

    res.status(200).json({ data: verifiers, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } });
  } catch (error) {
    console.error('Error listing verifiers:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list verifiers' });
  }
}

/**
 * Get verifier by DID
 * GET /v2/verifiers/:did
 */
export async function getVerifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;

    const verifier = await prisma.verifier.findUnique({
      where: { did: decodeURIComponent(did) },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: { include: { schema: { select: { id: true, name: true, type: true, version: true, jsonSchema: true } } } },
        statusHistory: { orderBy: { timestamp: 'desc' }, take: 10 },
      },
    });

    if (!verifier) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    res.status(200).json({ data: verifier });
  } catch (error) {
    console.error('Error getting verifier:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get verifier' });
  }
}


/**
 * Update verifier
 * PUT /v2/verifiers/:did
 */
export async function updateVerifier(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { name, trustFrameworkId, jurisdictions, contexts, accreditationLevel, accreditationDetails, validFrom, validUntil, endpoint, metadata } = req.body;

    const existing = await prisma.verifier.findUnique({ where: { did: decodeURIComponent(did) } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    if (req.user?.role === 'registry_owner' && req.user.registryId !== existing.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only update verifiers in your own registry' });
      return;
    }

    if (trustFrameworkId) {
      const tf = await prisma.trustFramework.findUnique({ where: { id: trustFrameworkId } });
      if (!tf) {
        res.status(400).json({ error: 'Bad Request', message: 'Trust framework not found' });
        return;
      }
    }

    if (accreditationLevel && !VALID_ACCREDITATION_LEVELS.includes(accreditationLevel)) {
      res.status(400).json({ error: 'Bad Request', message: `Invalid accreditationLevel. Must be one of: ${VALID_ACCREDITATION_LEVELS.join(', ')}` });
      return;
    }

    const verifier = await prisma.verifier.update({
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
      include: { registry: { select: { id: true, name: true } }, trustFramework: { select: { id: true, name: true, version: true } } },
    });

    res.status(200).json({ message: 'Verifier updated successfully', data: verifier });
  } catch (error) {
    console.error('Error updating verifier:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update verifier' });
  }
}

/**
 * Update verifier status
 * PATCH /v2/verifiers/:did/status
 */
export async function updateVerifierStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { status, reason, statusDetails } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Bad Request', message: 'status is required' });
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Bad Request', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const existing = await prisma.verifier.findUnique({ where: { did: decodeURIComponent(did) } });
    if (!existing) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    if (req.user?.role === 'registry_owner' && req.user.registryId !== existing.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only update verifiers in your own registry' });
      return;
    }

    const validTransitions: Record<string, string[]> = {
      pending: ['active', 'revoked'],
      active: ['suspended', 'revoked'],
      suspended: ['active', 'revoked'],
      revoked: [],
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      res.status(400).json({ error: 'Bad Request', message: `Invalid status transition from '${existing.status}' to '${status}'` });
      return;
    }

    const verifier = await prisma.verifier.update({
      where: { did: decodeURIComponent(did) },
      data: { status, statusDetails: statusDetails || null },
      include: { registry: { select: { id: true, name: true } } },
    });

    await prisma.statusHistory.create({
      data: { entityType: 'verifier', entityId: verifier.id, status, previousStatus: existing.status, reason: reason || null, changedBy: req.user?.id || 'system' },
    });

    res.status(200).json({ message: 'Verifier status updated successfully', data: verifier });
  } catch (error) {
    console.error('Error updating verifier status:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update verifier status' });
  }
}

/**
 * Add credential type to verifier
 * POST /v2/verifiers/:did/credential-types
 */
export async function addVerifierCredentialType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const { schemaId } = req.body as { schemaId: string };

    if (!schemaId) {
      res.status(400).json({ error: 'Bad Request', message: 'schemaId is required' });
      return;
    }

    const verifier = await prisma.verifier.findUnique({ where: { did: decodeURIComponent(did) } });
    if (!verifier) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    if (req.user?.role === 'registry_owner' && req.user.registryId !== verifier.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only modify verifiers in your own registry' });
      return;
    }

    const schema = await prisma.credentialSchema.findUnique({ where: { id: schemaId } });
    if (!schema) {
      res.status(404).json({ error: 'Not Found', message: 'Credential schema not found' });
      return;
    }

    const existing = await prisma.verifierCredentialType.findUnique({
      where: { verifierId_schemaId: { verifierId: verifier.id, schemaId } },
    });
    if (existing) {
      res.status(409).json({ error: 'Conflict', message: 'Credential type already linked to verifier' });
      return;
    }

    await prisma.verifierCredentialType.create({ data: { verifierId: verifier.id, schemaId } });
    res.status(201).json({ message: 'Credential type added to verifier successfully' });
  } catch (error) {
    console.error('Error adding credential type:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to add credential type' });
  }
}

/**
 * Remove credential type from verifier
 * DELETE /v2/verifiers/:did/credential-types/:schemaId
 */
export async function removeVerifierCredentialType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const schemaId = req.params.schemaId as string;

    const verifier = await prisma.verifier.findUnique({ where: { did: decodeURIComponent(did) } });
    if (!verifier) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    if (req.user?.role === 'registry_owner' && req.user.registryId !== verifier.registryId) {
      res.status(403).json({ error: 'Forbidden', message: 'You can only modify verifiers in your own registry' });
      return;
    }

    const link = await prisma.verifierCredentialType.findUnique({
      where: { verifierId_schemaId: { verifierId: verifier.id, schemaId } },
    });
    if (!link) {
      res.status(404).json({ error: 'Not Found', message: 'Credential type not linked to verifier' });
      return;
    }

    await prisma.verifierCredentialType.delete({ where: { verifierId_schemaId: { verifierId: verifier.id, schemaId } } });
    res.status(200).json({ message: 'Credential type removed from verifier successfully' });
  } catch (error) {
    console.error('Error removing credential type:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to remove credential type' });
  }
}
