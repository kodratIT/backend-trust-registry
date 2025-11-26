/**
 * Issuer Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createIssuer,
  listIssuers,
  getIssuer,
  updateIssuer,
  updateIssuerStatus,
  getIssuerStatusHistory,
  addCredentialType,
  removeCredentialType,
} from '../controllers/issuerController';
import {
  createDelegation,
  listDelegates,
  getDelegationChain,
  revokeDelegation,
} from '../controllers/delegationController';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

/**
 * @swagger
 * /v2/issuers:
 *   post:
 *     summary: Register a new issuer
 *     description: Register a new issuer in a trust registry (admin or registry owner only)
 *     tags: [Issuers]
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
 *                 example: did:web:issuer.example.com
 *               name:
 *                 type: string
 *                 example: Example University
 *               registryId:
 *                 type: string
 *                 format: uuid
 *               trustFrameworkId:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, revoked]
 *                 default: pending
 *               jurisdictions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                     name:
 *                       type: string
 *               contexts:
 *                 type: array
 *                 items:
 *                   type: string
 *               accreditationLevel:
 *                 type: string
 *                 enum: [high, medium, low]
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               endpoint:
 *                 type: string
 *               credentialTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of credential schema IDs
 *     responses:
 *       201:
 *         description: Issuer registered successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Registry not found
 *       409:
 *         description: Issuer DID already exists
 */
router.post('/', authenticate, authorize('admin', 'registry_owner'), createIssuer);

/**
 * @swagger
 * /v2/issuers:
 *   get:
 *     summary: List all issuers
 *     description: Retrieve a paginated list of issuers with filtering
 *     tags: [Issuers]
 *     parameters:
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
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, suspended, revoked]
 *       - in: query
 *         name: jurisdiction
 *         schema:
 *           type: string
 *         description: Filter by jurisdiction code
 *       - in: query
 *         name: accreditationLevel
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *       - in: query
 *         name: did
 *         schema:
 *           type: string
 *         description: Filter by DID (partial match)
 *     responses:
 *       200:
 *         description: List of issuers
 */
router.get('/', listIssuers);

/**
 * @swagger
 * /v2/issuers/{did}:
 *   get:
 *     summary: Get issuer by DID
 *     description: Retrieve a single issuer with related data
 *     tags: [Issuers]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: URL-encoded issuer DID
 *     responses:
 *       200:
 *         description: Issuer details
 *       404:
 *         description: Issuer not found
 */
router.get('/:did', getIssuer);

/**
 * @swagger
 * /v2/issuers/{did}:
 *   put:
 *     summary: Update issuer
 *     description: Update issuer information (admin or registry owner only)
 *     tags: [Issuers]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               jurisdictions:
 *                 type: array
 *               contexts:
 *                 type: array
 *               accreditationLevel:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               endpoint:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Issuer updated successfully
 *       404:
 *         description: Issuer not found
 */
router.put('/:did', authenticate, authorize('admin', 'registry_owner'), updateIssuer);


/**
 * @swagger
 * /v2/issuers/{did}/status:
 *   patch:
 *     summary: Update issuer status
 *     description: Update issuer status with validation of allowed transitions
 *     tags: [Issuers]
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
 *                 description: Reason for status change
 *               statusDetails:
 *                 type: object
 *                 description: Additional status details
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Issuer not found
 */
router.patch('/:did/status', authenticate, authorize('admin', 'registry_owner'), updateIssuerStatus);

/**
 * @swagger
 * /v2/issuers/{did}/status-history:
 *   get:
 *     summary: Get issuer status history
 *     description: Retrieve the status change history for an issuer
 *     tags: [Issuers]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Status history
 *       404:
 *         description: Issuer not found
 */
router.get('/:did/status-history', getIssuerStatusHistory);

/**
 * @swagger
 * /v2/issuers/{did}/credential-types:
 *   post:
 *     summary: Add credential type to issuer
 *     description: Link a credential schema to an issuer
 *     tags: [Issuers]
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
 *         description: Credential type added
 *       404:
 *         description: Issuer or schema not found
 *       409:
 *         description: Already linked
 */
router.post('/:did/credential-types', authenticate, authorize('admin', 'registry_owner'), addCredentialType);

/**
 * @swagger
 * /v2/issuers/{did}/credential-types/{schemaId}:
 *   delete:
 *     summary: Remove credential type from issuer
 *     description: Unlink a credential schema from an issuer
 *     tags: [Issuers]
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
 *           format: uuid
 *     responses:
 *       200:
 *         description: Credential type removed
 *       404:
 *         description: Not found
 */
router.delete('/:did/credential-types/:schemaId', authenticate, authorize('admin', 'registry_owner'), removeCredentialType);

export default router;


// Delegation routes
/**
 * @swagger
 * /v2/issuers/{did}/delegate:
 *   post:
 *     summary: Create a delegation
 *     tags: [Delegations]
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
 *               - delegateDid
 *               - scope
 *               - delegationProof
 *             properties:
 *               delegateDid:
 *                 type: string
 *               scope:
 *                 type: object
 *               delegationProof:
 *                 type: object
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Delegation created
 */
router.post('/:did/delegate', authenticate, authorize('admin', 'registry_owner'), createDelegation);

/**
 * @swagger
 * /v2/issuers/{did}/delegates:
 *   get:
 *     summary: List delegates for an issuer
 *     tags: [Delegations]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of delegates
 */
router.get('/:did/delegates', listDelegates);

/**
 * @swagger
 * /v2/issuers/{did}/delegation-chain:
 *   get:
 *     summary: Get delegation chain
 *     tags: [Delegations]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delegation chain
 */
router.get('/:did/delegation-chain', getDelegationChain);

/**
 * @swagger
 * /v2/issuers/{did}/delegates/{delegateDid}:
 *   delete:
 *     summary: Revoke delegation
 *     tags: [Delegations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: delegateDid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delegation revoked
 */
router.delete('/:did/delegates/:delegateDid', authenticate, authorize('admin', 'registry_owner'), revokeDelegation);
