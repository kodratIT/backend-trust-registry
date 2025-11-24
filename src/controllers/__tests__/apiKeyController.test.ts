/**
 * API Key Controller Tests
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/unbound-method */

import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/authenticate';
import { createAPIKey, listAPIKeys, getAPIKey, deleteAPIKey } from '../apiKeyController';
import { APIKeyModel } from '../../models/APIKeyModel';

// Mock APIKeyModel
jest.mock('../../models/APIKeyModel');

describe('API Key Controller', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'admin-123',
        role: 'admin',
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAPIKey', () => {
    it('should create an API key successfully', async () => {
      mockRequest.body = {
        name: 'Test Key',
        role: 'admin',
      };

      const mockApiKey = {
        id: 'key-123',
        name: 'Test Key',
        role: 'admin',
        registryId: null,
        key: 'test-key-64-chars',
        createdAt: new Date(),
        expiresAt: null,
        lastUsedAt: null,
        keyHash: 'hash',
      };

      (APIKeyModel.create as jest.Mock).mockResolvedValue(mockApiKey);

      await createAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'API key created successfully',
        apiKey: expect.objectContaining({
          id: 'key-123',
          name: 'Test Key',
          key: 'test-key-64-chars',
        }),
        warning: 'Save this key securely. It will not be shown again.',
      });
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        role: 'admin',
      };

      await createAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Name and role are required',
      });
    });

    it('should return 400 if role is invalid', async () => {
      mockRequest.body = {
        name: 'Test Key',
        role: 'invalid_role',
      };

      await createAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: expect.stringContaining('Invalid role'),
      });
    });

    it('should return 400 if registryId is missing for registry_owner', async () => {
      mockRequest.body = {
        name: 'Test Key',
        role: 'registry_owner',
      };

      await createAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'registryId is required for registry_owner role',
      });
    });
  });

  describe('listAPIKeys', () => {
    it('should list all API keys', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Key 1',
          role: 'admin',
          registryId: null,
          keyHash: 'hash1',
          createdAt: new Date(),
          expiresAt: null,
          lastUsedAt: null,
        },
        {
          id: 'key-2',
          name: 'Key 2',
          role: 'public',
          registryId: null,
          keyHash: 'hash2',
          createdAt: new Date(),
          expiresAt: null,
          lastUsedAt: null,
        },
      ];

      (APIKeyModel.list as jest.Mock).mockResolvedValue(mockKeys);

      await listAPIKeys(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ id: 'key-1' }),
          expect.objectContaining({ id: 'key-2' }),
        ]),
        meta: {
          total: 2,
        },
      });
    });

    it('should filter by role', async () => {
      mockRequest.query = { role: 'admin' };

      const mockKeys = [
        {
          id: 'key-1',
          name: 'Admin Key',
          role: 'admin',
          registryId: null,
          keyHash: 'hash',
          createdAt: new Date(),
          expiresAt: null,
          lastUsedAt: null,
        },
      ];

      (APIKeyModel.list as jest.Mock).mockResolvedValue(mockKeys);

      await listAPIKeys(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(APIKeyModel.list).toHaveBeenCalledWith('admin');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getAPIKey', () => {
    it('should get API key by ID', async () => {
      mockRequest.params = { id: 'key-123' };

      const mockKey = {
        id: 'key-123',
        name: 'Test Key',
        role: 'admin',
        registryId: null,
        keyHash: 'hash',
        createdAt: new Date(),
        expiresAt: null,
        lastUsedAt: null,
      };

      (APIKeyModel.findById as jest.Mock).mockResolvedValue(mockKey);

      await getAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'key-123',
          name: 'Test Key',
        }),
      });
    });

    it('should return 404 if API key not found', async () => {
      mockRequest.params = { id: 'non-existent' };

      (APIKeyModel.findById as jest.Mock).mockResolvedValue(null);

      await getAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'API key not found',
      });
    });
  });

  describe('deleteAPIKey', () => {
    it('should delete API key successfully', async () => {
      mockRequest.params = { id: 'key-123' };

      const mockKey = {
        id: 'key-123',
        name: 'Test Key',
        role: 'admin',
        registryId: null,
        keyHash: 'hash',
        createdAt: new Date(),
        expiresAt: null,
        lastUsedAt: null,
      };

      (APIKeyModel.findById as jest.Mock).mockResolvedValue(mockKey);
      (APIKeyModel.delete as jest.Mock).mockResolvedValue(mockKey);

      await deleteAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'API key revoked successfully',
        data: {
          id: 'key-123',
          name: 'Test Key',
        },
      });
    });

    it('should return 404 if API key not found', async () => {
      mockRequest.params = { id: 'non-existent' };

      (APIKeyModel.findById as jest.Mock).mockResolvedValue(null);

      await deleteAPIKey(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: 'API key not found',
      });
    });
  });
});
