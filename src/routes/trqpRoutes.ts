/**
 * TRQP Routes
 * ToIP Trust Registry v2 Backend
 *
 * TRQP v2 protocol endpoints
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import { authorizationQuery, recognitionQuery } from '../controllers/trqpController';
import { optionalAuthenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /v2/authorization:
 *   post:
 *     summary: TRQP Authorization Query
 *     description: |
 *       Query if an entity is authorized to perform an action on a resource.
 *       This endpoint follows the TRQP v2 specification for trust resolution.
 *
 *       **Use Cases:**
 *       - Check if an issuer can issue a specific credential type
 *       - Check if a verifier can verify a specific credential type
 *       - Validate authorization at a specific point in time
 *     tags: [TRQP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TRQPAuthorizationRequest'
 *           examples:
 *             issuer_check:
 *               summary: Check issuer authorization
 *               value:
 *                 entity_id: "did:web:university.edu"
 *                 authority_id: "did:web:education-trust.org"
 *                 action: "issue"
 *                 resource: "UniversityDegree"
 *             verifier_check:
 *               summary: Check verifier authorization
 *               value:
 *                 entity_id: "did:web:employer.com"
 *                 authority_id: "did:web:education-trust.org"
 *                 action: "verify"
 *                 resource: "UniversityDegree"
 *             time_check:
 *               summary: Check at specific time
 *               value:
 *                 entity_id: "did:web:university.edu"
 *                 authority_id: "did:web:education-trust.org"
 *                 action: "issue"
 *                 resource: "UniversityDegree"
 *                 context:
 *                   time: "2024-06-15T10:00:00Z"
 *     responses:
 *       200:
 *         description: Authorization query result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TRQPAuthorizationResponse'
 *             examples:
 *               authorized:
 *                 summary: Entity is authorized
 *                 value:
 *                   entity_id: "did:web:university.edu"
 *                   authority_id: "did:web:education-trust.org"
 *                   action: "issue"
 *                   resource: "UniversityDegree"
 *                   authorized: true
 *                   time_evaluated: "2024-11-27T10:00:00Z"
 *                   message: "did:web:university.edu is authorized for issue+UniversityDegree by did:web:education-trust.org"
 *               not_authorized:
 *                 summary: Entity is not authorized
 *                 value:
 *                   entity_id: "did:web:unknown.edu"
 *                   authority_id: "did:web:education-trust.org"
 *                   action: "issue"
 *                   resource: "UniversityDegree"
 *                   authorized: false
 *                   time_evaluated: "2024-11-27T10:00:00Z"
 *                   message: "Entity 'did:web:unknown.edu' not found in registry"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 *       500:
 *         description: Internal server error
 */
router.post('/authorization', optionalAuthenticate, authorizationQuery);

/**
 * @swagger
 * /v2/recognition:
 *   post:
 *     summary: TRQP Recognition Query
 *     description: |
 *       Query if an authority recognizes another entity as an authority.
 *       This enables inter-registry trust relationships and federation.
 *
 *       **Use Cases:**
 *       - Check if one registry recognizes another registry's governance
 *       - Validate cross-ecosystem trust relationships
 *       - Federation queries between trust registries
 *     tags: [TRQP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TRQPRecognitionRequest'
 *           examples:
 *             govern_check:
 *               summary: Check governance recognition
 *               value:
 *                 entity_id: "did:web:other-registry.org"
 *                 authority_id: "did:web:our-registry.org"
 *                 action: "govern"
 *                 resource: "professional-licenses"
 *             recognize_check:
 *               summary: Check general recognition
 *               value:
 *                 entity_id: "did:web:partner-registry.org"
 *                 authority_id: "did:web:our-registry.org"
 *                 action: "recognize"
 *                 resource: "education-credentials"
 *     responses:
 *       200:
 *         description: Recognition query result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TRQPRecognitionResponse'
 *             examples:
 *               recognized:
 *                 summary: Entity is recognized
 *                 value:
 *                   entity_id: "did:web:other-registry.org"
 *                   authority_id: "did:web:our-registry.org"
 *                   action: "govern"
 *                   resource: "professional-licenses"
 *                   recognized: true
 *                   time_evaluated: "2024-11-27T10:00:00Z"
 *                   message: "did:web:other-registry.org is recognized by did:web:our-registry.org for govern+professional-licenses"
 *               not_recognized:
 *                 summary: Entity is not recognized
 *                 value:
 *                   entity_id: "did:web:unknown-registry.org"
 *                   authority_id: "did:web:our-registry.org"
 *                   action: "govern"
 *                   resource: "professional-licenses"
 *                   recognized: false
 *                   time_evaluated: "2024-11-27T10:00:00Z"
 *                   message: "did:web:unknown-registry.org is NOT recognized by did:web:our-registry.org"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/problem+json:
 *             schema:
 *               $ref: '#/components/schemas/ProblemDetails'
 *       500:
 *         description: Internal server error
 */
router.post('/recognition', optionalAuthenticate, recognitionQuery);

export default router;
