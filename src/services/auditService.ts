/**
 * Audit Service
 * ToIP Trust Registry v2 Backend
 *
 * Service for logging all operations
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  actor?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  result: 'success' | 'failure';
}

/**
 * Log an audit entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor: entry.actor || 'anonymous',
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details || undefined,
        result: entry.result,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log a successful operation
 */
export async function logSuccess(
  actor: string | undefined,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({ actor, action, resourceType, resourceId, details, result: 'success' });
}

/**
 * Log a failed operation
 */
export async function logFailure(
  actor: string | undefined,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  await logAudit({ actor, action, resourceType, resourceId, details, result: 'failure' });
}

/**
 * Query audit logs
 */
interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  actor?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: string;
  startDate?: Date;
  endDate?: Date;
}

interface AuditLogWhereClause {
  actor?: { contains: string; mode: 'insensitive' };
  action?: string;
  resourceType?: string;
  resourceId?: string;
  result?: string;
  timestamp?: { gte?: Date; lte?: Date };
}

interface AuditLogResult {
  id: string;
  actor: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  details: unknown;
  result: string;
  timestamp: Date;
}

export async function queryAuditLogs(params: AuditLogQueryParams): Promise<{ data: AuditLogResult[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const { page = 1, limit = 20, actor, action, resourceType, resourceId, result, startDate, endDate } = params;

  const where: AuditLogWhereClause = {};

  if (actor) {where.actor = { contains: actor, mode: 'insensitive' };}
  if (action) {where.action = action;}
  if (resourceType) {where.resourceType = resourceType;}
  if (resourceId) {where.resourceId = resourceId;}
  if (result) {where.result = result;}
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) {where.timestamp.gte = startDate;}
    if (endDate) {where.timestamp.lte = endDate;}
  }

  const total = await prisma.auditLog.count({ where });
  const skip = (page - 1) * limit;

  const data = await prisma.auditLog.findMany({
    where,
    skip,
    take: limit,
    orderBy: { timestamp: 'desc' },
  });

  return {
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
