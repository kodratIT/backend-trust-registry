/**
 * TRQP Service
 * ToIP Trust Registry v2 Backend
 *
 * Service layer for TRQP v2 protocol operations
 */

import { PrismaClient } from '@prisma/client';
import {
  TRQPAuthorizationRequest,
  TRQPAuthorizationResponse,
  TRQPRecognitionRequest,
  TRQPRecognitionResponse,
  mapActionToEntityType,
  TRQP_ACTIONS,
} from '../schemas/trqpSchemas';
// Error classes available for future use
// import { NotFoundError, ValidationError } from '../errors/trqpErrors';

const prisma = new PrismaClient();

// ============================================
// Authorization Query
// ============================================

/**
 * Process TRQP Authorization Query
 */
export async function processAuthorizationQuery(
  request: TRQPAuthorizationRequest
): Promise<TRQPAuthorizationResponse> {
  const startTime = new Date();

  // Lookup authority (registry) by ecosystemDid
  const registry = await prisma.trustRegistry.findFirst({
    where: { ecosystemDid: request.authority_id },
  });

  if (!registry) {
    return buildAuthorizationResponse(request, false, startTime, 
      `Authority '${request.authority_id}' not found`);
  }

  // Map action to entity type
  const entityType = mapActionToEntityType(request.action);
  
  if (!entityType) {
    // For unknown actions, return not authorized
    return buildAuthorizationResponse(request, false, startTime,
      `Unknown action '${request.action}'`);
  }

  // Build validity date filter
  const validAt = request.context?.time ? new Date(request.context.time) : new Date();
  const validityFilter = {
    OR: [
      { validFrom: null, validUntil: null },
      { validFrom: { lte: validAt }, validUntil: null },
      { validFrom: null, validUntil: { gte: validAt } },
      { validFrom: { lte: validAt }, validUntil: { gte: validAt } },
    ],
  };


  // Query based on entity type
  if (entityType === 'issuer') {
    const issuer = await prisma.issuer.findFirst({
      where: {
        did: request.entity_id,
        registryId: registry.id,
        status: 'active',
        ...validityFilter,
        credentialTypes: {
          some: {
            schema: {
              type: { contains: request.resource, mode: 'insensitive' },
            },
          },
        },
      },
      include: {
        credentialTypes: {
          include: {
            schema: { select: { type: true } },
          },
        },
      },
    });

    if (issuer) {
      return buildAuthorizationResponse(request, true, startTime,
        `${request.entity_id} is authorized for ${request.action}+${request.resource} by ${request.authority_id}`);
    }

    // Check if issuer exists but not authorized for this resource
    const issuerExists = await prisma.issuer.findFirst({
      where: { did: request.entity_id, registryId: registry.id },
    });

    if (issuerExists) {
      return buildAuthorizationResponse(request, false, startTime,
        `${request.entity_id} is NOT authorized for ${request.action}+${request.resource}`);
    }

    return buildAuthorizationResponse(request, false, startTime,
      `Entity '${request.entity_id}' not found in registry`);
  }

  // Verifier query
  if (entityType === 'verifier') {
    const verifier = await prisma.verifier.findFirst({
      where: {
        did: request.entity_id,
        registryId: registry.id,
        status: 'active',
        ...validityFilter,
        credentialTypes: {
          some: {
            schema: {
              type: { contains: request.resource, mode: 'insensitive' },
            },
          },
        },
      },
    });

    if (verifier) {
      return buildAuthorizationResponse(request, true, startTime,
        `${request.entity_id} is authorized for ${request.action}+${request.resource} by ${request.authority_id}`);
    }

    const verifierExists = await prisma.verifier.findFirst({
      where: { did: request.entity_id, registryId: registry.id },
    });

    if (verifierExists) {
      return buildAuthorizationResponse(request, false, startTime,
        `${request.entity_id} is NOT authorized for ${request.action}+${request.resource}`);
    }

    return buildAuthorizationResponse(request, false, startTime,
      `Entity '${request.entity_id}' not found in registry`);
  }

  return buildAuthorizationResponse(request, false, startTime,
    `Unsupported action '${request.action}'`);
}

/**
 * Build Authorization Response
 */
function buildAuthorizationResponse(
  request: TRQPAuthorizationRequest,
  authorized: boolean,
  _startTime: Date,
  message: string
): TRQPAuthorizationResponse {
  return {
    entity_id: request.entity_id,
    authority_id: request.authority_id,
    action: request.action,
    resource: request.resource,
    authorized,
    time_requested: request.context?.time,
    time_evaluated: new Date().toISOString(),
    message,
    context: request.context,
  };
}

// ============================================
// Recognition Query (Placeholder for Sprint 2)
// ============================================

/**
 * Process TRQP Recognition Query
 * Note: Full implementation in Sprint 2 after Recognition model is created
 */
export function processRecognitionQuery(
  request: TRQPRecognitionRequest
): TRQPRecognitionResponse {
  // For now, return not recognized since Recognition model doesn't exist yet
  return {
    entity_id: request.entity_id,
    authority_id: request.authority_id,
    action: request.action,
    resource: request.resource,
    recognized: false,
    time_requested: request.context?.time,
    time_evaluated: new Date().toISOString(),
    message: 'Recognition queries will be available after Sprint 2 implementation',
    context: request.context,
  };
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate authority exists
 */
export async function validateAuthority(authorityId: string): Promise<boolean> {
  const registry = await prisma.trustRegistry.findFirst({
    where: { ecosystemDid: authorityId },
  });
  return registry !== null;
}

/**
 * Get supported actions
 */
export function getSupportedActions(): string[] {
  return Object.values(TRQP_ACTIONS);
}
