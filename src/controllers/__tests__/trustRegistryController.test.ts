/**
 * Trust Registry Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createTrustRegistry,
  listTrustRegistries,
  getTrustRegistry,
  updateTrustRegistry,
  linkTrustFramework,
  unlinkTrustFramework,
  verifyDID,
} from '../trustRegistryController';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    trustRegistry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    trustFramework: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock DID Resolver
jest.mock('../../services/didResolver', () => ({
  validateDIDFormat: jest.fn().mockReturnValue({ valid: true, method: 'web' }),
  resolveDID: jest
    .fn()
    .mockResolvedValue({ valid: true, did: 'did:web:example.com', method: 'web' }),
}));

const prisma = new PrismaClient();

describe('Trust Registry Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      query: {},
      params: {},
      user: {
        id: 'user-123',
        role: 'admin',
      },
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('createTrustRegistry', () => {
    it('should create a trust registry successfully', async () => {
      const registryData = {
        name: 'Test Registry',
        ecosystemDid: 'did:web:example.com',
        description: 'Test description',
        status: 'active',
      };

      const createdRegistry = {
        id: 'reg-123',
        ...registryData,
        trustFramework: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = registryData;
      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.trustRegistry.create as jest.Mock).mockResolvedValue(createdRegistry);

      await createTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust registry created successfully',
        data: createdRegistry,
      });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = { ecosystemDid: 'did:web:example.com' };

      await createTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Name and ecosystemDid are required',
      });
    });

    it('should return 400 if ecosystemDid is missing', async () => {
      mockRequest.body = { name: 'Test Registry' };

      await createTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Name and ecosystemDid are required',
      });
    });

    it('should return 409 if ecosystemDid already exists', async () => {
      mockRequest.body = {
        name: 'Test Registry',
        ecosystemDid: 'did:web:example.com',
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-reg',
      });

      await createTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Conflict',
        message: 'A registry with this ecosystemDid already exists',
      });
    });

    it('should return 400 if trust framework not found', async () => {
      mockRequest.body = {
        name: 'Test Registry',
        ecosystemDid: 'did:web:example.com',
        trustFrameworkId: 'non-existent-tf',
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(null);

      await createTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Trust framework not found',
      });
    });
  });

  describe('listTrustRegistries', () => {
    it('should list trust registries with pagination', async () => {
      const registries = [
        {
          id: 'reg-1',
          name: 'Registry 1',
          ecosystemDid: 'did:web:example1.com',
          status: 'active',
          trustFramework: { id: 'tf-1', name: 'Framework 1', version: '1.0' },
        },
        {
          id: 'reg-2',
          name: 'Registry 2',
          ecosystemDid: 'did:web:example2.com',
          status: 'active',
          trustFramework: null,
        },
      ];

      mockRequest.query = { page: '1', limit: '10' };

      (prisma.trustRegistry.count as jest.Mock).mockResolvedValue(2);
      (prisma.trustRegistry.findMany as jest.Mock).mockResolvedValue(registries);

      await listTrustRegistries(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: registries,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should filter by status', async () => {
      mockRequest.query = { status: 'active', page: '1', limit: '10' };

      (prisma.trustRegistry.count as jest.Mock).mockResolvedValue(1);
      (prisma.trustRegistry.findMany as jest.Mock).mockResolvedValue([]);

      await listTrustRegistries(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.trustRegistry.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest.query = { page: 'invalid' };

      await listTrustRegistries(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid page number',
      });
    });

    it('should return 400 for invalid limit', async () => {
      mockRequest.query = { page: '1', limit: '200' };

      await listTrustRegistries(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid limit. Must be between 1 and 100',
      });
    });
  });

  describe('getTrustRegistry', () => {
    it('should get a trust registry by ID', async () => {
      const registry = {
        id: 'reg-123',
        name: 'Test Registry',
        ecosystemDid: 'did:web:example.com',
        status: 'active',
        trustFramework: null,
        credentialSchemas: [],
        issuers: [],
        verifiers: [],
      };

      mockRequest.params = { id: 'reg-123' };
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(registry);

      await getTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: registry,
      });
    });

    it('should return 404 if trust registry not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await getTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
    });
  });

  describe('updateTrustRegistry', () => {
    it('should update a trust registry successfully', async () => {
      const existingRegistry = {
        id: 'reg-123',
        name: 'Old Name',
        ecosystemDid: 'did:web:example.com',
        status: 'active',
      };

      const updatedRegistry = {
        ...existingRegistry,
        name: 'New Name',
        trustFramework: null,
      };

      mockRequest.params = { id: 'reg-123' };
      mockRequest.body = { name: 'New Name' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(existingRegistry);
      (prisma.trustRegistry.update as jest.Mock).mockResolvedValue(updatedRegistry);

      await updateTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust registry updated successfully',
        data: updatedRegistry,
      });
    });

    it('should return 404 if trust registry not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { name: 'New Name' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await updateTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Trust registry not found',
      });
    });

    it('should return 403 for registry_owner updating other registry', async () => {
      mockRequest.params = { id: 'reg-123' };
      mockRequest.body = { name: 'New Name' };
      mockRequest.user = { id: 'user-123', role: 'registry_owner', registryId: 'other-reg' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'reg-123',
        name: 'Test',
      });

      await updateTrustRegistry(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'You can only update your own registry',
      });
    });
  });

  describe('linkTrustFramework', () => {
    it('should link trust framework successfully', async () => {
      const registry = {
        id: 'reg-123',
        name: 'Test Registry',
        trustFrameworkId: null,
      };

      const trustFramework = {
        id: 'tf-123',
        name: 'Test Framework',
        status: 'active',
      };

      const updatedRegistry = {
        ...registry,
        trustFrameworkId: 'tf-123',
        trustFramework,
      };

      mockRequest.params = { id: 'reg-123' };
      mockRequest.body = { trustFrameworkId: 'tf-123' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(registry);
      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(trustFramework);
      (prisma.trustRegistry.update as jest.Mock).mockResolvedValue(updatedRegistry);

      await linkTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust registry linked to trust framework successfully',
        data: updatedRegistry,
      });
    });

    it('should return 400 if trustFrameworkId is missing', async () => {
      mockRequest.params = { id: 'reg-123' };
      mockRequest.body = {};

      await linkTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'trustFrameworkId is required',
      });
    });

    it('should return 400 if trust framework is inactive', async () => {
      mockRequest.params = { id: 'reg-123' };
      mockRequest.body = { trustFrameworkId: 'tf-123' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'reg-123' });
      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue({
        id: 'tf-123',
        status: 'inactive',
      });

      await linkTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Cannot link to inactive or deprecated trust framework',
      });
    });
  });

  describe('unlinkTrustFramework', () => {
    it('should unlink trust framework successfully', async () => {
      const registry = {
        id: 'reg-123',
        name: 'Test Registry',
        trustFrameworkId: 'tf-123',
        trustFramework: { id: 'tf-123', name: 'Test Framework' },
      };

      const updatedRegistry = {
        ...registry,
        trustFrameworkId: null,
        trustFramework: null,
      };

      mockRequest.params = { id: 'reg-123' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(registry);
      (prisma.trustRegistry.update as jest.Mock).mockResolvedValue(updatedRegistry);

      await unlinkTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust registry unlinked from trust framework successfully',
        data: updatedRegistry,
      });
    });

    it('should return 400 if registry is not linked', async () => {
      mockRequest.params = { id: 'reg-123' };

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        id: 'reg-123',
        trustFrameworkId: null,
      });

      await unlinkTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Trust registry is not linked to any trust framework',
      });
    });
  });

  describe('verifyDID', () => {
    it('should verify a valid DID', async () => {
      mockRequest.body = { did: 'did:web:example.com' };

      await verifyDID(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
          data: expect.objectContaining({
            did: 'did:web:example.com',
            valid: true,
            method: 'web',
          }),
        })
      );
    });

    it('should return 400 if DID is missing', async () => {
      mockRequest.body = {};

      await verifyDID(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'DID is required',
      });
    });
  });
});
