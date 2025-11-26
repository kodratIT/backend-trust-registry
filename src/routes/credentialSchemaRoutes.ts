/**
 * Credential Schema Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createCredentialSchema,
  listCredentialSchemas,
  getCredentialSchema,
  updateCredentialSchema,
  linkSchemaToRegistry,
  deleteCredentialSchema,
  validateAgainstSchema,
} from '../controllers/credentialSchemaController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin, authorize } from '../middleware/authorize';
import { validate } from '../middleware/validation';
import {
  createCredentialSchemaSchema,
  updateCredentialSchemaSchema,
} from '../schemas/credentialSchemaSchemas';

const router = Router();

/**
 * @swagger
 * /v2/schemas:
 *   post:
 *     summary: Create a new credential schema
 *     description: Create a new credential schema (admin or registry owner only)
 *     tags: [Credential Schemas]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registryId
 *               - name
 *               - version
 *               - type
 *               - jsonSchema
 *               - issuerMode
 *               - verifierMode
 *             properties:
 *               registryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the trust registry
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the associated trust framework
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 example: VerifiableCredential
 *               version:
 *                 type: string
 *                 pattern: ^[0-9]+\.[0-9]+\.[0-9]+$
 *                 example: "1.0.0"
 *               type:
 *                 type: string
 *                 maxLength: 500
 *                 example: EducationCredential
 *               jsonSchema:
 *                 type: object
 *                 description: JSON Schema definition for the credential
 *               contexts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of allowed contexts
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of jurisdictions
 *               issuerMode:
 *                 type: string
 *                 enum: [OPEN, ECOSYSTEM, GRANTOR]
 *                 description: Mode for issuer authorization
 *               verifierMode:
 *                 type: string
 *                 enum: [OPEN, ECOSYSTEM, GRANTOR]
 *                 description: Mode for verifier authorization
 *     responses:
 *       201:
 *         description: Credential schema created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Registry not found
 *       409:
 *         description: Conflict - schema already exists
 */
router.post(
  '/',
  authenticate,
  authorize('admin', 'registry_owner'),
  validate(createCredentialSchemaSchema),
  createCredentialSchema
);

/**
 * @swagger
 * /v2/schemas:
 *   get:
 *     summary: List all credential schemas
 *     description: Retrieve a paginated list of credential schemas with optional filtering
 *     tags: [Credential Schemas]
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
 *         name: registryId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by registry ID
 *       - in: query
 *         name: trustFrameworkId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by trust framework ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by credential type (partial match)
 *       - in: query
 *         name: issuerMode
 *         schema:
 *           type: string
 *           enum: [OPEN, ECOSYSTEM, GRANTOR]
 *         description: Filter by issuer mode
 *       - in: query
 *         name: verifierMode
 *         schema:
 *           type: string
 *           enum: [OPEN, ECOSYSTEM, GRANTOR]
 *         description: Filter by verifier mode
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial match)
 *     responses:
 *       200:
 *         description: List of credential schemas
 *       400:
 *         description: Bad request (invalid parameters)
 */
router.get('/', listCredentialSchemas);


/**
 * @swagger
 * /v2/schemas/{id}:
 *   get:
 *     summary: Get credential schema by ID
 *     description: Retrieve a single credential schema with related data
 *     tags: [Credential Schemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credential schema ID
 *     responses:
 *       200:
 *         description: Credential schema details
 *       404:
 *         description: Credential schema not found
 */
router.get('/:id', getCredentialSchema);

/**
 * @swagger
 * /v2/schemas/{id}:
 *   put:
 *     summary: Update a credential schema
 *     description: Update an existing credential schema (admin or registry owner only)
 *     tags: [Credential Schemas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credential schema ID
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
 *                 pattern: ^[0-9]+\.[0-9]+\.[0-9]+$
 *               type:
 *                 type: string
 *               jsonSchema:
 *                 type: object
 *               contexts:
 *                 type: array
 *                 items:
 *                   type: string
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               issuerMode:
 *                 type: string
 *                 enum: [OPEN, ECOSYSTEM, GRANTOR]
 *               verifierMode:
 *                 type: string
 *                 enum: [OPEN, ECOSYSTEM, GRANTOR]
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Credential schema updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Credential schema not found
 *       409:
 *         description: Version conflict
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'registry_owner'),
  validate(updateCredentialSchemaSchema),
  updateCredentialSchema
);

/**
 * @swagger
 * /v2/schemas/{id}/registry:
 *   patch:
 *     summary: Link schema to registry
 *     description: Link a credential schema to a different registry (admin or registry owner)
 *     tags: [Credential Schemas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credential schema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - registryId
 *             properties:
 *               registryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the registry to link
 *     responses:
 *       200:
 *         description: Schema linked to registry successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schema or registry not found
 */
router.patch(
  '/:id/registry',
  authenticate,
  authorize('admin', 'registry_owner'),
  linkSchemaToRegistry
);

/**
 * @swagger
 * /v2/schemas/{id}:
 *   delete:
 *     summary: Delete a credential schema
 *     description: Delete a credential schema (admin only). Cannot delete if in use.
 *     tags: [Credential Schemas]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credential schema ID
 *     responses:
 *       200:
 *         description: Credential schema deleted successfully
 *       400:
 *         description: Cannot delete schema in use
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin role required
 *       404:
 *         description: Credential schema not found
 */
router.delete('/:id', authenticate, requireAdmin, deleteCredentialSchema);

/**
 * @swagger
 * /v2/schemas/{id}/validate:
 *   post:
 *     summary: Validate data against schema
 *     description: Validate credential data against a schema's JSON Schema definition
 *     tags: [Credential Schemas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Credential schema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - data
 *             properties:
 *               data:
 *                 type: object
 *                 description: The data to validate against the schema
 *     responses:
 *       200:
 *         description: Validation result
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
 *                     valid:
 *                       type: boolean
 *                     schemaId:
 *                       type: string
 *                     schemaName:
 *                       type: string
 *                     schemaVersion:
 *                       type: string
 *                     errors:
 *                       type: array
 *       400:
 *         description: Bad request
 *       404:
 *         description: Schema not found
 */
router.post('/:id/validate', validateAgainstSchema);

export default router;
