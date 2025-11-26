/**
 * Trust Registry Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createTrustRegistry,
  listTrustRegistries,
  getTrustRegistry,
  updateTrustRegistry,
} from '../controllers/trustRegistryController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin, authorize } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import {
  createTrustRegistrySchema,
  updateTrustRegistrySchema,
} from '../schemas/trustRegistrySchemas';

const router = Router();

/**
 * @swagger
 * /v2/registries:
 *   post:
 *     summary: Create a new trust registry
 *     description: Create a new trust registry (admin only)
 *     tags: [Trust Registries]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - ecosystemDid
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: My Trust Registry
 *               description:
 *                 type: string
 *                 example: A trust registry for verifiable credentials
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the associated trust framework
 *               ecosystemDid:
 *                 type: string
 *                 maxLength: 500
 *                 example: did:web:example.com
 *               governanceAuthority:
 *                 type: string
 *                 maxLength: 500
 *                 example: https://example.com/governance
 *               status:
 *                 type: string
 *                 enum: [active, inactive, deprecated]
 *                 default: active
 *     responses:
 *       201:
 *         description: Trust registry created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       409:
 *         description: Conflict - ecosystemDid already exists
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createTrustRegistrySchema),
  createTrustRegistry
);

/**
 * @swagger
 * /v2/registries:
 *   get:
 *     summary: List all trust registries
 *     description: Retrieve a paginated list of trust registries with optional filtering
 *     tags: [Trust Registries]
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
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deprecated]
 *         description: Filter by status
 *       - in: query
 *         name: trustFrameworkId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by trust framework ID
 *       - in: query
 *         name: ecosystemDid
 *         schema:
 *           type: string
 *         description: Filter by ecosystem DID (partial match)
 *     responses:
 *       200:
 *         description: List of trust registries
 *       400:
 *         description: Bad request (invalid parameters)
 */
router.get('/', listTrustRegistries);

/**
 * @swagger
 * /v2/registries/{id}:
 *   get:
 *     summary: Get trust registry by ID
 *     description: Retrieve a single trust registry with related data
 *     tags: [Trust Registries]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trust registry ID
 *     responses:
 *       200:
 *         description: Trust registry details
 *       404:
 *         description: Trust registry not found
 */
router.get('/:id', getTrustRegistry);

/**
 * @swagger
 * /v2/registries/{id}:
 *   put:
 *     summary: Update a trust registry
 *     description: Update an existing trust registry (admin or registry owner only)
 *     tags: [Trust Registries]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trust registry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *               governanceAuthority:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, deprecated]
 *     responses:
 *       200:
 *         description: Trust registry updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trust registry not found
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'registry_owner'),
  validate(updateTrustRegistrySchema),
  updateTrustRegistry
);

export default router;
