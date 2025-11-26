/**
 * Issuer Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createIssuer,
  listIssuers,
  getIssuer,
  updateIssuer,
  updateIssuerStatus,
  addCredentialType,
  removeCredentialType,
} from '../issuerController';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    issuer: {
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
    issuerCredentialType: {
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

describe('Issuer Controller', () => {
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
    mockResolveDID.mockResolvedValue({ valid: true, did: 'did:web:issuer.example.com', method: 'web' });
  });

  describe('createIssuer', () => {
    const validIssuerData = {
      did: 'did:web:issuer.example.com',
      name: 'Test Issuer',
      registryId: 'registry-uuid',
      status: 'active',
    };

    it('should create an issuer successfully', async () => {
      mockReq.body = validIssuerData;

      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid', name: 'Test Registry' });
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.issuer.create as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        ...validIssuerData,
        createdAt: new Date(),
      });
      (prisma.statusHistory.create as jest.Mock).mockResolvedValue({});

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Issuer registered successfully' })
      );
    });

    it('should return 400 if did is missing', async () => {
      mockReq.body = { registryId: 'registry-uuid' };

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'did and registryId are required' })
      );
    });

    it('should return 400 if registryId is missing', async () => {
      mockReq.body = { did: 'did:web:example.com' };

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 404 if registry not found', async () => {
      mockReq.body = validIssuerData;
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue(null);

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Trust registry not found' })
      );
    });

    it('should return 409 if issuer DID already exists', async () => {
      mockReq.body = validIssuerData;
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-issuer' });

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'An issuer with this DID already exists' })
      );
    });

    it('should return 403 for registry_owner creating in different registry', async () => {
      mockReq.body = validIssuerData;
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it('should return 400 for invalid accreditation level', async () => {
      mockReq.body = { ...validIssuerData, accreditationLevel: 'invalid' };
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({ id: 'registry-uuid' });
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await createIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('accreditationLevel') })
      );
    });
  });


  describe('listIssuers', () => {
    it('should list issuers with pagination', async () => {
      mockReq.query = { page: '1', limit: '10' };

      (prisma.issuer.count as jest.Mock).mockResolvedValue(2);
      (prisma.issuer.findMany as jest.Mock).mockResolvedValue([
        { id: 'issuer-1', did: 'did:web:issuer1.com', status: 'active' },
        { id: 'issuer-2', did: 'did:web:issuer2.com', status: 'active' },
      ]);

      await listIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 2, page: 1, limit: 10 }),
        })
      );
    });

    it('should filter by status', async () => {
      mockReq.query = { status: 'active' };

      (prisma.issuer.count as jest.Mock).mockResolvedValue(1);
      (prisma.issuer.findMany as jest.Mock).mockResolvedValue([]);

      await listIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      const findManyMock = prisma.issuer.findMany as jest.Mock;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should return 400 for invalid page number', async () => {
      mockReq.query = { page: '0' };

      await listIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getIssuer', () => {
    it('should return an issuer by DID', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        did: 'did:web:issuer.example.com',
        name: 'Test Issuer',
        status: 'active',
      });

      await getIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ did: 'did:web:issuer.example.com' }),
        })
      );
    });

    it('should return 404 if issuer not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await getIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('updateIssuer', () => {
    it('should update an issuer successfully', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { name: 'Updated Issuer' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        did: 'did:web:issuer.example.com',
        registryId: 'registry-uuid',
      });
      (prisma.issuer.update as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        name: 'Updated Issuer',
      });

      await updateIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Issuer updated successfully' })
      );
    });

    it('should return 404 if issuer not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };
      mockReq.body = { name: 'Updated' };
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await updateIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should return 403 for registry_owner updating different registry issuer', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { name: 'Updated' };
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        registryId: 'registry-uuid',
      });

      await updateIssuer(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('updateIssuerStatus', () => {
    it('should update issuer status successfully', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { status: 'active', reason: 'Approved' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        did: 'did:web:issuer.example.com',
        status: 'pending',
        registryId: 'registry-uuid',
      });
      (prisma.issuer.update as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        status: 'active',
      });
      (prisma.statusHistory.create as jest.Mock).mockResolvedValue({});

      await updateIssuerStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Issuer status updated successfully' })
      );
    });

    it('should return 400 if status is missing', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = {};

      await updateIssuerStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { status: 'invalid' };

      await updateIssuerStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid status transition', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { status: 'pending' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        status: 'revoked', // revoked is terminal
        registryId: 'registry-uuid',
      });

      await updateIssuerStatus(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Invalid status transition') })
      );
    });
  });

  describe('addCredentialType', () => {
    it('should add credential type to issuer', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { schemaId: 'schema-uuid' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({ id: 'schema-uuid' });
      (prisma.issuerCredentialType.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.issuerCredentialType.create as jest.Mock).mockResolvedValue({});

      await addCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it('should return 400 if schemaId is missing', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = {};

      await addCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 409 if already linked', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com' };
      mockReq.body = { schemaId: 'schema-uuid' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.credentialSchema.findUnique as jest.Mock).mockResolvedValue({ id: 'schema-uuid' });
      (prisma.issuerCredentialType.findUnique as jest.Mock).mockResolvedValue({ issuerId: 'issuer-uuid' });

      await addCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });
  });

  describe('removeCredentialType', () => {
    it('should remove credential type from issuer', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com', schemaId: 'schema-uuid' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.issuerCredentialType.findUnique as jest.Mock).mockResolvedValue({ issuerId: 'issuer-uuid' });
      (prisma.issuerCredentialType.delete as jest.Mock).mockResolvedValue({});

      await removeCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 404 if link not found', async () => {
      mockReq.params = { did: 'did:web:issuer.example.com', schemaId: 'schema-uuid' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'issuer-uuid',
        registryId: 'registry-uuid',
      });
      (prisma.issuerCredentialType.findUnique as jest.Mock).mockResolvedValue(null);

      await removeCredentialType(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });
});
