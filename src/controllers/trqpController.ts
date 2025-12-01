/**
 * TRQP Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles TRQP v2 protocol endpoints
 */

/* eslint-disable no-console */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import {
  validateAuthorizationRequest,
  validateRecognitionRequest,
  formatValidationErrors,
  TRQPAuthorizationRequest,
  TRQPRecognitionRequest,
} from '../schemas/trqpSchemas';
import { processAuthorizationQuery, processRecognitionQuery } from '../services/trqpService';

/**
 * Process TRQP Authorization Query
 * Swagger documentation is in routes/trqpRoutes.ts
 */
export async function authorizationQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as TRQPAuthorizationRequest;

    // Validate request against TRQP schema
    const isValid = validateAuthorizationRequest(body);
    if (!isValid) {
      res
        .status(400)
        .contentType('application/problem+json')
        .json({
          type: 'https://api.trustregistry.io/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: formatValidationErrors(validateAuthorizationRequest.errors),
          instance: req.path,
        });
      return;
    }

    // Process authorization query
    const result = await processAuthorizationQuery(body);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in authorization query:', error);
    res.status(500).contentType('application/problem+json').json({
      type: 'https://api.trustregistry.io/problems/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An error occurred processing the authorization query',
      instance: req.path,
    });
  }
}

/**
 * Process TRQP Recognition Query
 * Swagger documentation is in routes/trqpRoutes.ts
 */
export async function recognitionQuery(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const body = req.body as TRQPRecognitionRequest;

    // Validate request against TRQP schema
    const isValid = validateRecognitionRequest(body);
    if (!isValid) {
      res
        .status(400)
        .contentType('application/problem+json')
        .json({
          type: 'https://api.trustregistry.io/problems/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: formatValidationErrors(validateRecognitionRequest.errors),
          instance: req.path,
        });
      return;
    }

    // Process recognition query
    const result = await processRecognitionQuery(body);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error in recognition query:', error);
    res.status(500).contentType('application/problem+json').json({
      type: 'https://api.trustregistry.io/problems/internal-error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An error occurred processing the recognition query',
      instance: req.path,
    });
  }
}

/**
 * Get TRQP Registry Metadata
 * Swagger documentation is in routes/trqpRoutes.ts
 */
export function getMetadata(req: AuthenticatedRequest, res: Response): void {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.status(200).json({
      name: 'ToIP Trust Registry v2',
      version: '2.0.0',
      protocol: 'ToIP Trust Registry Query Protocol v2',
      specification: 'https://trustoverip.github.io/tswg-trust-registry-protocol/',
      description: 'A verifiable credentials trust registry implementing TRQP v2 specification',
      
      // Core TRQP endpoints
      endpoints: {
        authorization: '/v2/authorization',
        recognition: '/v2/recognition',
        metadata: '/v2/metadata',
        
        // Public endpoints (no auth required)
        public: {
          registries: '/v2/public/registries',
          issuers: '/v2/public/issuers',
          verifiers: '/v2/public/verifiers',
          schemas: '/v2/public/schemas',
          lookupIssuer: '/v2/public/lookup/issuer/{did}',
          lookupVerifier: '/v2/public/lookup/verifier/{did}',
        },
        
        // Management endpoints (auth required)
        management: {
          trustFrameworks: '/v2/trust-frameworks',
          registries: '/v2/registries',
          schemas: '/v2/schemas',
          issuers: '/v2/issuers',
          verifiers: '/v2/verifiers',
          recognitions: '/v2/recognitions',
          auditLog: '/v2/audit-log',
        }
      },
      
      // Supported TRQP actions
      supportedActions: [
        'issue',
        'verify',
        'recognize',
        'govern',
        'delegate'
      ],
      
      // Supported DID methods
      supportedDIDMethods: [
        'web',
        'key',
        'indy',
        'ion',
        'ethr',
        'sov'
      ],
      
      // Registry features
      features: {
        authorization: true,
        recognition: true,
        delegation: true,
        federation: true,
        signedEntries: true,
        auditLog: true,
        publicTrustedList: true,
        didResolution: true,
        caching: true,
        rateLimiting: true,
      },
      
      // Additional info
      documentation: `${baseUrl}/api-docs`,
      contact: {
        name: 'Technical Team',
        email: 'support@trustregistry.example.com',
      },
      
      // Service status
      status: 'operational',
      timestamp: new Date().toISOString(),
    });
}
