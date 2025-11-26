/**
 * Query Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import { singleQuery, batchQuery, queryIssuers, queryVerifiers } from '../controllers/queryController';

const router = Router();

/**
 * @swagger
 * /v2/query:
 *   post:
 *     summary: Single trust resolution query
 *     description: Query for a single issuer or verifier with filters
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entityType
 *             properties:
 *               entityType:
 *                 type: string
 *                 enum: [issuer, verifier]
 *                 description: Type of entity to query
 *               did:
 *                 type: string
 *                 description: DID of the entity
 *               credentialType:
 *                 type: string
 *                 description: Filter by credential type
 *               registryId:
 *                 type: string
 *                 format: uuid
 *                 description: Filter by registry
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *                 description: Filter by trust framework
 *               jurisdiction:
 *                 type: string
 *                 description: Filter by jurisdiction code
 *               context:
 *                 type: string
 *                 description: Filter by context
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, revoked]
 *                 default: active
 *               accreditationLevel:
 *                 type: string
 *                 enum: [high, medium, low]
 *               validAt:
 *                 type: string
 *                 format: date-time
 *                 description: Check validity at specific date
 *     responses:
 *       200:
 *         description: Query result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     found:
 *                       type: boolean
 *                     entityType:
 *                       type: string
 *                     entity:
 *                       type: object
 *                     registry:
 *                       type: object
 *                     trustFramework:
 *                       type: object
 *                     credentialTypes:
 *                       type: array
 *                     queryTime:
 *                       type: number
 *       400:
 *         description: Invalid query parameters
 */
router.post('/', singleQuery);

/**
 * @swagger
 * /v2/query/batch:
 *   post:
 *     summary: Batch trust resolution queries
 *     description: Execute multiple queries in a single request (max 100)
 *     tags: [Query]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - queries
 *             properties:
 *               queries:
 *                 type: array
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - entityType
 *                   properties:
 *                     entityType:
 *                       type: string
 *                       enum: [issuer, verifier]
 *                     did:
 *                       type: string
 *                     credentialType:
 *                       type: string
 *                     registryId:
 *                       type: string
 *                     jurisdiction:
 *                       type: string
 *                     context:
 *                       type: string
 *                     status:
 *                       type: string
 *                     validAt:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Batch query results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                     totalQueries:
 *                       type: integer
 *                     successCount:
 *                       type: integer
 *                     failureCount:
 *                       type: integer
 *                     totalTime:
 *                       type: number
 *       400:
 *         description: Invalid batch query
 */
router.post('/batch', batchQuery);

/**
 * @swagger
 * /v2/query/issuers:
 *   get:
 *     summary: Query issuers
 *     description: Query issuers with filters and pagination
 *     tags: [Query]
 *     parameters:
 *       - in: query
 *         name: did
 *         schema:
 *           type: string
 *         description: Filter by DID
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *         description: Filter by credential type
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: trustFrameworkId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: jurisdiction
 *         schema:
 *           type: string
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, suspended, revoked]
 *           default: active
 *       - in: query
 *         name: accreditationLevel
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *       - in: query
 *         name: validAt
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: List of matching issuers
 */
router.get('/issuers', queryIssuers);

/**
 * @swagger
 * /v2/query/verifiers:
 *   get:
 *     summary: Query verifiers
 *     description: Query verifiers with filters and pagination
 *     tags: [Query]
 *     parameters:
 *       - in: query
 *         name: did
 *         schema:
 *           type: string
 *       - in: query
 *         name: credentialType
 *         schema:
 *           type: string
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: trustFrameworkId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: jurisdiction
 *         schema:
 *           type: string
 *       - in: query
 *         name: context
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: active
 *       - in: query
 *         name: accreditationLevel
 *         schema:
 *           type: string
 *       - in: query
 *         name: validAt
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of matching verifiers
 */
router.get('/verifiers', queryVerifiers);

export default router;
