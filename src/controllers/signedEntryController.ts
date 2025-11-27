/**
 * Signed Entry Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles signed registry entry endpoints
 */

/* eslint-disable no-console */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';
import {
  signEntry,
  verifyEntry,
  initializeRegistryKey,
  getRegistryPublicKey,
  createRegistryDidDocument,
  SignedEntry,
} from '../services/signatureService';

const prisma = new PrismaClient();

// Initialize registry key on module load
initializeRegistryKey().catch(console.error);

/**
 * Get signed issuer entry
 * GET /v2/issuers/:did/entry
 */
export async function getSignedIssuerEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { did } = req.params;

    const issuer = await prisma.issuer.findUnique({
      where: { did },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: { schema: { select: { id: true, name: true, type: true, version: true } } },
        },
      },
    });

    if (!issuer) {
      res.status(404).json({ error: 'Not Found', message: 'Issuer not found' });
      return;
    }

    // Build entry data
    const entryData = {
      '@context': ['https://w3id.org/trp/v1'],
      type: 'TrustRegistryEntry',
      entityType: 'issuer',
      did: issuer.did,
      name: issuer.name,
      status: issuer.status,
      jurisdictions: issuer.jurisdictions,
      contexts: issuer.contexts,
      accreditationLevel: issuer.accreditationLevel,
      validFrom: issuer.validFrom?.toISOString(),
      validUntil: issuer.validUntil?.toISOString(),
      credentialTypes: issuer.credentialTypes.map((ct) => ct.schema.type),
      registry: {
        id: issuer.registry.id,
        name: issuer.registry.name,
        ecosystemDid: issuer.registry.ecosystemDid,
      },
      trustFramework: issuer.trustFramework
        ? {
            id: issuer.trustFramework.id,
            name: issuer.trustFramework.name,
            version: issuer.trustFramework.version,
          }
        : null,
      timestamp: new Date().toISOString(),
    };

    // Sign the entry
    const registryDid = issuer.registry.ecosystemDid;
    const signedEntry = await signEntry(entryData, registryDid);

    res.status(200).json({ data: signedEntry });
  } catch (error) {
    console.error('Error getting signed issuer entry:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get signed entry' });
  }
}

/**
 * Verify issuer entry signature
 * POST /v2/issuers/:did/entry/verify
 */
export async function verifyIssuerEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const signedEntry = req.body as SignedEntry;

    if (!signedEntry || !signedEntry.entry || !signedEntry.proof) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid signed entry format. Must include entry and proof.',
      });
      return;
    }

    const result = await verifyEntry(signedEntry);

    res.status(200).json({
      data: {
        valid: result.valid,
        error: result.error,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error verifying issuer entry:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to verify entry' });
  }
}

/**
 * Get signed verifier entry
 * GET /v2/verifiers/:did/entry
 */
export async function getSignedVerifierEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { did } = req.params;

    const verifier = await prisma.verifier.findUnique({
      where: { did },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: { schema: { select: { id: true, name: true, type: true, version: true } } },
        },
      },
    });

    if (!verifier) {
      res.status(404).json({ error: 'Not Found', message: 'Verifier not found' });
      return;
    }

    // Build entry data
    const entryData = {
      '@context': ['https://w3id.org/trp/v1'],
      type: 'TrustRegistryEntry',
      entityType: 'verifier',
      did: verifier.did,
      name: verifier.name,
      status: verifier.status,
      jurisdictions: verifier.jurisdictions,
      contexts: verifier.contexts,
      accreditationLevel: verifier.accreditationLevel,
      validFrom: verifier.validFrom?.toISOString(),
      validUntil: verifier.validUntil?.toISOString(),
      credentialTypes: verifier.credentialTypes.map((ct) => ct.schema.type),
      registry: {
        id: verifier.registry.id,
        name: verifier.registry.name,
        ecosystemDid: verifier.registry.ecosystemDid,
      },
      trustFramework: verifier.trustFramework
        ? {
            id: verifier.trustFramework.id,
            name: verifier.trustFramework.name,
            version: verifier.trustFramework.version,
          }
        : null,
      timestamp: new Date().toISOString(),
    };

    // Sign the entry
    const registryDid = verifier.registry.ecosystemDid;
    const signedEntry = await signEntry(entryData, registryDid);

    res.status(200).json({ data: signedEntry });
  } catch (error) {
    console.error('Error getting signed verifier entry:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get signed entry' });
  }
}

/**
 * Verify verifier entry signature
 * POST /v2/verifiers/:did/entry/verify
 */
export async function verifyVerifierEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const signedEntry = req.body as SignedEntry;

    if (!signedEntry || !signedEntry.entry || !signedEntry.proof) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid signed entry format. Must include entry and proof.',
      });
      return;
    }

    const result = await verifyEntry(signedEntry);

    res.status(200).json({
      data: {
        valid: result.valid,
        error: result.error,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error verifying verifier entry:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to verify entry' });
  }
}

/**
 * Get registry DID document with public key
 * GET /v2/registry/did
 */
export async function getRegistryDidDocument(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { registryId } = req.query;

    let registryDid = 'did:web:registry.example.com'; // Default

    if (registryId) {
      const registry = await prisma.trustRegistry.findUnique({
        where: { id: registryId as string },
        select: { ecosystemDid: true },
      });

      if (registry) {
        registryDid = registry.ecosystemDid;
      }
    }

    const publicKey = getRegistryPublicKey();
    if (!publicKey) {
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Registry keys not initialized',
      });
      return;
    }

    const didDocument = createRegistryDidDocument(registryDid);

    res.status(200).json({ data: didDocument });
  } catch (error) {
    console.error('Error getting registry DID document:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get DID document',
    });
  }
}
