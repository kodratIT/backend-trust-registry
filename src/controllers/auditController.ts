/**
 * Audit Controller
 * ToIP Trust Registry v2 Backend
 *
 * Handles audit log queries
 */

/* eslint-disable no-console */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authenticate';
import { queryAuditLogs } from '../services/auditService';

/**
 * Get audit logs
 * GET /v2/audit-log
 * Admin only
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '20',
      actor,
      action,
      resourceType,
      resourceId,
      result,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid page number' });
      return;
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ error: 'Bad Request', message: 'Invalid limit. Must be between 1 and 100' });
      return;
    }

    const logs = await queryAuditLogs({
      page: pageNum,
      limit: limitNum,
      actor: actor as string | undefined,
      action: action as string | undefined,
      resourceType: resourceType as string | undefined,
      resourceId: resourceId as string | undefined,
      result: result as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to get audit logs' });
  }
}
