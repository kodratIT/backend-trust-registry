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
import {
  processAuthorizationQuery,
  processRecognitionQuery,
} from '../services/trqpService';

/**
 * @swagger
 * /v2/authorization:
 *   post:
 *     summary: TRQP Authorization Query
 *     description: |
 *       Query if an entity is authorized to perform an action on a resource.
 *       Follows TRQP v2 specification.
 *     tags: [TRQP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entity_id
 *               - authority_id
 *               - action
 *               - resource
 *             properties:
 *               entity_id:
 *                 type: string
 *                 description: DID of the entity being queried
 *                 example: did:web:university.edu
 *               authority_id:
 *                 type: string
 *                 description: DID of the authority (ecosystem)
 *                 example: did:web:education-trust.org
 *               action:
 *                 type: string
 *                 description: Action to check (issue, verify)
 *                 example: issue
 *               resource:
 *                 type: string
 *                 description: Resource/credential type
 *                 example: UniversityDegree
 *               context:
 *                 type: object
 *                 properties:
 *                   time:
 *                     type: string
 *                     format: date-time
 *                     description: Time for validity check (RFC3339)
 *     responses:
 *       200:
 *         description: Authorization query result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entity_id:
 *                   type: string
 *                 authority_id:
 *                   type: string
 *                 action:
 *                   type: string
 *                 resource:
 *                   type: string
 *                 authorized:
 *                   type: boolean
 *                 time_evaluated:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 */
export async function authorizationQuery(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as TRQPAuthorizationRequest;

    // Validate request against TRQP schema
    const isValid = validateAuthorizationRequest(body);
    if (!isValid) {
      res.status(400).contentType('application/problem+json').json({
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
 * @swagger
 * /v2/recognition:
 *   post:
 *     summary: TRQP Recognition Query
 *     description: |
 *       Query if an authority recognizes another entity as an authority.
 *       Follows TRQP v2 specification.
 *       Note: Full implementation available after Sprint 2.
 *     tags: [TRQP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entity_id
 *               - authority_id
 *               - action
 *               - resource
 *             properties:
 *               entity_id:
 *                 type: string
 *                 description: DID of the entity (another authority)
 *                 example: did:web:other-registry.org
 *               authority_id:
 *                 type: string
 *                 description: DID of the recognizing authority
 *                 example: did:web:our-registry.org
 *               action:
 *                 type: string
 *                 description: Action scope (recognize, govern)
 *                 example: govern
 *               resource:
 *                 type: string
 *                 description: Resource scope
 *                 example: professional-licenses
 *               context:
 *                 type: object
 *                 properties:
 *                   time:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: Recognition query result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entity_id:
 *                   type: string
 *                 authority_id:
 *                   type: string
 *                 action:
 *                   type: string
 *                 resource:
 *                   type: string
 *                 recognized:
 *                   type: boolean
 *                 time_evaluated:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 */
export async function recognitionQuery(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const body = req.body as TRQPRecognitionRequest;

    // Validate request against TRQP schema
    const isValid = validateRecognitionRequest(body);
    if (!isValid) {
      res.status(400).contentType('application/problem+json').json({
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
