/**
 * TRQP Routes
 * ToIP Trust Registry v2 Backend
 *
 * TRQP v2 protocol endpoints
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import { authorizationQuery, recognitionQuery } from '../controllers/trqpController';
import { optionalAuthenticate } from '../middleware/authenticate';

const router = Router();

/**
 * TRQP Authorization Query
 * POST /v2/authorization
 * Public access (no authentication required)
 */
router.post('/authorization', optionalAuthenticate, authorizationQuery);

/**
 * TRQP Recognition Query
 * POST /v2/recognition
 * Public access (no authentication required)
 */
router.post('/recognition', optionalAuthenticate, recognitionQuery);

export default router;
