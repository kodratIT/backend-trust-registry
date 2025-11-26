/**
 * Credential Schema Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createCredentialSchema,
  listCredentialSchemas,
  getCredentialSchema,
  updateCredentialSchema,
  deleteCredentialSchema,
  validateAgainstSchema,
} from '../credentialSchemaController';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    credentialSchema: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    trustRegistry: {
      findUnique: jest.fn(),
    },
    trustFramework: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Credential Schema Controller', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin-id', role: 'admin', registryId: undefined },
    };
    jest.clearAllMocks();
  });

  describe('createCredentialSchema', () => {
    const validSchemaData = {
      registryId: 'registry-uuid',
      name: 'EducationCredential',
      version: '1.0.0',
      type: 'EducationCredential',
      jsonSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          degree: { type: 'string' },
        },
        required: ['name', 'degree'],
      },
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'OPEN',
    };

    it('should create a credential schema successfully', async () => {
      mockReq.body = validSchemaData;

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'registry-uuid',
        name: 'Test Registry',
      });

      (prisma.credentialSchema.findFirst as jest.Mock).mockResolvedValue(null);

      (prisma.credentialSchema.create as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        ...validSchemaData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Credential schema created successfully',
        })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = { name: 'Test' };

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
        })
      );
    });

    it('should return 400 for invalid issuerMode', async () => {
      mockReq.body = { ...validSchemaData, issuerMode: 'INVALID' };

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid issuerMode'),
        })
      );
    });

    it('should return 400 for invalid JSON Schema', async () => {
      mockReq.body = { ...validSchemaData, jsonSchema: { invalid: true } };

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('JSON Schema'),
        })
      );
    });

    it('should return 404 if registry not found', async () => {
      mockReq.body = validSchemaData;

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Trust registry not found',
        })
      );
    });

    it('should return 409 if schema already exists', async () => {
      mockReq.body = validSchemaData;

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'registry-uuid',
      });

      (prisma.credentialSchema.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-schema',
      });

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should return 403 for registry_owner creating in different registry', async () => {
      mockReq.body = validSchemaData;
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'registry-uuid',
      });

      await createCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });


  describe('listCredentialSchemas', () => {
    it('should list credential schemas with pagination', async () => {
      mockReq.query = { page: '1', limit: '10' };

      (prisma.credentialSchema.count as jest.Mock).mockResolvedValue(2);
      (prisma.credentialSchema.findMany as jest.Mock).mockResolvedValue([
        { id: 'schema-1', name: 'Schema 1' },
        { id: 'schema-2', name: 'Schema 2' },
      ]);

      await listCredentialSchemas(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({
            total: 2,
            page: 1,
            limit: 10,
          }),
        })
      );
    });

    it('should filter by registryId', async () => {
      mockReq.query = { registryId: 'registry-uuid' };

      (prisma.credentialSchema.count as jest.Mock).mockResolvedValue(1);
      (prisma.credentialSchema.findMany as jest.Mock).mockResolvedValue([
        { id: 'schema-1', registryId: 'registry-uuid' },
      ]);

      await listCredentialSchemas(mockReq as AuthenticatedRequest, mockRes as Response);

      const findManyMock = prisma.credentialSchema.findMany as jest.Mock;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            registryId: 'registry-uuid',
          }),
        })
      );
    });

    it('should filter by issuerMode', async () => {
      mockReq.query = { issuerMode: 'ECOSYSTEM' };

      (prisma.credentialSchema.count as jest.Mock).mockResolvedValue(1);
      (prisma.credentialSchema.findMany as jest.Mock).mockResolvedValue([]);

      await listCredentialSchemas(mockReq as AuthenticatedRequest, mockRes as Response);

      const findManyMock = prisma.credentialSchema.findMany as jest.Mock;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            issuerMode: 'ECOSYSTEM',
          }),
        })
      );
    });

    it('should return 400 for invalid page number', async () => {
      mockReq.query = { page: '0' };

      await listCredentialSchemas(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid limit', async () => {
      mockReq.query = { limit: '200' };

      await listCredentialSchemas(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getCredentialSchema', () => {
    it('should return a credential schema by ID', async () => {
      mockReq.params = { id: 'schema-uuid' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'Test Schema',
        version: '1.0.0',
        type: 'TestCredential',
        jsonSchema: { type: 'object' },
        issuerMode: 'OPEN',
        verifierMode: 'OPEN',
      });

      await getCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'schema-uuid',
          }),
        })
      );
    });

    it('should return 404 if schema not found', async () => {
      mockReq.params = { id: 'non-existent' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue(null);

      await getCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('updateCredentialSchema', () => {
    it('should update a credential schema successfully', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = { name: 'Updated Schema', version: '1.1.0' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'Original Schema',
        version: '1.0.0',
        registryId: 'registry-uuid',
      });

      (prisma.credentialSchema.findFirst as jest.Mock).mockResolvedValue(null);

      (prisma.credentialSchema.update as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'Updated Schema',
        version: '1.1.0',
      });

      await updateCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Credential schema updated successfully',
        })
      );
    });

    it('should return 404 if schema not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { name: 'Updated' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue(null);

      await updateCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 403 for registry_owner updating different registry schema', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = { name: 'Updated' };
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        registryId: 'registry-uuid',
      });

      await updateCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should return 400 for invalid issuerMode', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = { issuerMode: 'INVALID' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        registryId: 'registry-uuid',
      });

      await updateCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 409 for version conflict', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = { version: '2.0.0' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'Test',
        version: '1.0.0',
        type: 'TestCredential',
        registryId: 'registry-uuid',
      });

      (prisma.credentialSchema.findFirst as jest.Mock).mockResolvedValue({
        id: 'other-schema',
        version: '2.0.0',
      });

      await updateCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteCredentialSchema', () => {
    it('should delete a credential schema successfully', async () => {
      mockReq.params = { id: 'schema-uuid' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        issuerSchemas: [],
        verifierSchemas: [],
      });

      (prisma.credentialSchema.delete as jest.Mock).mockResolvedValue({});

      await deleteCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Credential schema deleted successfully',
        })
      );
    });

    it('should return 404 if schema not found', async () => {
      mockReq.params = { id: 'non-existent' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue(null);

      await deleteCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 400 if schema is in use', async () => {
      mockReq.params = { id: 'schema-uuid' };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        issuerSchemas: [{ issuerId: 'issuer-1' }],
        verifierSchemas: [],
      });

      await deleteCredentialSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('in use'),
        })
      );
    });
  });

  describe('validateAgainstSchema', () => {
    it('should validate data successfully', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = {
        data: { name: 'John Doe', degree: 'Computer Science' },
      };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'EducationCredential',
        version: '1.0.0',
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            degree: { type: 'string' },
          },
          required: ['name', 'degree'],
        },
      });

      await validateAgainstSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valid: true,
          }),
        })
      );
    });

    it('should return invalid for non-matching data', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = {
        data: { name: 'John Doe' }, // missing required 'degree'
      };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({
        id: 'schema-uuid',
        name: 'EducationCredential',
        version: '1.0.0',
        jsonSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            degree: { type: 'string' },
          },
          required: ['name', 'degree'],
        },
      });

      await validateAgainstSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            valid: false,
            errors: expect.any(Array),
          }),
        })
      );
    });

    it('should return 400 if data is missing', async () => {
      mockReq.params = { id: 'schema-uuid' };
      mockReq.body = {};

      await validateAgainstSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if schema not found', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { data: {} };

      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue(null);

      await validateAgainstSchema(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});
