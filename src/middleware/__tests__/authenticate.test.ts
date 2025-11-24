/**
 * Authentication Middleware Tests
 * ToIP Trust Registry v2 Backend
 */

import { Response } from 'express';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../authenticate';
import { APIKeyModel } from '../../models/APIKeyModel';

// Mock APIKeyModel
jest.mock('../../models/APIKeyModel');

describe('authenticate middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no API key is provided', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key is required. Please provide X-API-Key header.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is invalid', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('invalid-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: false,
      reason: 'Invalid API key',
    });

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 401 if API key is expired', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('expired-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: false,
      reason: 'API key has expired',
    });

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'API key has expired',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should attach user info and call next() for valid API key', async () => {
    const mockApiKey = {
      id: 'key-123',
      role: 'admin',
      registryId: null,
      name: 'Test Key',
      keyHash: 'hash',
      createdAt: new Date(),
      expiresAt: null,
      lastUsedAt: null,
    };

    (mockRequest.header as jest.Mock).mockReturnValue('valid-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: true,
      apiKey: mockApiKey,
    });

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.apiKey).toEqual(mockApiKey);
    expect(mockRequest.user).toEqual({
      id: 'key-123',
      role: 'admin',
      registryId: undefined,
    });
    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should handle registry_owner role with registryId', async () => {
    const mockApiKey = {
      id: 'key-456',
      role: 'registry_owner',
      registryId: 'registry-123',
      name: 'Registry Key',
      keyHash: 'hash',
      createdAt: new Date(),
      expiresAt: null,
      lastUsedAt: null,
    };

    (mockRequest.header as jest.Mock).mockReturnValue('valid-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: true,
      apiKey: mockApiKey,
    });

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toEqual({
      id: 'key-456',
      role: 'registry_owner',
      registryId: 'registry-123',
    });
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should return 500 on error', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('valid-key');
    (APIKeyModel.verify as jest.Mock).mockRejectedValue(new Error('Database error'));

    await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An error occurred during authentication',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('optionalAuthenticate middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      header: jest.fn(),
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() if no API key is provided', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue(undefined);

    await optionalAuthenticate(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toBeUndefined();
  });

  it('should attach user info for valid API key', async () => {
    const mockApiKey = {
      id: 'key-123',
      role: 'admin',
      registryId: null,
      name: 'Test Key',
      keyHash: 'hash',
      createdAt: new Date(),
      expiresAt: null,
      lastUsedAt: null,
    };

    (mockRequest.header as jest.Mock).mockReturnValue('valid-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: true,
      apiKey: mockApiKey,
    });

    await optionalAuthenticate(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockRequest.user).toBeDefined();
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next() even if API key is invalid', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('invalid-key');
    (APIKeyModel.verify as jest.Mock).mockResolvedValue({
      valid: false,
      reason: 'Invalid API key',
    });

    await optionalAuthenticate(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRequest.user).toBeUndefined();
  });

  it('should call next() even on error', async () => {
    (mockRequest.header as jest.Mock).mockReturnValue('valid-key');
    (APIKeyModel.verify as jest.Mock).mockRejectedValue(new Error('Database error'));

    await optionalAuthenticate(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
