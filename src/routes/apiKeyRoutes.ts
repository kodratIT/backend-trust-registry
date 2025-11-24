/**
 * API Key Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import {
  createAPIKey,
  listAPIKeys,
  getAPIKey,
  deleteAPIKey,
} from '../controllers/apiKeyController';

const router = Router();

/**
 * All API key management endpoints require admin authentication
 */

/**
 * @swagger
 * /v2/api-keys:
 *   post:
 *     summary: Create a new API key
 *     description: Generate a new API key with specified role and permissions
 *     tags: [API Keys]
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
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 description: API key name
 *                 example: Production API Key
 *               role:
 *                 type: string
 *                 enum: [admin, registry_owner, public]
 *                 description: API key role
 *                 example: admin
 *               registryId:
 *                 type: string
 *                 format: uuid
 *                 description: Registry ID (required for registry_owner role)
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date
 *                 example: 2025-12-31T23:59:59Z
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key created successfully
 *                 apiKey:
 *                   allOf:
 *                     - $ref: '#/components/schemas/APIKey'
 *                     - type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           description: Plaintext API key (shown only once)
 *                           example: afe8c6f2051fe144809c93ab2df72a26eda9ba5ff35a41bff6984ce4b9de26ce
 *                 warning:
 *                   type: string
 *                   example: Save this key securely. It will not be shown again.
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticate, requireAdmin, createAPIKey);

/**
 * @swagger
 * /v2/api-keys:
 *   get:
 *     summary: List all API keys
 *     description: Retrieve a list of all API keys (without plaintext keys)
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, registry_owner, public]
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/APIKey'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticate, requireAdmin, listAPIKeys);

/**
 * @swagger
 * /v2/api-keys/{id}:
 *   get:
 *     summary: Get API key by ID
 *     description: Retrieve a single API key by its ID
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/APIKey'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authenticate, requireAdmin, getAPIKey);

/**
 * @swagger
 * /v2/api-keys/{id}:
 *   delete:
 *     summary: Revoke an API key
 *     description: Delete/revoke an API key by its ID
 *     tags: [API Keys]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API key revoked successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authenticate, requireAdmin, deleteAPIKey);

export default router;
