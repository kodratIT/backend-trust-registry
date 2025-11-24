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

const router = Router();

/**
 * POST /v2/trust-frameworks
 * Create a new trust framework
 * Admin only
 */
router.post('/', authenticate, requireAdmin, createTrustFramework);

/**
 * GET /v2/trust-frameworks
 * List all trust frameworks with pagination and filtering
 * Public access (no authentication required)
 */
router.get('/', listTrustFrameworks);

/**
 * GET /v2/trust-frameworks/:id
 * Get a single trust framework by ID
 * Public access (no authentication required)
 */
router.get('/:id', getTrustFramework);

/**
 * PUT /v2/trust-frameworks/:id
 * Update a trust framework
 * Admin only
 */
router.put('/:id', authenticate, requireAdmin, updateTrustFramework);

export default router;
