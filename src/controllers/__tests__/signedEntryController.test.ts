/**
 * Signed Entry Controller Tests
 */

import { Request, Response } from 'express';
import {
  getSignedIssuerEntry,
  verifyIssuerEntry,
  getSignedVerifierEntry,
  verifyVerifierEntry,
  getRegistryDidDocument,
} from '../signedEntryController';
import { _setRegistryKeyPair, initializeRegistryKey } from '../../services/signatureService';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    issuer: {
      findUnique: jest.fn(),
    },
    verifier: {
      findUnique: jest.fn(),
    },
    trustRegistry: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

describe('Signed Entry Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(async () => {
    // Reset registry key
    _setRegistryKeyPair(null);
    await initializeRegistryKey();

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = { status: statusMock, json: jsonMock };
    mockReq = { params: {}, body: {}, query: {} };
  });

  describe('getSignedIssuerEntry', () => {
    it('should return signed issuer entry', async () => {
      const mockIssuer = {
        did: 'did:web:issuer.example.com',
        name: 'Test Issuer',
        status: 'active',
        jurisdictions: [{ code: 'US' }],
        contexts: ['education'],
        accreditationLevel: 'high',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        registry: { id: 'reg-1', name: 'Test Registry', ecosystemDid: 'did:web:registry.example.com' },
        trustFramework: { id: 'tf-1', name: 'Test Framework', version: '1.0' },
        credentialTypes: [{ schema: { id: 's-1', name: 'Diploma', type: 'DiplomaCredential', version: '1.0' } }],
      };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(mockIssuer);
      mockReq.params = { did: 'did:web:issuer.example.com' };

      await getSignedIssuerEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
      const response = jsonMock.mock.calls[0][0];
      expect(response.data.entry).toBeDefined();
      expect(response.data.proof).toBeDefined();
      expect(response.data.proof.type).toBe('Ed25519Signature2020');
    });

    it('should return 404 if issuer not found', async () => {
      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(null);
      mockReq.params = { did: 'did:web:unknown.com' };

      await getSignedIssuerEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('verifyIssuerEntry', () => {
    it('should verify valid signed entry', async () => {
      // First get a signed entry
      const mockIssuer = {
        did: 'did:web:issuer.example.com',
        name: 'Test Issuer',
        status: 'active',
        jurisdictions: null,
        contexts: null,
        accreditationLevel: null,
        validFrom: null,
        validUntil: null,
        registry: { id: 'reg-1', name: 'Test Registry', ecosystemDid: 'did:web:registry.example.com' },
        trustFramework: null,
        credentialTypes: [],
      };

      (prisma.issuer.findUnique as jest.Mock).mockResolvedValue(mockIssuer);
      mockReq.params = { did: 'did:web:issuer.example.com' };

      // Get signed entry
      const getJsonMock = jest.fn();
      const getStatusMock = jest.fn().mockReturnValue({ json: getJsonMock });
      await getSignedIssuerEntry(mockReq as Request, { status: getStatusMock, json: getJsonMock } as unknown as Response);

      const signedEntry = getJsonMock.mock.calls[0][0].data;

      // Now verify it
      mockReq.body = signedEntry;
      await verifyIssuerEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data.valid).toBe(true);
    });

    it('should return 400 for invalid format', async () => {
      mockReq.body = { invalid: 'data' };

      await verifyIssuerEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getSignedVerifierEntry', () => {
    it('should return signed verifier entry', async () => {
      const mockVerifier = {
        did: 'did:web:verifier.example.com',
        name: 'Test Verifier',
        status: 'active',
        jurisdictions: null,
        contexts: null,
        accreditationLevel: null,
        validFrom: null,
        validUntil: null,
        registry: { id: 'reg-1', name: 'Test Registry', ecosystemDid: 'did:web:registry.example.com' },
        trustFramework: null,
        credentialTypes: [],
      };

      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue(mockVerifier);
      mockReq.params = { did: 'did:web:verifier.example.com' };

      await getSignedVerifierEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data.entry.entityType).toBe('verifier');
      expect(response.data.proof).toBeDefined();
    });

    it('should return 404 if verifier not found', async () => {
      (prisma.verifier.findUnique as jest.Mock).mockResolvedValue(null);
      mockReq.params = { did: 'did:web:unknown.com' };

      await getSignedVerifierEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });
  });

  describe('verifyVerifierEntry', () => {
    it('should return 400 for invalid format', async () => {
      mockReq.body = {};

      await verifyVerifierEntry(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });

  describe('getRegistryDidDocument', () => {
    it('should return registry DID document', async () => {
      await getRegistryDidDocument(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data['@context']).toBeDefined();
      expect(response.data.verificationMethod).toBeDefined();
    });

    it('should use registry DID when registryId provided', async () => {
      (prisma.trustRegistry.findUnique as jest.Mock).mockResolvedValue({
        ecosystemDid: 'did:web:custom-registry.example.com',
      });
      mockReq.query = { registryId: 'reg-1' };

      await getRegistryDidDocument(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      const response = jsonMock.mock.calls[0][0];
      expect(response.data.id).toBe('did:web:custom-registry.example.com');
    });
  });
});
