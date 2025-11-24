/**
 * Trust Framework Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import {
  createTrustFramework,
  listTrustFrameworks,
  getTrustFramework,
  updateTrustFramework,
} from '../trustFrameworkController';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    trustFramework: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const prisma = new PrismaClient();

describe('Trust Framework Controller', () => {
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

  describe('createTrustFramework', () => {
    it('should create a trust framework successfully', async () => {
      const trustFrameworkData = {
        name: 'Test Framework',
        version: '1.0',
        description: 'Test description',
        status: 'active',
      };

      const createdFramework = {
        id: 'tf-123',
        ...trustFrameworkData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = trustFrameworkData;
      (prisma.trustFramework.create as jest.Mock).mockResolvedValue(createdFramework);

      await createTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust framework created successfully',
        data: createdFramework,
      });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = { version: '1.0' };

      await createTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Name and version are required',
      });
    });

    it('should return 400 if version is missing', async () => {
      mockRequest.body = { name: 'Test Framework' };

      await createTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Name and version are required',
      });
    });

    it('should handle database errors', async () => {
      mockRequest.body = {
        name: 'Test Framework',
        version: '1.0',
      };

      (prisma.trustFramework.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await createTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to create trust framework',
      });
    });
  });

  describe('listTrustFrameworks', () => {
    it('should list trust frameworks with pagination', async () => {
      const frameworks = [
        {
          id: 'tf-1',
          name: 'Framework 1',
          version: '1.0',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tf-2',
          name: 'Framework 2',
          version: '1.0',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRequest.query = { page: '1', limit: '10' };

      (prisma.trustFramework.count as jest.Mock).mockResolvedValue(2);
      (prisma.trustFramework.findMany as jest.Mock).mockResolvedValue(frameworks);

      await listTrustFrameworks(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: frameworks,
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

      (prisma.trustFramework.count as jest.Mock).mockResolvedValue(1);
      (prisma.trustFramework.findMany as jest.Mock).mockResolvedValue([]);

      await listTrustFrameworks(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(prisma.trustFramework.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'active' }),
        })
      );
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest.query = { page: 'invalid' };

      await listTrustFrameworks(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid page number',
      });
    });

    it('should return 400 for invalid limit', async () => {
      mockRequest.query = { page: '1', limit: '200' };

      await listTrustFrameworks(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Invalid limit. Must be between 1 and 100',
      });
    });
  });

  describe('getTrustFramework', () => {
    it('should get a trust framework by ID', async () => {
      const framework = {
        id: 'tf-123',
        name: 'Test Framework',
        version: '1.0',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        trustRegistries: [],
        credentialSchemas: [],
      };

      mockRequest.params = { id: 'tf-123' };
      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(framework);

      await getTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        data: framework,
      });
    });

    it('should return 404 if trust framework not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(null);

      await getTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Trust framework not found',
      });
    });
  });

  describe('updateTrustFramework', () => {
    it('should update a trust framework successfully', async () => {
      const existingFramework = {
        id: 'tf-123',
        name: 'Old Name',
        version: '1.0',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedFramework = {
        ...existingFramework,
        name: 'New Name',
        updatedAt: new Date(),
      };

      mockRequest.params = { id: 'tf-123' };
      mockRequest.body = { name: 'New Name' };

      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(existingFramework);
      (prisma.trustFramework.update as jest.Mock).mockResolvedValue(updatedFramework);

      await updateTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Trust framework updated successfully',
        data: updatedFramework,
      });
    });

    it('should return 404 if trust framework not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { name: 'New Name' };

      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(null);

      await updateTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'Trust framework not found',
      });
    });

    it('should handle database errors', async () => {
      const existingFramework = {
        id: 'tf-123',
        name: 'Old Name',
        version: '1.0',
      };

      mockRequest.params = { id: 'tf-123' };
      mockRequest.body = { name: 'New Name' };

      (prisma.trustFramework.findUnique as jest.Mock).mockResolvedValue(existingFramework);
      (prisma.trustFramework.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await updateTrustFramework(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Failed to update trust framework',
      });
    });
  });
});
