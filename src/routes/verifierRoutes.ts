/**
 * Verifier Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createVerifier,
  listVerifiers,
  getVerifier,
  updateVerifier,
  updateVerifierStatus,
  addVerifierCredentialType,
  removeVerifierCredentialType,
} from '../controllers/verifierController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /v2/verifiers:
 *   post:
 *     summary: Register a new verifier
 *     tags: [Verifiers]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - did
 *               - registryId
 *             properties:
 *               did:
 *                 type: string
 *               name:
 *                 type: string
 *               registryId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, revoked]
 *               jurisdictions:
 *                 type: array
 *               accreditationLevel:
 *                 type: string
 *                 enum: [high, medium, low]
 *     responses:
 *       201:
 *         description: Verifier registered
 *       409:
 *         description: DID already exists
 */
router.post('/', authenticate, authorize('admin', 'registry_owner'), createVerifier);

/**
 * @swagger
 * /v2/verifiers:
 *   get:
 *     summary: List all verifiers
 *     tags: [Verifiers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of verifiers
 */
router.get('/', listVerifiers);

/**
 * @swagger
 * /v2/verifiers/{did}:
 *   get:
 *     summary: Get verifier by DID
 *     tags: [Verifiers]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verifier details
 *       404:
 *         description: Not found
 */
router.get('/:did', getVerifier);

/**
 * @swagger
 * /v2/verifiers/{did}:
 *   put:
 *     summary: Update verifier
 *     tags: [Verifiers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Not found
 */
router.put('/:did', authenticate, authorize('admin', 'registry_owner'), updateVerifier);

/**
 * @swagger
 * /v2/verifiers/{did}/status:
 *   patch:
 *     summary: Update verifier status
 *     tags: [Verifiers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, revoked]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid transition
 */
router.patch('/:did/status', authenticate, authorize('admin', 'registry_owner'), updateVerifierStatus);

/**
 * @swagger
 * /v2/verifiers/{did}/credential-types:
 *   post:
 *     summary: Add credential type to verifier
 *     tags: [Verifiers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schemaId
 *             properties:
 *               schemaId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Added
 *       409:
 *         description: Already linked
 */
router.post('/:did/credential-types', authenticate, authorize('admin', 'registry_owner'), addVerifierCredentialType);

/**
 * @swagger
 * /v2/verifiers/{did}/credential-types/{schemaId}:
 *   delete:
 *     summary: Remove credential type from verifier
 *     tags: [Verifiers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: schemaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed
 *       404:
 *         description: Not found
 */
router.delete('/:did/credential-types/:schemaId', authenticate, authorize('admin', 'registry_owner'), removeVerifierCredentialType);

export default router;
