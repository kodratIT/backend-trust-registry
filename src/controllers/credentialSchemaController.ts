/**
 * Credential Schema Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles credential schema CRUD operations
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { PrismaClient } from '@prisma/client';
import Ajv2020 from 'ajv/dist/2020';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const prisma = new PrismaClient();

// AJV instance for draft-07 (default)
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// AJV instance for draft 2020-12
const ajv2020 = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv2020);

// Valid modes for issuer and verifier
const VALID_MODES = ['OPEN', 'ECOSYSTEM', 'GRANTOR'];

/**
 * Validate JSON Schema structure
 * Supports both draft-07 and draft 2020-12
 */
function validateJsonSchema(schema: any): { valid: boolean; error?: string } {
  try {
    if (!schema || typeof schema !== 'object') {
      return { valid: false, error: 'JSON Schema must be an object' };
    }

    // Check for required JSON Schema properties
    if (!schema.type && !schema.$ref && !schema.oneOf && !schema.anyOf && !schema.allOf) {
      return { valid: false, error: 'JSON Schema must have a type, $ref, or composition keyword' };
    }

    // Determine which AJV instance to use based on $schema
    const schemaVersion = schema.$schema || '';
    
    if (schemaVersion.includes('2020-12') || schemaVersion.includes('2019-09')) {
      // Use AJV 2020 for newer drafts
      ajv2020.compile(schema);
    } else {
      // Use standard AJV for draft-07 and older
      ajv.compile(schema);
    }
    
    return { valid: true };
  } catch (error: any) {
    return { valid: false, error: `Invalid JSON Schema: ${error.message}` };
  }
}

/**
 * Create a new credential schema
 * POST /v2/schemas
 * Admin or registry owner only
 */
export async function createCredentialSchema(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      registryId,
      trustFrameworkId,
      name,
      version,
      type,
      jsonSchema,
      contexts,
      jurisdictions,
      issuerMode,
      verifierMode,
    } = req.body;


    // Validate required fields
    if (!registryId || !name || !version || !type || !jsonSchema || !issuerMode || !verifierMode) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'registryId, name, version, type, jsonSchema, issuerMode, and verifierMode are required',
      });
      return;
    }

    // Validate modes
    if (!VALID_MODES.includes(issuerMode)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid issuerMode. Must be one of: ${VALID_MODES.join(', ')}`,
      });
      return;
    }

    if (!VALID_MODES.includes(verifierMode)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid verifierMode. Must be one of: ${VALID_MODES.join(', ')}`,
      });
      return;
    }

    // Validate JSON Schema
    const schemaValidation = validateJsonSchema(jsonSchema);
    if (!schemaValidation.valid) {
      res.status(400).json({
        error: 'Bad Request',
        message: schemaValidation.error,
      });
      return;
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
          message: 'You can only create schemas in your own registry',
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

    // Check for duplicate schema (same name, version, type in registry)
    const existingSchema = await prisma.credentialSchema.findFirst({
      where: {
        registryId,
        name,
        version,
        type,
      },
    });

    if (existingSchema) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A schema with this name, version, and type already exists in this registry',
      });
      return;
    }

    // Create credential schema
    const credentialSchema = await prisma.credentialSchema.create({
      data: {
        registryId,
        trustFrameworkId,
        name,
        version,
        type,
        jsonSchema,
        contexts: contexts || null,
        jurisdictions: jurisdictions || null,
        issuerMode,
        verifierMode,
      },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
          },
        },
        trustFramework: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Credential schema created successfully',
      data: credentialSchema,
    });
  } catch (error) {
    console.error('Error creating credential schema:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create credential schema',
    });
  }
}

/**
 * List all credential schemas with pagination and filtering
 * GET /v2/schemas
 * Public access
 */
export async function listCredentialSchemas(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      registryId,
      trustFrameworkId,
      type,
      issuerMode,
      verifierMode,
      name,
    } = req.query;

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

    if (registryId && typeof registryId === 'string') {
      where.registryId = registryId;
    }

    if (trustFrameworkId && typeof trustFrameworkId === 'string') {
      where.trustFrameworkId = trustFrameworkId;
    }

    if (type && typeof type === 'string') {
      where.type = {
        contains: type,
        mode: 'insensitive',
      };
    }

    if (issuerMode && typeof issuerMode === 'string') {
      where.issuerMode = issuerMode;
    }

    if (verifierMode && typeof verifierMode === 'string') {
      where.verifierMode = verifierMode;
    }

    if (name && typeof name === 'string') {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    // Get total count
    const total = await prisma.credentialSchema.count({ where });

    // Get paginated results
    const skip = (pageNum - 1) * limitNum;
    const credentialSchemas = await prisma.credentialSchema.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
          },
        },
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
      data: credentialSchemas,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error listing credential schemas:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to list credential schemas',
    });
  }
}


/**
 * Get a single credential schema by ID
 * GET /v2/schemas/:id
 * Public access
 */
export async function getCredentialSchema(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const credentialSchema = await prisma.credentialSchema.findUnique({
      where: { id },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
            ecosystemDid: true,
          },
        },
        trustFramework: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
        issuerSchemas: {
          include: {
            issuer: {
              select: {
                id: true,
                did: true,
                name: true,
                status: true,
              },
            },
          },
        },
        verifierSchemas: {
          include: {
            verifier: {
              select: {
                id: true,
                did: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!credentialSchema) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Credential schema not found',
      });
      return;
    }

    res.status(200).json({
      data: credentialSchema,
    });
  } catch (error) {
    console.error('Error getting credential schema:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get credential schema',
    });
  }
}

/**
 * Update a credential schema (creates new version)
 * PUT /v2/schemas/:id
 * Admin or registry owner only
 */
export async function updateCredentialSchema(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      version,
      type,
      jsonSchema,
      contexts,
      jurisdictions,
      issuerMode,
      verifierMode,
      trustFrameworkId,
    } = req.body;

    // Check if credential schema exists
    const existing = await prisma.credentialSchema.findUnique({
      where: { id },
      include: {
        registry: true,
      },
    });

    if (!existing) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Credential schema not found',
      });
      return;
    }

    // Check authorization for registry_owner
    if (req.user?.role === 'registry_owner') {
      if (req.user.registryId !== existing.registryId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update schemas in your own registry',
        });
        return;
      }
    }

    // Validate modes if provided
    if (issuerMode && !VALID_MODES.includes(issuerMode)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid issuerMode. Must be one of: ${VALID_MODES.join(', ')}`,
      });
      return;
    }

    if (verifierMode && !VALID_MODES.includes(verifierMode)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid verifierMode. Must be one of: ${VALID_MODES.join(', ')}`,
      });
      return;
    }

    // Validate JSON Schema if provided
    if (jsonSchema) {
      const schemaValidation = validateJsonSchema(jsonSchema);
      if (!schemaValidation.valid) {
        res.status(400).json({
          error: 'Bad Request',
          message: schemaValidation.error,
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

    // Check for version conflict if version is being updated
    if (version && version !== existing.version) {
      const versionConflict = await prisma.credentialSchema.findFirst({
        where: {
          registryId: existing.registryId,
          name: name || existing.name,
          version,
          type: type || existing.type,
          id: { not: id },
        },
      });

      if (versionConflict) {
        res.status(409).json({
          error: 'Conflict',
          message: 'A schema with this name, version, and type already exists in this registry',
        });
        return;
      }
    }

    // Update credential schema
    const credentialSchema = await prisma.credentialSchema.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(version && { version }),
        ...(type && { type }),
        ...(jsonSchema && { jsonSchema }),
        ...(contexts !== undefined && { contexts }),
        ...(jurisdictions !== undefined && { jurisdictions }),
        ...(issuerMode && { issuerMode }),
        ...(verifierMode && { verifierMode }),
        ...(trustFrameworkId !== undefined && { trustFrameworkId }),
      },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
          },
        },
        trustFramework: {
          select: {
            id: true,
            name: true,
            version: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Credential schema updated successfully',
      data: credentialSchema,
    });
  } catch (error) {
    console.error('Error updating credential schema:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update credential schema',
    });
  }
}

/**
 * Link a credential schema to a trust registry
 * PATCH /v2/schemas/:id/registry
 * Admin or registry owner only
 */
export async function linkSchemaToRegistry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { registryId } = req.body;

    if (!registryId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'registryId is required',
      });
      return;
    }

    // Check if schema exists
    const schema = await prisma.credentialSchema.findUnique({
      where: { id },
    });

    if (!schema) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Credential schema not found',
      });
      return;
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
          message: 'You can only link schemas to your own registry',
        });
        return;
      }
    }

    // Update schema with new registry
    const updatedSchema = await prisma.credentialSchema.update({
      where: { id },
      data: { registryId },
      include: {
        registry: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Credential schema linked to registry successfully',
      data: updatedSchema,
    });
  } catch (error) {
    console.error('Error linking schema to registry:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to link schema to registry',
    });
  }
}

/**
 * Delete a credential schema
 * DELETE /v2/schemas/:id
 * Admin only
 */
export async function deleteCredentialSchema(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    // Check if schema exists
    const schema = await prisma.credentialSchema.findUnique({
      where: { id },
      include: {
        issuerSchemas: true,
        verifierSchemas: true,
      },
    });

    if (!schema) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Credential schema not found',
      });
      return;
    }

    // Check if schema is in use
    if (schema.issuerSchemas.length > 0 || schema.verifierSchemas.length > 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete schema that is in use by issuers or verifiers',
      });
      return;
    }

    // Delete schema
    await prisma.credentialSchema.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Credential schema deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting credential schema:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete credential schema',
    });
  }
}

/**
 * Validate data against a credential schema
 * POST /v2/schemas/:id/validate
 * Public access
 */
export async function validateAgainstSchema(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'data is required',
      });
      return;
    }

    // Get schema
    const schema = await prisma.credentialSchema.findUnique({
      where: { id },
    });

    if (!schema) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Credential schema not found',
      });
      return;
    }

    // Validate data against schema
    try {
      const jsonSchema = schema.jsonSchema as any;
      const schemaVersion = jsonSchema?.$schema || '';
      
      // Use appropriate AJV instance based on schema version
      const ajvInstance = (schemaVersion.includes('2020-12') || schemaVersion.includes('2019-09')) 
        ? ajv2020 
        : ajv;
      
      const validate = ajvInstance.compile(jsonSchema);
      const valid = validate(data);

      if (valid) {
        res.status(200).json({
          message: 'Data is valid',
          data: {
            valid: true,
            schemaId: id,
            schemaName: schema.name,
            schemaVersion: schema.version,
          },
        });
      } else {
        res.status(200).json({
          message: 'Data is invalid',
          data: {
            valid: false,
            schemaId: id,
            schemaName: schema.name,
            schemaVersion: schema.version,
            errors: validate.errors,
          },
        });
      }
    } catch (error: any) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Schema validation error: ${error.message}`,
      });
    }
  } catch (error) {
    console.error('Error validating against schema:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate against schema',
    });
  }
}
