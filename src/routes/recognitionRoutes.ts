/**
 * Recognition Routes
 * ToIP Trust Registry v2 Backend
 *
 * CRUD routes for Registry Recognition management
 */

/* eslint-disable @typescript-eslint/no-misused-promises */

import { Router } from 'express';
import {
  createRecognition,
  listRecognitions,
  getRecognition,
  deleteRecognition,
} from '../controllers/recognitionController';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';

const router = Router();

// All recognition management routes require admin authentication
router.post('/', authenticate, requireAdmin, createRecognition);
router.get('/', authenticate, requireAdmin, listRecognitions);
router.get('/:id', authenticate, requireAdmin, getRecognition);
router.delete('/:id', authenticate, requireAdmin, deleteRecognition);

export default router;
