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
 * @route   POST /v2/api-keys
 * @desc    Create a new API key
 * @access  Admin only
 */
router.post('/', authenticate, requireAdmin, createAPIKey);

/**
 * @route   GET /v2/api-keys
 * @desc    List all API keys
 * @access  Admin only
 */
router.get('/', authenticate, requireAdmin, listAPIKeys);

/**
 * @route   GET /v2/api-keys/:id
 * @desc    Get API key by ID
 * @access  Admin only
 */
router.get('/:id', authenticate, requireAdmin, getAPIKey);

/**
 * @route   DELETE /v2/api-keys/:id
 * @desc    Revoke an API key
 * @access  Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteAPIKey);

export default router;
