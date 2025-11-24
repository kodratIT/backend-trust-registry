/**
 * Test Helper Functions
 * ToIP Trust Registry v2 Backend
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */

import request from 'supertest';
import app from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a test API request
 */
export function createTestRequest() {
  return request(app);
}

/**
 * Create authenticated request with API key
 */
export function createAuthenticatedRequest(apiKey: string) {
  return request(app).set('X-API-Key', apiKey);
}

/**
 * Clean up database after tests
 */
export async function cleanupDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.statusHistory.deleteMany({});
  await prisma.registryEntry.deleteMany({});
  await prisma.issuerDelegation.deleteMany({});
  await prisma.issuerCredentialType.deleteMany({});
  await prisma.verifierCredentialType.deleteMany({});
  await prisma.issuer.deleteMany({});
  await prisma.verifier.deleteMany({});
  await prisma.credentialSchema.deleteMany({});
  await prisma.federationConnection.deleteMany({});
  await prisma.trustRegistry.deleteMany({});
  await prisma.trustFramework.deleteMany({});
  await prisma.aPIKey.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.dIDDirectory.deleteMany({});
}

/**
 * Close database connection
 */
export async function closeDatabaseConnection() {
  await prisma.$disconnect();
}

/**
 * Create test API key
 */
export async function createTestAPIKey(data: {
  name: string;
  role: string;
  registryId?: string;
  expiresAt?: Date;
}) {
  const crypto = require('crypto');
  const bcrypt = require('bcrypt');

  const key = crypto.randomBytes(32).toString('hex');
  const keyHash = await bcrypt.hash(key, 12);

  const apiKey = await prisma.aPIKey.create({
    data: {
      keyHash,
      name: data.name,
      role: data.role,
      registryId: data.registryId,
      expiresAt: data.expiresAt,
    },
  });

  return { ...apiKey, key };
}

/**
 * Create test trust framework
 */
export async function createTestTrustFramework(data?: {
  name?: string;
  version?: string;
  status?: string;
}) {
  return prisma.trustFramework.create({
    data: {
      name: data?.name || 'Test Framework',
      version: data?.version || '1.0',
      description: 'Test description',
      status: data?.status || 'active',
    },
  });
}

/**
 * Create test trust registry
 */
export async function createTestTrustRegistry(data?: {
  name?: string;
  ecosystemDid?: string;
  trustFrameworkId?: string;
}) {
  return prisma.trustRegistry.create({
    data: {
      name: data?.name || 'Test Registry',
      ecosystemDid: data?.ecosystemDid || 'did:example:test',
      trustFrameworkId: data?.trustFrameworkId,
      status: 'active',
    },
  });
}

/**
 * Wait for a specified time (for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2);
}

/**
 * Generate random email
 */
export function randomEmail(): string {
  return `test-${randomString()}@example.com`;
}
