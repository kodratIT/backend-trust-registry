/**
 * Authorization Middleware Tests
 * ToIP Trust Registry v2 Backend
 */

import { Response } from 'express';
import {
  authorize,
  requireMinimumRole,
  requireAdmin,
  requireRegistryOwner,
  requireRegistryAccess,
  allowPublic,
} from '../authorize';
import { AuthenticatedRequest } from '../authenticate';

describe('authorize middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', () => {
    const middleware = authorize('admin');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Unauthorized',
      message: 'Authentication required. Please provide a valid API key.',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if user does not have required role', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'public',
    };

    const middleware = authorize('admin');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'Access denied. Required role: admin. Your role: public',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if user has required role', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'admin',
    };

    const middleware = authorize('admin');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should allow multiple roles', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'registry_owner',
    };

    const middleware = authorize('admin', 'registry_owner');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});

describe('requireMinimumRole middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should allow admin to access registry_owner endpoints', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'admin',
    };

    const middleware = requireMinimumRole('registry_owner');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block public from accessing registry_owner endpoints', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'public',
    };

    const middleware = requireMinimumRole('registry_owner');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('requireAdmin middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should allow admin users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'admin',
    };

    requireAdmin(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block non-admin users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'registry_owner',
    };

    requireAdmin(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('requireRegistryOwner middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should allow registry_owner users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'registry_owner',
    };

    requireRegistryOwner(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should allow admin users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'admin',
    };

    requireRegistryOwner(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block public users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'public',
    };

    requireRegistryOwner(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('requireRegistryAccess middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should allow admin to access any registry', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'admin',
    };

    const middleware = requireRegistryAccess(() => 'registry-456');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should allow registry_owner to access their own registry', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'registry_owner',
      registryId: 'registry-456',
    };

    const middleware = requireRegistryAccess(() => 'registry-456');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should block registry_owner from accessing other registries', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'registry_owner',
      registryId: 'registry-123',
    };

    const middleware = requireRegistryAccess(() => 'registry-456');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Forbidden',
      message: 'You do not have access to this registry',
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should block public users', () => {
    mockRequest.user = {
      id: 'user-123',
      role: 'public',
    };

    const middleware = requireRegistryAccess(() => 'registry-456');

    middleware(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});

describe('allowPublic middleware', () => {
  it('should always call next()', () => {
    const mockRequest = {} as AuthenticatedRequest;
    const mockResponse = {} as Response;
    const nextFunction = jest.fn();

    allowPublic(mockRequest, mockResponse, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
