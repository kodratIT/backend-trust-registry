/**
 * Verifier Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createVerifier,
  listVerifiers,
  getVerifier,
  updateVerifier,
  updateVerifierStatus,
  addVerifierCredentialType,
  removeVerifierCredentialType,
} from '../verifierController';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    verifier: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    trustRegistry: {
      findUnique: jest.fn(),
    },
    trustFramework: {
      findUnique: jest.fn(),
    },
    statusHistory: {
      create: jest.fn(),
    },
    verifierCredentialType: {
      createMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    credentialSchema: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock DID Resolver
const mockValidateDIDFormat = jest.fn();
const mockResolveDID = jest.fn();

jest.mock('../../services/didResolver', () => ({
  validateDIDFormat: (): { valid: boolean; method: string } => mockValidateDIDFormat(),
  resolveDID: (): Promise<{ valid: boolean; did: string; method: string }> => mockResolveDID(),
}));

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Verifier Controller', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: { id: 'admin-id', role: 'admin', registryId: undefined },
    };
    jest.clearAllMocks();
    
    // Reset DID resolver mocks
    mockValidateDIDFormat.mockReturnValue({ valid: true, method: 'web' });
    mockResolveDID.mockResolvedValue({ valid: true, did: 'did:web:verifier.example.com', method: 'web' });
  });

  describe('createVerifier', () => {
    const validVerifierData = {
      did: 'did:web:verifier.example.com',
      name: 'Test Verifier',
      registryId: 'registry-uuid',
      status: 'active',
    };

    it('should create a verifier successfully', async () => {
      mockReq.body = validVerifierData;

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });
      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.verifier.create as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        ...validVerifierData,
      });
      (prisma.statusHistory.create as jest.Mock).mockResolvedValue({});

      await createVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Verifier registered successfully' })
      );
    });

    it('should return 400 if did is missing', async () => {
      mockReq.body = { registryId: 'registry-uuid' };

      await createVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if registry not found', async () => {
      mockReq.body = validVerifierData;
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await createVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 409 if verifier DID already exists', async () => {
      mockReq.body = validVerifierData;
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });
      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

      await createVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should return 403 for registry_owner creating in different registry', async () => {
      mockReq.body = validVerifierData;
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });

      await createVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('listVerifiers', () => {
    it('should list verifiers with pagination', async () => {
      mockReq.query = { page: '1', limit: '10' };

      (prisma.verifier.count as jest.Mock).mockResolvedValue(2);
      (prisma.verifier.findMany as jest.Mock).mockResolvedValue([
        { id: 'verifier-1', did: 'did:web:v1.com' },
        { id: 'verifier-2', did: 'did:web:v2.com' },
      ]);

      await listVerifiers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 2 }),
        })
      );
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'active' };

      (prisma.verifier.count as jest.Mock).mockResolvedValue(1);
      (prisma.verifier.findMany as jest.Mock).mockResolvedValue([]);

      await listVerifiers(mockReq as AuthenticatedRequest, mockRes as Response);

      const findManyMock = prisma.verifier.findMany as jest.Mock;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should return 400 for invalid page', async () => {
      mockReq.query = { page: '0' };

      await listVerifiers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getVerifier', () => {
    it('should return a verifier by DID', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        did: 'did:web:verifier.example.com',
        status: 'active',
      });

      await getVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if verifier not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };
      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue(null);

      await getVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('updateVerifier', () => {
    it('should update a verifier successfully', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { name: 'Updated Verifier' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.verifier.update as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        name: 'Updated Verifier',
      });

      await updateVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if verifier not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };
      mockReq.body = { name: 'Updated' };
      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue(null);

      await updateVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 403 for registry_owner updating different registry', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { name: 'Updated' };
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });

      await updateVerifier(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('updateVerifierStatus', () => {
    it('should update verifier status successfully', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { status: 'active' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        status: 'pending',
        registryId: 'registry-uuid',
      });
      (prisma.verifier.update as jest.Mock).mockResolvedValue({ id: 'verifier-uuid', status: 'active' });
      (prisma.statusHistory.create as jest.Mock).mockResolvedValue({});

      await updateVerifierStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid status transition', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { status: 'pending' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        status: 'revoked',
        registryId: 'registry-uuid',
      });

      await updateVerifierStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('addVerifierCredentialType', () => {
    it('should add credential type to verifier', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { schemaId: 'schema-uuid' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({ id: 'schema-uuid' });
      (prisma.verifierCredentialType.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.verifierCredentialType.create as jest.Mock).mockResolvedValue({});

      await addVerifierCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should return 409 if already linked', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com' };
      mockReq.body = { schemaId: 'schema-uuid' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({ id: 'schema-uuid' });
      (prisma.verifierCredentialType.findUnique as jest.Mock).mockResolvedValue({ verifierId: 'verifier-uuid' });

      await addVerifierCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });
  });

  describe('removeVerifierCredentialType', () => {
    it('should remove credential type from verifier', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com', schemaId: 'schema-uuid' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.verifierCredentialType.findUnique as jest.Mock).mockResolvedValue({ verifierId: 'verifier-uuid' });
      (prisma.verifierCredentialType.delete as jest.Mock).mockResolvedValue({});

      await removeVerifierCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if link not found', async () => {
      mockReq.params = { did: 'did:web:verifier.example.com', schemaId: 'schema-uuid' };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue({
        id: 'verifier-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.verifierCredentialType.findUnique as jest.Mock).mockResolvedValue(null);

      await removeVerifierCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});
