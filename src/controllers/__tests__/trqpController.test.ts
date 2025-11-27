/**
 * TRQP Controller Tests
 * ToIP Trust Registry v2 Backend
 */

import request from 'supertest';
import express, { Application } from 'express';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    trustRegistry: {
      findFirst: jest.fn(),
    },
    issuer: {
      findFirst: jest.fn(),
    },
    verifier: {
      findFirst: jest.fn(),
    },
    registryRecognition: {
      findFirst: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

import trqpRoutes from '../../routes/trqpRoutes';

const prisma = new PrismaClient();

describe('TRQP Controller', () => {
  let app: Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/v2', trqpRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /v2/authorization', () => {
    const validRequest = {
      entity_id: 'did:web:university.edu',
      authority_id: 'did:web:education-trust.org',
      action: 'issue',
      resource: 'UniversityDegree',
    };

    it('should return 400 for missing entity_id', async () => {
      const response = await request(app)
        .post('/v2/authorization')
        .send({
          authority_id: 'did:web:test.org',
          action: 'issue',
          resource: 'TestCredential',
        });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Validation Error');
      expect(response.body.status).toBe(400);
    });

    it('should return 400 for missing authority_id', async () => {
      const response = await request(app)
        .post('/v2/authorization')
        .send({
          entity_id: 'did:web:test.edu',
          action: 'issue',
          resource: 'TestCredential',
        });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Validation Error');
    });

    it('should return 400 for missing action', async () => {
      const response = await request(app)
        .post('/v2/authorization')
        .send({
          entity_id: 'did:web:test.edu',
          authority_id: 'did:web:test.org',
          resource: 'TestCredential',
        });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Validation Error');
    });

    it('should return 400 for missing resource', async () => {
      const response = await request(app)
        .post('/v2/authorization')
        .send({
          entity_id: 'did:web:test.edu',
          authority_id: 'did:web:test.org',
          action: 'issue',
        });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Validation Error');
    });


    it('should return authorized=false when authority not found', async () => {
      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/v2/authorization')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.authorized).toBe(false);
      expect(response.body.entity_id).toBe(validRequest.entity_id);
      expect(response.body.authority_id).toBe(validRequest.authority_id);
      expect(response.body.action).toBe(validRequest.action);
      expect(response.body.resource).toBe(validRequest.resource);
      expect(response.body.time_evaluated).toBeDefined();
      expect(response.body.message).toContain('not found');
    });

    it('should return authorized=true when issuer is authorized', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      const mockIssuer = {
        id: 'issuer-123',
        did: validRequest.entity_id,
        status: 'active',
        credentialTypes: [
          { schema: { type: 'UniversityDegree' } },
        ],
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue(mockIssuer);

      const response = await request(app)
        .post('/v2/authorization')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.authorized).toBe(true);
      expect(response.body.entity_id).toBe(validRequest.entity_id);
      expect(response.body.message).toContain('is authorized');
    });

    it('should return authorized=false when issuer not found', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/v2/authorization')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.authorized).toBe(false);
    });

    it('should return authorized=false for unknown action', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);

      const response = await request(app)
        .post('/v2/authorization')
        .send({
          ...validRequest,
          action: 'unknown-action',
        });

      expect(response.status).toBe(200);
      expect(response.body.authorized).toBe(false);
      expect(response.body.message).toContain('Unknown action');
    });

    it('should handle context.time parameter', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.issuer.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/v2/authorization')
        .send({
          ...validRequest,
          context: {
            time: '2025-06-19T11:30:00Z',
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.time_requested).toBe('2025-06-19T11:30:00Z');
      expect(response.body.context).toEqual({ time: '2025-06-19T11:30:00Z' });
    });

    it('should handle verify action for verifiers', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      const mockVerifier = {
        id: 'verifier-123',
        did: validRequest.entity_id,
        status: 'active',
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.verifier.findFirst as jest.Mock).mockResolvedValue(mockVerifier);

      const response = await request(app)
        .post('/v2/authorization')
        .send({
          ...validRequest,
          action: 'verify',
        });

      expect(response.status).toBe(200);
      expect(response.body.authorized).toBe(true);
      expect(response.body.action).toBe('verify');
    });
  });

  describe('POST /v2/recognition', () => {
    const validRequest = {
      entity_id: 'did:web:other-registry.org',
      authority_id: 'did:web:our-registry.org',
      action: 'govern',
      resource: 'professional-licenses',
    };

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/v2/recognition')
        .send({
          entity_id: 'did:web:test.org',
        });

      expect(response.status).toBe(400);
      expect(response.body.title).toBe('Validation Error');
    });

    it('should return recognized=false when authority not found', async () => {
      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/v2/recognition')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.recognized).toBe(false);
      expect(response.body.entity_id).toBe(validRequest.entity_id);
      expect(response.body.authority_id).toBe(validRequest.authority_id);
      expect(response.body.time_evaluated).toBeDefined();
      expect(response.body.message).toContain('not found');
    });

    it('should return recognized=true when recognition exists', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      const mockRecognition = {
        id: 'recognition-123',
        authorityId: 'registry-123',
        entityId: validRequest.entity_id,
        action: validRequest.action,
        resource: validRequest.resource,
        recognized: true,
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.registryRecognition.findFirst as jest.Mock).mockResolvedValue(mockRecognition);

      const response = await request(app)
        .post('/v2/recognition')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.recognized).toBe(true);
      expect(response.body.message).toContain('is recognized');
    });

    it('should return recognized=false when no recognition exists', async () => {
      const mockRegistry = {
        id: 'registry-123',
        ecosystemDid: validRequest.authority_id,
      };

      (prisma.trustRegistry.findFirst as jest.Mock).mockResolvedValue(mockRegistry);
      (prisma.registryRecognition.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/v2/recognition')
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body.recognized).toBe(false);
      expect(response.body.message).toContain('NOT recognized');
    });
  });
});
