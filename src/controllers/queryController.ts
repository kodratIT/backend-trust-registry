/**
 * Query Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles trust resolution queries for issuers and verifiers
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Query types
type EntityType = 'issuer' | 'verifier';

interface QueryParams {
  entityType: EntityType;
  did?: string;
  credentialType?: string;
  registryId?: string;
  trustFrameworkId?: string;
  jurisdiction?: string;
  context?: string;
  status?: string;
  accreditationLevel?: string;
  validAt?: string; // ISO date string
}

interface QueryResult {
  found: boolean;
  entityType: EntityType;
  entity?: any;
  registry?: any;
  trustFramework?: any;
  credentialTypes?: any[];
  validAt?: string;
  queryTime?: number;
}

interface BatchQueryResult {
  results: QueryResult[];
  totalQueries: number;
  successCount: number;
  failureCount: number;
  totalTime: number;
}

/**
 * Build where clause for issuer/verifier queries
 */
function buildWhereClause(params: QueryParams): any {
  const where: any = {};

  if (params.did) {
    where.did = params.did;
  }

  if (params.registryId) {
    where.registryId = params.registryId;
  }

  if (params.trustFrameworkId) {
    where.trustFrameworkId = params.trustFrameworkId;
  }

  if (params.status) {
    where.status = params.status;
  } else {
    // Default: only return active entities
    where.status = 'active';
  }

  if (params.accreditationLevel) {
    where.accreditationLevel = params.accreditationLevel;
  }

  // Jurisdiction filtering (JSON array contains)
  if (params.jurisdiction) {
    where.jurisdictions = {
      path: '$[*].code',
      array_contains: params.jurisdiction,
    };
  }

  // Context filtering
  if (params.context) {
    where.contexts = {
      array_contains: params.context,
    };
  }

  // Validity date check
  if (params.validAt) {
    const validAtDate = new Date(params.validAt);
    where.OR = [
      { validFrom: null, validUntil: null },
      { validFrom: { lte: validAtDate }, validUntil: null },
      { validFrom: null, validUntil: { gte: validAtDate } },
      { validFrom: { lte: validAtDate }, validUntil: { gte: validAtDate } },
    ];
  }

  return where;
}

/**
 * Execute a single query
 */
async function executeQuery(params: QueryParams): Promise<QueryResult> {
  const startTime = Date.now();
  const where = buildWhereClause(params);

  try {
    let entity: any = null;

    if (params.entityType === 'issuer') {
      // Query issuer
      const queryOptions: any = {
        where,
        include: {
          registry: {
            select: { id: true, name: true, ecosystemDid: true, status: true },
          },
          trustFramework: {
            select: { id: true, name: true, version: true, status: true },
          },
          credentialTypes: {
            include: {
              schema: {
                select: { id: true, name: true, type: true, version: true },
              },
            },
          },
        },
      };

      // If credential type filter, add join condition
      if (params.credentialType) {
        queryOptions.where.credentialTypes = {
          some: {
            schema: {
              type: { contains: params.credentialType, mode: 'insensitive' },
            },
          },
        };
      }

      entity = await prisma.issuer.findFirst(queryOptions);
    } else {
      // Query verifier
      const queryOptions: any = {
        where,
        include: {
          registry: {
            select: { id: true, name: true, ecosystemDid: true, status: true },
          },
          trustFramework: {
            select: { id: true, name: true, version: true, status: true },
          },
          credentialTypes: {
            include: {
              schema: {
                select: { id: true, name: true, type: true, version: true },
              },
            },
          },
        },
      };

      if (params.credentialType) {
        queryOptions.where.credentialTypes = {
          some: {
            schema: {
              type: { contains: params.credentialType, mode: 'insensitive' },
            },
          },
        };
      }

      entity = await prisma.verifier.findFirst(queryOptions);
    }

    const queryTime = Date.now() - startTime;

    if (!entity) {
      return {
        found: false,
        entityType: params.entityType,
        queryTime,
      };
    }

    return {
      found: true,
      entityType: params.entityType,
      entity: {
        did: entity.did,
        name: entity.name,
        status: entity.status,
        jurisdictions: entity.jurisdictions,
        contexts: entity.contexts,
        accreditationLevel: entity.accreditationLevel,
        validFrom: entity.validFrom,
        validUntil: entity.validUntil,
        endpoint: entity.endpoint,
      },
      registry: entity.registry,
      trustFramework: entity.trustFramework,
      credentialTypes: entity.credentialTypes?.map((ct: any) => ct.schema) || [],
      validAt: params.validAt || new Date().toISOString(),
      queryTime,
    };
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      found: false,
      entityType: params.entityType,
      queryTime: Date.now() - startTime,
    };
  }
}


/**
 * Single Query - Trust Resolution
 * POST /v2/query
 * Public access
 */
export async function singleQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      entityType,
      did,
      credentialType,
      registryId,
      trustFrameworkId,
      jurisdiction,
      context,
      status,
      accreditationLevel,
      validAt,
    } = req.body as QueryParams;

    // Validate entityType
    if (!entityType || !['issuer', 'verifier'].includes(entityType)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'entityType is required and must be "issuer" or "verifier"',
      });
      return;
    }

    // At least one filter must be provided
    if (!did && !credentialType && !registryId && !trustFrameworkId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'At least one filter (did, credentialType, registryId, or trustFrameworkId) is required',
      });
      return;
    }

    const result = await executeQuery({
      entityType,
      did,
      credentialType,
      registryId,
      trustFrameworkId,
      jurisdiction,
      context,
      status,
      accreditationLevel,
      validAt,
    });

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    console.error('Error in single query:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to execute query',
    });
  }
}

/**
 * Batch Query - Multiple Trust Resolutions
 * POST /v2/query/batch
 * Public access
 */
export async function batchQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { queries } = req.body as { queries: QueryParams[] };

    // Validate queries array
    if (!queries || !Array.isArray(queries)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'queries array is required',
      });
      return;
    }

    // Limit batch size
    if (queries.length > 100) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Maximum 100 queries per batch',
      });
      return;
    }

    if (queries.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'At least one query is required',
      });
      return;
    }

    // Validate each query
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i] as QueryParams | undefined;
      if (!q || !q.entityType || !['issuer', 'verifier'].includes(q.entityType)) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Query ${i}: entityType is required and must be "issuer" or "verifier"`,
        });
        return;
      }
    }

    const startTime = Date.now();

    // Execute all queries in parallel
    const results = await Promise.all(queries.map((q) => executeQuery(q)));

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.found).length;

    const batchResult: BatchQueryResult = {
      results,
      totalQueries: queries.length,
      successCount,
      failureCount: queries.length - successCount,
      totalTime,
    };

    res.status(200).json({
      data: batchResult,
    });
  } catch (error) {
    console.error('Error in batch query:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to execute batch query',
    });
  }
}

/**
 * Query Issuers - Convenience endpoint
 * GET /v2/query/issuers
 * Public access
 */
export async function queryIssuers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      did,
      credentialType,
      registryId,
      trustFrameworkId,
      jurisdiction,
      context,
      status,
      accreditationLevel,
      validAt,
      page = '1',
      limit = '10',
    } = req.query;

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

    const where = buildWhereClause({
      entityType: 'issuer',
      did: did as string,
      credentialType: credentialType as string,
      registryId: registryId as string,
      trustFrameworkId: trustFrameworkId as string,
      jurisdiction: jurisdiction as string,
      context: context as string,
      status: status as string,
      accreditationLevel: accreditationLevel as string,
      validAt: validAt as string,
    });

    // Add credential type filter if provided
    if (credentialType) {
      where.credentialTypes = {
        some: {
          schema: {
            type: { contains: credentialType as string, mode: 'insensitive' },
          },
        },
      };
    }

    const total = await prisma.issuer.count({ where });
    const skip = (pageNum - 1) * limitNum;

    const issuers = await prisma.issuer.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: { schema: { select: { id: true, name: true, type: true, version: true } } },
        },
      },
    });

    res.status(200).json({
      data: issuers.map((issuer) => ({
        did: issuer.did,
        name: issuer.name,
        status: issuer.status,
        jurisdictions: issuer.jurisdictions,
        contexts: issuer.contexts,
        accreditationLevel: issuer.accreditationLevel,
        validFrom: issuer.validFrom,
        validUntil: issuer.validUntil,
        registry: issuer.registry,
        trustFramework: issuer.trustFramework,
        credentialTypes: issuer.credentialTypes.map((ct) => ct.schema),
      })),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error querying issuers:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to query issuers' });
  }
}

/**
 * Query Verifiers - Convenience endpoint
 * GET /v2/query/verifiers
 * Public access
 */
export async function queryVerifiers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      did,
      credentialType,
      registryId,
      trustFrameworkId,
      jurisdiction,
      context,
      status,
      accreditationLevel,
      validAt,
      page = '1',
      limit = '10',
    } = req.query;

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

    const where = buildWhereClause({
      entityType: 'verifier',
      did: did as string,
      credentialType: credentialType as string,
      registryId: registryId as string,
      trustFrameworkId: trustFrameworkId as string,
      jurisdiction: jurisdiction as string,
      context: context as string,
      status: status as string,
      accreditationLevel: accreditationLevel as string,
      validAt: validAt as string,
    });

    if (credentialType) {
      where.credentialTypes = {
        some: {
          schema: {
            type: { contains: credentialType as string, mode: 'insensitive' },
          },
        },
      };
    }

    const total = await prisma.verifier.count({ where });
    const skip = (pageNum - 1) * limitNum;

    const verifiers = await prisma.verifier.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        registry: { select: { id: true, name: true, ecosystemDid: true } },
        trustFramework: { select: { id: true, name: true, version: true } },
        credentialTypes: {
          include: { schema: { select: { id: true, name: true, type: true, version: true } } },
        },
      },
    });

    res.status(200).json({
      data: verifiers.map((verifier) => ({
        did: verifier.did,
        name: verifier.name,
        status: verifier.status,
        jurisdictions: verifier.jurisdictions,
        contexts: verifier.contexts,
        accreditationLevel: verifier.accreditationLevel,
        validFrom: verifier.validFrom,
        validUntil: verifier.validUntil,
        registry: verifier.registry,
        trustFramework: verifier.trustFramework,
        credentialTypes: verifier.credentialTypes.map((ct) => ct.schema),
      })),
      meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error querying verifiers:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to query verifiers' });
  }
}
