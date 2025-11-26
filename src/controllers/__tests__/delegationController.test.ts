/**
 * Delegation Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createDelegation,
  listDelegates,
  getDelegationChain,
  revokeDelegation,
} from '../delegationController';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    issuer: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    issuerDelegation: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
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

describe('Delegation Controller', () => {
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
    mockResolveDID.mockResolvedValue({ valid: true, did: 'did:web:delegate.example.com', method: 'web' });
  });

  describe('createDelegation', () => {
    const validDelegationData = {
      delegateDid: 'did:web:delegate.example.com',
      scope: { jurisdictions: ['US'], credentialTypes: ['EducationCredential'] },
      delegationProof: { type: 'Ed25519Signature2020', proofValue: 'abc123' },
    };

    it('should create a delegation successfully', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.body = validDelegationData;

      (prisma.issuer.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'root-issuer-uuid',
          did: 'did:web:root.example.com',
          status: 'active',
          registryId: 'registry-uuid',
          trustFrameworkId: 'tf-uuid',
        })
        .mockResolvedValueOnce(null); // delegate doesn't exist

      (prisma.issuer.create as jest.Mock).mockResolvedValue({
        id: 'delegate-issuer-uuid',
        did: 'did:web:delegate.example.com',
      });

      (prisma.issuerDelegation.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.issuerDelegation.create as jest.Mock).mockResolvedValue({
        id: 'delegation-uuid',
        rootIssuerDid: 'did:web:root.example.com',
        delegateIssuerDid: 'did:web:delegate.example.com',
        scope: validDelegationData.scope,
        status: 'active',
      });

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Delegation created successfully' })
      );
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.body = { delegateDid: 'did:web:delegate.example.com' };

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('required') })
      );
    });

    it('should return 404 if root issuer not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };
      mockReq.body = validDelegationData;

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Root issuer not found' })
      );
    });

    it('should return 400 if root issuer is not active', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.body = validDelegationData;

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        did: 'did:web:root.example.com',
        status: 'suspended',
        registryId: 'registry-uuid',
      });

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('active') })
      );
    });

    it('should return 409 if delegation already exists', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.body = validDelegationData;

      (prisma.issuer.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'root-issuer-uuid',
          did: 'did:web:root.example.com',
          status: 'active',
          registryId: 'registry-uuid',
        })
        .mockResolvedValueOnce({
          id: 'delegate-issuer-uuid',
          did: 'did:web:delegate.example.com',
        });

      (prisma.issuerDelegation.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-delegation',
        status: 'active',
      });

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it('should return 403 for registry_owner creating delegation in different registry', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.body = validDelegationData;
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        did: 'did:web:root.example.com',
        status: 'active',
        registryId: 'registry-uuid',
      });

      await createDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });

  describe('listDelegates', () => {
    it('should list delegates for a root issuer', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.query = { page: '1', limit: '10' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        did: 'did:web:root.example.com',
      });

      (prisma.issuerDelegation.count as jest.Mock).mockResolvedValue(2);
      (prisma.issuerDelegation.findMany as jest.Mock).mockResolvedValue([
        { id: 'del-1', delegateIssuerDid: 'did:web:delegate1.com', status: 'active' },
        { id: 'del-2', delegateIssuerDid: 'did:web:delegate2.com', status: 'active' },
      ]);

      await listDelegates(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 2 }),
        })
      );
    });

    it('should return 404 if root issuer not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await listDelegates(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it('should filter by status', async () => {
      mockReq.params = { did: 'did:web:root.example.com' };
      mockReq.query = { status: 'active' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
      });
      (prisma.issuerDelegation.count as jest.Mock).mockResolvedValue(1);
      (prisma.issuerDelegation.findMany as jest.Mock).mockResolvedValue([]);

      await listDelegates(mockReq as AuthenticatedRequest, mockRes as Response);

      const findManyMock = prisma.issuerDelegation.findMany as jest.Mock;
      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });
  });

  describe('getDelegationChain', () => {
    it('should return delegation chain for an issuer', async () => {
      mockReq.params = { did: 'did:web:delegate.example.com' };

      // First call - get the issuer
      (prisma.issuer.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 'delegate-uuid',
          did: 'did:web:delegate.example.com',
        })
        // Second call - get root issuer (when no delegation found)
        .mockResolvedValueOnce({
          id: 'delegate-uuid',
          did: 'did:web:delegate.example.com',
          name: 'Delegate Issuer',
          status: 'active',
        });

      // No delegation found - this is the root
      (prisma.issuerDelegation.findFirst as jest.Mock).mockResolvedValue(null);

      await getDelegationChain(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            issuerDid: 'did:web:delegate.example.com',
            chainLength: expect.any(Number),
            chain: expect.any(Array),
          }),
        })
      );
    });

    it('should return 404 if issuer not found', async () => {
      mockReq.params = { did: 'did:web:nonexistent.com' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await getDelegationChain(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('revokeDelegation', () => {
    it('should revoke a delegation successfully', async () => {
      mockReq.params = {
        did: 'did:web:root.example.com',
        delegateDid: 'did:web:delegate.example.com',
      };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        did: 'did:web:root.example.com',
        registryId: 'registry-uuid',
      });

      (prisma.issuerDelegation.findFirst as jest.Mock).mockResolvedValue({
        id: 'delegation-uuid',
        status: 'active',
      });

      (prisma.issuerDelegation.update as jest.Mock).mockResolvedValue({
        id: 'delegation-uuid',
        status: 'revoked',
      });

      await revokeDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Delegation revoked successfully' })
      );
    });

    it('should return 404 if root issuer not found', async () => {
      mockReq.params = {
        did: 'did:web:nonexistent.com',
        delegateDid: 'did:web:delegate.example.com',
      };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);

      await revokeDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Root issuer not found' })
      );
    });

    it('should return 404 if delegation not found', async () => {
      mockReq.params = {
        did: 'did:web:root.example.com',
        delegateDid: 'did:web:delegate.example.com',
      };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        registryId: 'registry-uuid',
      });

      (prisma.issuerDelegation.findFirst as jest.Mock).mockResolvedValue(null);

      await revokeDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Active delegation not found' })
      );
    });

    it('should return 403 for registry_owner revoking in different registry', async () => {
      mockReq.params = {
        did: 'did:web:root.example.com',
        delegateDid: 'did:web:delegate.example.com',
      };
      mockReq.user = { id: 'owner-id', role: 'registry_owner', registryId: 'other-registry' };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue({
        id: 'root-issuer-uuid',
        registryId: 'registry-uuid',
      });

      await revokeDelegation(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });
  });
});
