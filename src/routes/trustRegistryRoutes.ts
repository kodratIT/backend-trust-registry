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
  linkTrustFramework,
  unlinkTrustFramework,
  verifyDID,
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
 * /v2/registries/verify-did:
 *   post:
 *     summary: Verify/resolve a DID
 *     description: Validate DID format and attempt to resolve it
 *     tags: [Trust Registries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - did
 *             properties:
 *               did:
 *                 type: string
 *                 example: did:web:example.com
 *                 description: The DID to verify
 *     responses:
 *       200:
 *         description: DID verification result
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
 *                     did:
 *                       type: string
 *                     valid:
 *                       type: boolean
 *                     method:
 *                       type: string
 *                     didDocument:
 *                       type: object
 *                     error:
 *                       type: string
 *       400:
 *         description: Invalid DID format
 */
router.post('/verify-did', verifyDID);

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

/**
 * @swagger
 * /v2/registries/{id}/trust-framework:
 *   patch:
 *     summary: Link registry to trust framework
 *     description: Link a trust registry to a trust framework (admin or registry owner)
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
 *             required:
 *               - trustFrameworkId
 *             properties:
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the trust framework to link
 *     responses:
 *       200:
 *         description: Registry linked to trust framework successfully
 *       400:
 *         description: Bad request (invalid trust framework or inactive)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Registry or trust framework not found
 */
router.patch(
  '/:id/trust-framework',
  authenticate,
  authorize('admin', 'registry_owner'),
  linkTrustFramework
);

/**
 * @swagger
 * /v2/registries/{id}/trust-framework:
 *   delete:
 *     summary: Unlink registry from trust framework
 *     description: Remove the link between a trust registry and its trust framework
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
 *     responses:
 *       200:
 *         description: Registry unlinked from trust framework successfully
 *       400:
 *         description: Registry is not linked to any trust framework
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Registry not found
 */
router.delete(
  '/:id/trust-framework',
  authenticate,
  authorize('admin', 'registry_owner'),
  unlinkTrustFramework
);

export default router;
