/**
 * Public Routes - Trusted List Endpoints
 * No authentication required
 * Similar to EU Trusted List (EUTL)
 * 
 * Security considerations:
 * - Read-only endpoints (GET only)
 * - No sensitive data exposed (only public registry info)
 * - Rate limited (configured in main app)
 * - Pagination to prevent large data dumps
 * - Cache headers for performance
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const router = Router();
const prisma = new PrismaClient();

// Rate limiter for public endpoints - more restrictive
const publicRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all public routes
router.use(publicRateLimiter);

// Cache control middleware
const cacheControl = (maxAge: number) => (_req: Request, res: Response, next: Function) => {
  res.set('Cache-Control', `public, max-age=${maxAge}`);
  next();
};

// Max items per request (prevent large data dumps)
const MAX_ITEMS = 100;

/**
 * @swagger
 * /v2/public/registries:
 *   get:
 *     summary: Get list of all trusted registries
 *     description: Public endpoint to get all active registries (like EU Trusted List)
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, all]
 *           default: active
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of trusted registries
 */
router.get('/registries', cacheControl(300), async (_req: Request, res: Response) => {
  try {
    const { status = 'active' } = _req.query;
    
    const where = status === 'all' ? {} : { status: 'active' };
    
    const registries = await prisma.trustRegistry.findMany({
      where,
      include: {
        trustFramework: {
          select: {
            id: true,
            name: true,
            version: true,
          }
        },
        _count: {
          select: {
            issuers: true,
            verifiers: true,
            credentialSchemas: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      timestamp: new Date().toISOString(),
      count: registries.length,
      registries: registries.map(r => ({
        id: r.id,
        name: r.name,
        did: r.ecosystemDid,
        description: r.description,
        status: r.status,
        governanceAuthority: r.governanceAuthority,
        trustFramework: r.trustFramework,
        stats: {
          issuers: r._count.issuers,
          verifiers: r._count.verifiers,
          schemas: r._count.credentialSchemas,
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching registries:', error);
    res.status(500).json({ error: 'Failed to fetch registries' });
  }
});

/**
 * @swagger
 * /v2/public/issuers:
 *   get:
 *     summary: Get list of all trusted issuers
 *     description: Public endpoint to get all active issuers across all registries
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *         description: Filter by registry ID
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *         description: Filter by credential type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, all]
 *           default: active
 *     responses:
 *       200:
 *         description: List of trusted issuers
 */
router.get('/issuers', cacheControl(300), async (req: Request, res: Response) => {
  try {
    const { registryId, credentialType, status = 'active', page = '1', limit = '50' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(MAX_ITEMS, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    if (status !== 'all') where.status = 'active';
    if (registryId) where.registryId = registryId;
    
    if (credentialType) {
      where.credentialTypes = {
        some: {
          schema: {
            type: credentialType as string
          }
        }
      };
    }

    const issuers = await prisma.issuer.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
          }
        },
        credentialTypes: {
          include: {
            schema: {
              select: {
                id: true,
                name: true,
                type: true,
                version: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      timestamp: new Date().toISOString(),
      count: issuers.length,
      issuers: issuers.map(i => ({
        id: i.id,
        did: i.did,
        name: i.name,
        status: i.status,
        endpoint: i.endpoint,
        validFrom: i.validFrom,
        validUntil: i.validUntil,
        registry: {
          id: i.registry.id,
          name: i.registry.name,
          did: i.registry.ecosystemDid,
        },
        credentialTypes: i.credentialTypes.map(ct => ({
          id: ct.schema.id,
          name: ct.schema.name,
          type: ct.schema.type,
          version: ct.schema.version,
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching issuers:', error);
    res.status(500).json({ error: 'Failed to fetch issuers' });
  }
});

/**
 * @swagger
 * /v2/public/verifiers:
 *   get:
 *     summary: Get list of all trusted verifiers
 *     description: Public endpoint to get all active verifiers
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, all]
 *           default: active
 *     responses:
 *       200:
 *         description: List of trusted verifiers
 */
router.get('/verifiers', cacheControl(300), async (req: Request, res: Response) => {
  try {
    const { registryId, credentialType, status = 'active', page = '1', limit = '50' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(MAX_ITEMS, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    if (status !== 'all') where.status = 'active';
    if (registryId) where.registryId = registryId;
    
    if (credentialType) {
      where.credentialTypes = {
        some: {
          schema: {
            type: credentialType as string
          }
        }
      };
    }

    const verifiers = await prisma.verifier.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
          }
        },
        credentialTypes: {
          include: {
            schema: {
              select: {
                id: true,
                name: true,
                type: true,
                version: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      timestamp: new Date().toISOString(),
      count: verifiers.length,
      verifiers: verifiers.map(v => ({
        id: v.id,
        did: v.did,
        name: v.name,
        status: v.status,
        endpoint: v.endpoint,
        validFrom: v.validFrom,
        validUntil: v.validUntil,
        registry: {
          id: v.registry.id,
          name: v.registry.name,
          did: v.registry.ecosystemDid,
        },
        credentialTypes: v.credentialTypes.map(ct => ({
          id: ct.schema.id,
          name: ct.schema.name,
          type: ct.schema.type,
          version: ct.schema.version,
        }))
      }))
    });
  } catch (error) {
    console.error('Error fetching verifiers:', error);
    res.status(500).json({ error: 'Failed to fetch verifiers' });
  }
});

/**
 * @swagger
 * /v2/public/schemas:
 *   get:
 *     summary: Get list of all credential schemas
 *     description: Public endpoint to get all credential schemas
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of credential schemas
 */
router.get('/schemas', cacheControl(300), async (req: Request, res: Response) => {
  try {
    const { registryId, page = '1', limit = '50' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(MAX_ITEMS, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};
    if (registryId) where.registryId = registryId;

    const schemas = await prisma.credentialSchema.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
          }
        },
        _count: {
          select: {
            issuerSchemas: true,
            verifierSchemas: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      timestamp: new Date().toISOString(),
      count: schemas.length,
      schemas: schemas.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        version: s.version,
        issuerMode: s.issuerMode,
        verifierMode: s.verifierMode,
        registry: {
          id: s.registry.id,
          name: s.registry.name,
          did: s.registry.ecosystemDid,
        },
        stats: {
          issuers: s._count.issuerSchemas,
          verifiers: s._count.verifierSchemas,
        }
      }))
    });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});

/**
 * @swagger
 * /v2/public/lookup/issuer/{did}:
 *   get:
 *     summary: Lookup issuer by DID
 *     description: Quick lookup to check if an issuer DID is trusted
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: Issuer DID (URL encoded)
 *     responses:
 *       200:
 *         description: Issuer found
 *       404:
 *         description: Issuer not found
 */
router.get('/lookup/issuer/:did', cacheControl(60), async (req: Request, res: Response): Promise<void> => {
  try {
    const did = decodeURIComponent(req.params.did || '');
    
    const issuer = await prisma.issuer.findUnique({
      where: { did },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
            status: true,
          }
        },
        credentialTypes: {
          include: {
            schema: {
              select: {
                type: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!issuer) {
      res.status(404).json({
        found: false,
        did,
        message: 'Issuer not found in any trusted registry'
      });
      return;
    }

    const now = new Date();
    const isValid = issuer.status === 'active' &&
      issuer.registry.status === 'active' &&
      (!issuer.validFrom || new Date(issuer.validFrom) <= now) &&
      (!issuer.validUntil || new Date(issuer.validUntil) >= now);

    res.json({
      found: true,
      trusted: isValid,
      issuer: {
        did: issuer.did,
        name: issuer.name,
        status: issuer.status,
        endpoint: issuer.endpoint,
        validFrom: issuer.validFrom,
        validUntil: issuer.validUntil,
        registry: {
          name: issuer.registry.name,
          did: issuer.registry.ecosystemDid,
          status: issuer.registry.status,
        },
        credentialTypes: issuer.credentialTypes.map(ct => ct.schema.type)
      }
    });
  } catch (error) {
    console.error('Error looking up issuer:', error);
    res.status(500).json({ error: 'Failed to lookup issuer' });
  }
});

/**
 * @swagger
 * /v2/public/lookup/verifier/{did}:
 *   get:
 *     summary: Lookup verifier by DID
 *     description: Quick lookup to check if a verifier DID is trusted
 *     tags: [Public - Trusted List]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verifier found
 *       404:
 *         description: Verifier not found
 */
router.get('/lookup/verifier/:did', cacheControl(60), async (req: Request, res: Response): Promise<void> => {
  try {
    const did = decodeURIComponent(req.params.did || '');
    
    const verifier = await prisma.verifier.findUnique({
      where: { did },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
            status: true,
          }
        },
        credentialTypes: {
          include: {
            schema: {
              select: {
                type: true,
                name: true,
              }
            }
          }
        }
      }
    });

    if (!verifier) {
      res.status(404).json({
        found: false,
        did,
        message: 'Verifier not found in any trusted registry'
      });
      return;
    }

    const now = new Date();
    const isValid = verifier.status === 'active' &&
      verifier.registry.status === 'active' &&
      (!verifier.validFrom || new Date(verifier.validFrom) <= now) &&
      (!verifier.validUntil || new Date(verifier.validUntil) >= now);

    res.json({
      found: true,
      trusted: isValid,
      verifier: {
        did: verifier.did,
        name: verifier.name,
        status: verifier.status,
        endpoint: verifier.endpoint,
        validFrom: verifier.validFrom,
        validUntil: verifier.validUntil,
        registry: {
          name: verifier.registry.name,
          did: verifier.registry.ecosystemDid,
          status: verifier.registry.status,
        },
        credentialTypes: verifier.credentialTypes.map(ct => ct.schema.type)
      }
    });
  } catch (error) {
    console.error('Error looking up verifier:', error);
    res.status(500).json({ error: 'Failed to lookup verifier' });
  }
});

export default router;
