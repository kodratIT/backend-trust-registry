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
