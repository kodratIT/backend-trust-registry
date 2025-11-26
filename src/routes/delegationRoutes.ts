/**
 * Delegation Routes
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
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
 * /v2/issuers/{did}/delegate:
 *   post:
 *     summary: Create a delegation
 *     description: Create a delegation from root issuer to delegate issuer
 *     tags: [Delegations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: Root issuer DID (URL-encoded)
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
 *                 description: DID of the delegate issuer
 *               scope:
 *                 type: object
 *                 description: Delegation scope (jurisdictions, credentialTypes, contexts)
 *                 properties:
 *                   jurisdictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   credentialTypes:
 *                     type: array
 *                     items:
 *                       type: string
 *                   contexts:
 *                     type: array
 *                     items:
 *                       type: string
 *               delegationProof:
 *                 type: object
 *                 description: Cryptographic proof of delegation
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Delegation created
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Root issuer not found
 *       409:
 *         description: Delegation already exists
 */
router.post('/:did/delegate', authenticate, authorize('admin', 'registry_owner'), createDelegation);

/**
 * @swagger
 * /v2/issuers/{did}/delegates:
 *   get:
 *     summary: List delegates
 *     description: List all delegates for a root issuer
 *     tags: [Delegations]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, revoked]
 *     responses:
 *       200:
 *         description: List of delegates
 *       404:
 *         description: Root issuer not found
 */
router.get('/:did/delegates', listDelegates);

/**
 * @swagger
 * /v2/issuers/{did}/delegation-chain:
 *   get:
 *     summary: Get delegation chain
 *     description: Get the full delegation chain for an issuer (max 3 levels)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     issuerDid:
 *                       type: string
 *                     chainLength:
 *                       type: integer
 *                     chain:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: integer
 *                           issuer:
 *                             type: object
 *                           delegation:
 *                             type: object
 *       404:
 *         description: Issuer not found
 */
router.get('/:did/delegation-chain', getDelegationChain);

/**
 * @swagger
 * /v2/issuers/{did}/delegates/{delegateDid}:
 *   delete:
 *     summary: Revoke delegation
 *     description: Revoke an active delegation
 *     tags: [Delegations]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: Root issuer DID
 *       - in: path
 *         name: delegateDid
 *         required: true
 *         schema:
 *           type: string
 *         description: Delegate issuer DID
 *     responses:
 *       200:
 *         description: Delegation revoked
 *       404:
 *         description: Delegation not found
 */
router.delete('/:did/delegates/:delegateDid', authenticate, authorize('admin', 'registry_owner'), revokeDelegation);

export default router;
