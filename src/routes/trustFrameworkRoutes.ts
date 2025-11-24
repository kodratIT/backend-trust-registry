/**
 * Trust Framework Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createTrustFramework,
  listTrustFrameworks,
  getTrustFramework,
  updateTrustFramework,
} from '../controllers/trustFrameworkController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import {
  createTrustFrameworkSchema,
  updateTrustFrameworkSchema,
} from '../schemas/trustFrameworkSchemas';

const router = Router();

/**
 * @swagger
 * /v2/trust-frameworks:
 *   post:
 *     summary: Create a new trust framework
 *     description: Create a new trust framework (admin only)
 *     tags: [Trust Frameworks]
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
 *               - version
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: EU Digital Identity Framework
 *               version:
 *                 type: string
 *                 maxLength: 50
 *                 example: 1.0
 *               description:
 *                 type: string
 *                 example: European Union Digital Identity Framework
 *               governanceFrameworkUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/governance.pdf
 *               legalAgreements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 example: ["https://example.com/terms.pdf"]
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["EU", "DE", "FR"]
 *               contexts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://www.w3.org/2018/credentials/v1"]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, deprecated]
 *                 example: active
 *     responses:
 *       201:
 *         description: Trust framework created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trust framework created successfully
 *                 data:
 *                   $ref: '#/components/schemas/TrustFramework'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
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
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate(createTrustFrameworkSchema),
  createTrustFramework
);

/**
 * @swagger
 * /v2/trust-frameworks:
 *   get:
 *     summary: List all trust frameworks
 *     description: Retrieve a paginated list of trust frameworks with optional filtering
 *     tags: [Trust Frameworks]
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
 *         name: jurisdiction
 *         schema:
 *           type: string
 *         description: Filter by jurisdiction code
 *     responses:
 *       200:
 *         description: List of trust frameworks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TrustFramework'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Bad request (invalid parameters)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listTrustFrameworks);

/**
 * @swagger
 * /v2/trust-frameworks/{id}:
 *   get:
 *     summary: Get trust framework by ID
 *     description: Retrieve a single trust framework with related data
 *     tags: [Trust Frameworks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trust framework ID
 *     responses:
 *       200:
 *         description: Trust framework details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/TrustFramework'
 *                     - type: object
 *                       properties:
 *                         trustRegistries:
 *                           type: array
 *                           items:
 *                             type: object
 *                         credentialSchemas:
 *                           type: array
 *                           items:
 *                             type: object
 *       404:
 *         description: Trust framework not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getTrustFramework);

/**
 * @swagger
 * /v2/trust-frameworks/{id}:
 *   put:
 *     summary: Update a trust framework
 *     description: Update an existing trust framework (admin only)
 *     tags: [Trust Frameworks]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trust framework ID
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
 *               version:
 *                 type: string
 *                 maxLength: 50
 *               description:
 *                 type: string
 *                 nullable: true
 *               governanceFrameworkUrl:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *               legalAgreements:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 nullable: true
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *               contexts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *               status:
 *                 type: string
 *                 enum: [active, inactive, deprecated]
 *     responses:
 *       200:
 *         description: Trust framework updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trust framework updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/TrustFramework'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
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
 *         description: Trust framework not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate(updateTrustFrameworkSchema),
  updateTrustFramework
);

export default router;
