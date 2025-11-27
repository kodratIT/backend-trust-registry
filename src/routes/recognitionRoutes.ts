/**
 * Recognition Routes
 * ToIP Trust Registry v2 Backend
 *
 * CRUD routes for Registry Recognition management
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createRecognition,
  listRecognitions,
  getRecognition,
  deleteRecognition,
} from '../controllers/recognitionController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /v2/recognitions:
 *   post:
 *     summary: Create a recognition relationship
 *     description: |
 *       Create a new inter-registry recognition relationship.
 *       This allows one registry to formally recognize another registry's authority
 *       for specific actions and resources.
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authorityRegistryId
 *               - entityId
 *               - action
 *               - resource
 *             properties:
 *               authorityRegistryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the authority registry making the recognition
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               entityId:
 *                 type: string
 *                 description: DID of the entity being recognized
 *                 example: did:web:other-registry.org
 *               action:
 *                 type: string
 *                 description: Action scope (govern, recognize)
 *                 example: govern
 *               resource:
 *                 type: string
 *                 description: Resource scope
 *                 example: professional-licenses
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *                 description: Start of validity period
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *                 description: End of validity period
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Recognition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Recognition'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Authority registry not found
 *       409:
 *         description: Recognition already exists
 */
router.post('/', authenticate, requireAdmin, createRecognition);

/**
 * @swagger
 * /v2/recognitions:
 *   get:
 *     summary: List all recognitions
 *     description: Retrieve a paginated list of recognition relationships with optional filtering
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: authorityId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by authority registry ID
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by entity DID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *     responses:
 *       200:
 *         description: List of recognitions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recognition'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 */
router.get('/', authenticate, requireAdmin, listRecognitions);

/**
 * @swagger
 * /v2/recognitions/{id}:
 *   get:
 *     summary: Get recognition by ID
 *     description: Retrieve a single recognition relationship by its ID
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recognition ID
 *     responses:
 *       200:
 *         description: Recognition details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Recognition'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Recognition not found
 */
router.get('/:id', authenticate, requireAdmin, getRecognition);

/**
 * @swagger
 * /v2/recognitions/{id}:
 *   delete:
 *     summary: Revoke a recognition
 *     description: Delete/revoke an existing recognition relationship
 *     tags: [Recognitions]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recognition ID
 *     responses:
 *       200:
 *         description: Recognition revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Recognition not found
 */
router.delete('/:id', authenticate, requireAdmin, deleteRecognition);

export default router;
