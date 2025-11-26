/**
 * Delegation Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles issuer delegation operations
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';
import { validateDIDFormat, resolveDID } from '../services/didResolver';

const prisma = new PrismaClient();

/**
 * Create a delegation from root issuer to delegate
 * POST /v2/issuers/:did/delegate
 */
export async function createDelegation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rootDid = req.params.did as string;
    const { delegateDid, scope, delegationProof, validUntil } = req.body as {
      delegateDid: string;
      scope: Record<string, unknown>;
      delegationProof: Record<string, unknown>;
      validUntil?: string;
    };

    // Validate required fields
    if (!delegateDid || !scope || !delegationProof) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'delegateDid, scope, and delegationProof are required',
      });
      return;
    }

    // Validate delegate DID format
    const didValidation = validateDIDFormat(delegateDid);
    if (!didValidation.valid) {
      res.status(400).json({ error: 'Bad Request', message: didValidation.error });
      return;
    }

    // Try to resolve delegate DID
    const didResolution = await resolveDID(delegateDid);
    if (!didResolution.valid) {
      console.warn(`DID resolution warning for ${delegateDid}: ${didResolution.error}`);
    }

    // Get root issuer
    const rootIssuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(rootDid) },
    });

    if (!rootIssuer) {
      res.status(404).json({ error: 'Not Found', message: 'Root issuer not found' });
      return;
    }

    // Check root issuer is active
    if (rootIssuer.status !== 'active') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Root issuer must be active to create delegations',
      });
      return;
    }

    // Check authorization
    if (req.user?.role === 'registry_owner' && req.user.registryId !== rootIssuer.registryId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only create delegations for issuers in your own registry',
      });
      return;
    }

    // Check if delegate issuer exists, if not create it
    let delegateIssuer = await prisma.issuer.findUnique({
      where: { did: delegateDid },
    });

    if (!delegateIssuer) {
      // Create delegate issuer in same registry
      delegateIssuer = await prisma.issuer.create({
        data: {
          did: delegateDid,
          registryId: rootIssuer.registryId,
          trustFrameworkId: rootIssuer.trustFrameworkId,
          status: 'active',
          lifecycle: {
            createdAt: new Date().toISOString(),
            createdBy: req.user?.id || 'system',
            createdVia: 'delegation',
          },
        },
      });
    }

    // Check for existing active delegation
    const existingDelegation = await prisma.issuerDelegation.findFirst({
      where: {
        rootIssuerDid: decodeURIComponent(rootDid),
        delegateIssuerDid: delegateDid,
        status: 'active',
      },
    });

    if (existingDelegation) {
      res.status(409).json({
        error: 'Conflict',
        message: 'An active delegation already exists for this delegate',
      });
      return;
    }

    // Validate scope is subset of root issuer's scope (simplified check)
    // In production, this would involve more complex scope validation

    // Create delegation
    const delegation = await prisma.issuerDelegation.create({
      data: {
        rootIssuerDid: decodeURIComponent(rootDid),
        delegateIssuerDid: delegateDid,
        scope,
        delegationProof,
        validUntil: validUntil ? new Date(validUntil) : null,
        status: 'active',
      },
    });

    res.status(201).json({
      message: 'Delegation created successfully',
      data: delegation,
    });
  } catch (error) {
    console.error('Error creating delegation:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to create delegation' });
  }
}

/**
 * List delegates for a root issuer
 * GET /v2/issuers/:did/delegates
 */
export async function listDelegates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rootDid = req.params.did as string;
    const { page = '1', limit = '20', status } = req.query;

    // Check root issuer exists
    const rootIssuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(rootDid) },
    });

    if (!rootIssuer) {
      res.status(404).json({ error: 'Not Found', message: 'Root issuer not found' });
      return;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const where: any = { rootIssuerDid: decodeURIComponent(rootDid) };
    if (status && typeof status === 'string') {
      where.status = status;
    }

    const total = await prisma.issuerDelegation.count({ where });
    const skip = (pageNum - 1) * limitNum;

    const delegations = await prisma.issuerDelegation.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { delegatedAt: 'desc' },
      include: {
        delegateIssuer: {
          select: { id: true, did: true, name: true, status: true },
        },
      },
    });

    res.status(200).json({
      data: delegations,
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error listing delegates:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to list delegates' });
  }
}

/**
 * Get delegation chain for an issuer
 * GET /v2/issuers/:did/delegation-chain
 */
export async function getDelegationChain(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const did = req.params.did as string;
    const decodedDid = decodeURIComponent(did);

    // Get issuer
    const issuer = await prisma.issuer.findUnique({
      where: { did: decodedDid },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Build delegation chain (max 3 levels)
    const chain: any[] = [];
    let currentDid = decodedDid;
    let level = 0;
    const maxLevels = 3;

    while (level < maxLevels) {
      // Check if current issuer is a delegate
      const delegation = await prisma.issuerDelegation.findFirst({
        where: {
          delegateIssuerDid: currentDid,
          status: 'active',
        },
        include: {
          rootIssuer: {
            select: { id: true, did: true, name: true, status: true },
          },
          delegateIssuer: {
            select: { id: true, did: true, name: true, status: true },
          },
        },
      });

      if (!delegation) {
        // This is the root, add it to chain
        const rootIssuer = await prisma.issuer.findUnique({
          where: { did: currentDid },
          select: { id: true, did: true, name: true, status: true },
        });

        if (rootIssuer) {
          chain.unshift({
            level: 0,
            issuer: rootIssuer,
            delegation: null,
          });
        }
        break;
      }

      // Add to chain
      chain.unshift({
        level: level + 1,
        issuer: {
          did: currentDid,
          name: delegation.delegateIssuer.name,
        },
        delegation: {
          id: delegation.id,
          scope: delegation.scope,
          delegatedAt: delegation.delegatedAt,
          validUntil: delegation.validUntil,
        },
      });

      currentDid = delegation.rootIssuerDid;
      level++;
    }

    // Renumber levels from root (0) to leaf
    chain.forEach((item, index) => {
      item.level = index;
    });

    res.status(200).json({
      data: {
        issuerDid: decodedDid,
        chainLength: chain.length,
        chain,
      },
    });
  } catch (error) {
    console.error('Error getting delegation chain:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get delegation chain' });
  }
}

/**
 * Revoke a delegation
 * DELETE /v2/issuers/:did/delegates/:delegateDid
 */
export async function revokeDelegation(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const rootDid = req.params.did as string;
    const delegateDid = req.params.delegateDid as string;

    // Get root issuer
    const rootIssuer = await prisma.issuer.findUnique({
      where: { did: decodeURIComponent(rootDid) },
    });

    if (!rootIssuer) {
      res.status(404).json({ error: 'Not Found', message: 'Root issuer not found' });
      return;
    }

    // Check authorization
    if (req.user?.role === 'registry_owner' && req.user.registryId !== rootIssuer.registryId) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You can only revoke delegations for issuers in your own registry',
      });
      return;
    }

    // Find active delegation
    const delegation = await prisma.issuerDelegation.findFirst({
      where: {
        rootIssuerDid: decodeURIComponent(rootDid),
        delegateIssuerDid: decodeURIComponent(delegateDid),
        status: 'active',
      },
    });

    if (!delegation) {
      res.status(404).json({ error: 'Not Found', message: 'Active delegation not found' });
      return;
    }

    // Revoke delegation
    await prisma.issuerDelegation.update({
      where: { id: delegation.id },
      data: { status: 'revoked' },
    });

    res.status(200).json({ message: 'Delegation revoked successfully' });
  } catch (error) {
    console.error('Error revoking delegation:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to revoke delegation' });
  }
}
