/**
 * Signed Entry Routes
 * ToIP Trust Registry v2 Backend
 */

import { Router } from 'express';
import {
  getSignedIssuerEntry,
  verifyIssuerEntry,
  getSignedVerifierEntry,
  verifyVerifierEntry,
  getRegistryDidDocument,
} from '../controllers/signedEntryController';
import { optionalAuthenticate } from '../middleware/authenticate';

const router = Router();

/**
 * @swagger
 * /v2/issuers/{did}/entry:
 *   get:
 *     summary: Get signed issuer registry entry
 *     tags: [Signed Entries]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: Issuer DID
 *     responses:
 *       200:
 *         description: Signed issuer entry
 *       404:
 *         description: Issuer not found
 */
router.get('/issuers/:did/entry', optionalAuthenticate, getSignedIssuerEntry);

/**
 * @swagger
 * /v2/issuers/{did}/entry/verify:
 *   post:
 *     summary: Verify issuer entry signature
 *     tags: [Signed Entries]
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
 *             properties:
 *               entry:
 *                 type: object
 *               proof:
 *                 type: object
 *     responses:
 *       200:
 *         description: Verification result
 */
router.post('/issuers/:did/entry/verify', optionalAuthenticate, verifyIssuerEntry);

/**
 * @swagger
 * /v2/verifiers/{did}/entry:
 *   get:
 *     summary: Get signed verifier registry entry
 *     tags: [Signed Entries]
 *     parameters:
 *       - in: path
 *         name: did
 *         required: true
 *         schema:
 *           type: string
 *         description: Verifier DID
 *     responses:
 *       200:
 *         description: Signed verifier entry
 *       404:
 *         description: Verifier not found
 */
router.get('/verifiers/:did/entry', optionalAuthenticate, getSignedVerifierEntry);

/**
 * @swagger
 * /v2/verifiers/{did}/entry/verify:
 *   post:
 *     summary: Verify verifier entry signature
 *     tags: [Signed Entries]
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
 *     responses:
 *       200:
 *         description: Verification result
 */
router.post('/verifiers/:did/entry/verify', optionalAuthenticate, verifyVerifierEntry);

/**
 * @swagger
 * /v2/registry/did:
 *   get:
 *     summary: Get registry DID document with public key
 *     tags: [Signed Entries]
 *     parameters:
 *       - in: query
 *         name: registryId
 *         schema:
 *           type: string
 *         description: Optional registry ID
 *     responses:
 *       200:
 *         description: Registry DID document
 */
router.get('/registry/did', optionalAuthenticate, getRegistryDidDocument);

export default router;
