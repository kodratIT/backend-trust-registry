/**
 * Query Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { singleQuery, batchQuery, queryIssuers, queryVerifiers } from '../queryController';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    issuer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    verifier: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Query Controller', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    mockReq = { body: {}, query: {} };
    jest.clearAllMocks();
  });

  describe('singleQuery', () => {
    it('should return issuer when found', async () => {
      mockReq.body = {
        entityType: 'issuer',
        did: 'did:web:issuer.example.com',
      };

      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue({
        did: 'did:web:issuer.example.com',
        name: 'Test Issuer',
        status: 'active',
        jurisdictions: [{ code: 'US' }],
        contexts: ['education'],
        accreditationLevel: 'high',
        validFrom: null,
        validUntil: null,
        endpoint: 'https://issuer.example.com',
        registry: { id: 'reg-1', name: 'Test Registry', ecosystemDid: 'did:web:registry.com' },
        trustFramework: { id: 'tf-1', name: 'Test Framework', version: '1.0' },
        credentialTypes: [{ schema: { id: 's-1', name: 'Degree', type: 'EducationCredential', version: '1.0.0' } }],
      });

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            found: true,
            entityType: 'issuer',
          }),
        })
      );
    });

    it('should return found: false when issuer not found', async () => {
      mockReq.body = {
        entityType: 'issuer',
        did: 'did:web:nonexistent.com',
      };

      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue(null);

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            found: false,
            entityType: 'issuer',
          }),
        })
      );
    });

    it('should return verifier when found', async () => {
      mockReq.body = {
        entityType: 'verifier',
        did: 'did:web:verifier.example.com',
      };

      (prisma.verifier.findFirst as jest.Mock).mockResolvedValue({
        did: 'did:web:verifier.example.com',
        name: 'Test Verifier',
        status: 'active',
        registry: { id: 'reg-1', name: 'Test Registry' },
        credentialTypes: [],
      });

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            found: true,
            entityType: 'verifier',
          }),
        })
      );
    });

    it('should return 400 if entityType is missing', async () => {
      mockReq.body = { did: 'did:web:example.com' };

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('entityType'),
        })
      );
    });

    it('should return 400 if entityType is invalid', async () => {
      mockReq.body = { entityType: 'invalid', did: 'did:web:example.com' };

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no filters provided', async () => {
      mockReq.body = { entityType: 'issuer' };

      await singleQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('filter'),
        })
      );
    });
  });

  describe('batchQuery', () => {
    it('should execute multiple queries', async () => {
      mockReq.body = {
        queries: [
          { entityType: 'issuer', did: 'did:web:issuer1.com' },
          { entityType: 'verifier', did: 'did:web:verifier1.com' },
        ],
      };

      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue({
        did: 'did:web:issuer1.com',
        name: 'Issuer 1',
        status: 'active',
        registry: {},
        credentialTypes: [],
      });

      (prisma.verifier.findFirst as jest.Mock).mockResolvedValue({
        did: 'did:web:verifier1.com',
        name: 'Verifier 1',
        status: 'active',
        registry: {},
        credentialTypes: [],
      });

      await batchQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalQueries: 2,
            successCount: 2,
            failureCount: 0,
          }),
        })
      );
    });

    it('should return 400 if queries array is missing', async () => {
      mockReq.body = {};

      await batchQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 if queries array is empty', async () => {
      mockReq.body = { queries: [] };

      await batchQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should return 400 if queries exceed 100', async () => {
      mockReq.body = {
        queries: Array(101).fill({ entityType: 'issuer', did: 'did:web:test.com' }),
      };

      await batchQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('100'),
        })
      );
    });

    it('should return 400 if any query has invalid entityType', async () => {
      mockReq.body = {
        queries: [
          { entityType: 'issuer', did: 'did:web:test.com' },
          { entityType: 'invalid', did: 'did:web:test2.com' },
        ],
      };

      await batchQuery(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('queryIssuers', () => {
    it('should return paginated issuers', async () => {
      mockReq.query = { page: '1', limit: '10' };

      (prisma.issuer.count as jest.Mock).mockResolvedValue(2);
      (prisma.issuer.findMany as jest.Mock).mockResolvedValue([
        {
          did: 'did:web:issuer1.com',
          name: 'Issuer 1',
          status: 'active',
          registry: { id: 'r1', name: 'Registry 1' },
          credentialTypes: [],
        },
        {
          did: 'did:web:issuer2.com',
          name: 'Issuer 2',
          status: 'active',
          registry: { id: 'r1', name: 'Registry 1' },
          credentialTypes: [],
        },
      ]);

      await queryIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 2 }),
        })
      );
    });

    it('should filter by jurisdiction', async () => {
      mockReq.query = { jurisdiction: 'US' };

      (prisma.issuer.count as jest.Mock).mockResolvedValue(1);
      (prisma.issuer.findMany as jest.Mock).mockResolvedValue([]);

      await queryIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid page', async () => {
      mockReq.query = { page: '0' };

      await queryIssuers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('queryVerifiers', () => {
    it('should return paginated verifiers', async () => {
      mockReq.query = { page: '1', limit: '10' };

      (prisma.verifier.count as jest.Mock).mockResolvedValue(1);
      (prisma.verifier.findMany as jest.Mock).mockResolvedValue([
        {
          did: 'did:web:verifier1.com',
          name: 'Verifier 1',
          status: 'active',
          registry: { id: 'r1', name: 'Registry 1' },
          credentialTypes: [],
        },
      ]);

      await queryVerifiers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.any(Array),
          meta: expect.objectContaining({ total: 1 }),
        })
      );
    });

    it('should filter by credentialType', async () => {
      mockReq.query = { credentialType: 'EducationCredential' };

      (prisma.verifier.count as jest.Mock).mockResolvedValue(1);
      (prisma.verifier.findMany as jest.Mock).mockResolvedValue([]);

      await queryVerifiers(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
