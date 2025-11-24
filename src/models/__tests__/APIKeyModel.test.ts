/**
 * API Key Model Tests
 * ToIP Trust Registry v2 Backend
 */

import { APIKeyModel } from '../APIKeyModel';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('APIKeyModel', () => {
  // Clean up after each test
  afterEach(async () => {
    await prisma.aPIKey.deleteMany({
      where: {
        name: {
          startsWith: 'Test',
        },
      },
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('generateKey', () => {
    it('should generate a 64-character hex key', () => {
      const key = APIKeyModel.generateKey();
      expect(key).toHaveLength(64);
      expect(key).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique keys', () => {
      const key1 = APIKeyModel.generateKey();
      const key2 = APIKeyModel.generateKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('hashKey', () => {
    it('should hash a key using bcrypt', async () => {
      const key = 'test-key-123';
      const hash = await APIKeyModel.hashKey(key);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(key);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for same key', async () => {
      const key = 'test-key-123';
      const hash1 = await APIKeyModel.hashKey(key);
      const hash2 = await APIKeyModel.hashKey(key);
      
      expect(hash1).not.toBe(hash2); // bcrypt uses salt
    });
  });

  describe('compareKey', () => {
    it('should return true for matching key and hash', async () => {
      const key = 'test-key-123';
      const hash = await APIKeyModel.hashKey(key);
      const isMatch = await APIKeyModel.compareKey(key, hash);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching key and hash', async () => {
      const key = 'test-key-123';
      const hash = await APIKeyModel.hashKey(key);
      const isMatch = await APIKeyModel.compareKey('wrong-key', hash);
      
      expect(isMatch).toBe(false);
    });
  });

  describe('create', () => {
    it('should create an API key with admin role', async () => {
      const result = await APIKeyModel.create({
        name: 'Test Admin Key',
        role: 'admin',
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Admin Key');
      expect(result.role).toBe('admin');
      expect(result.key).toHaveLength(64);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should create an API key with registry_owner role', async () => {
      const result = await APIKeyModel.create({
        name: 'Test Registry Key',
        role: 'registry_owner',
        registryId: 'test-registry-id',
      });

      expect(result.role).toBe('registry_owner');
      expect(result.registryId).toBe('test-registry-id');
    });

    it('should create an API key with expiration date', async () => {
      const expiresAt = new Date('2025-12-31');
      const result = await APIKeyModel.create({
        name: 'Test Expiring Key',
        role: 'public',
        expiresAt,
      });

      expect(result.expiresAt).toEqual(expiresAt);
    });

    it('should not store plaintext key in database', async () => {
      const result = await APIKeyModel.create({
        name: 'Test Security Key',
        role: 'admin',
      });

      const dbKey = await prisma.aPIKey.findUnique({
        where: { id: result.id },
      });

      expect(dbKey?.keyHash).toBeDefined();
      expect(dbKey?.keyHash).not.toBe(result.key);
    });
  });

  describe('verify', () => {
    it('should verify a valid API key', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Verify Key',
        role: 'admin',
      });

      const result = await APIKeyModel.verify(created.key);

      expect(result.valid).toBe(true);
      expect(result.apiKey).toBeDefined();
      expect(result.apiKey?.id).toBe(created.id);
    });

    it('should reject an invalid API key', async () => {
      const result = await APIKeyModel.verify('invalid-key-123');

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid API key');
      expect(result.apiKey).toBeUndefined();
    });

    it('should reject an expired API key', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Expired Key',
        role: 'admin',
        expiresAt: new Date('2020-01-01'), // Past date
      });

      const result = await APIKeyModel.verify(created.key);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('API key has expired');
    });

    it('should update lastUsedAt on successful verification', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Usage Key',
        role: 'admin',
      });

      const beforeVerify = await prisma.aPIKey.findUnique({
        where: { id: created.id },
      });
      expect(beforeVerify?.lastUsedAt).toBeNull();

      await APIKeyModel.verify(created.key);

      const afterVerify = await prisma.aPIKey.findUnique({
        where: { id: created.id },
      });
      expect(afterVerify?.lastUsedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find an API key by ID', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Find Key',
        role: 'admin',
      });

      const found = await APIKeyModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Find Key');
    });

    it('should return null for non-existent ID', async () => {
      const found = await APIKeyModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('list', () => {
    it('should list all API keys', async () => {
      await APIKeyModel.create({ name: 'Test List Key 1', role: 'admin' });
      await APIKeyModel.create({ name: 'Test List Key 2', role: 'public' });

      const keys = await APIKeyModel.list();

      expect(keys.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter by role', async () => {
      await APIKeyModel.create({ name: 'Test Admin Key', role: 'admin' });
      await APIKeyModel.create({ name: 'Test Public Key', role: 'public' });

      const adminKeys = await APIKeyModel.list('admin');
      const publicKeys = await APIKeyModel.list('public');

      expect(adminKeys.every((k) => k.role === 'admin')).toBe(true);
      expect(publicKeys.every((k) => k.role === 'public')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete an API key', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Delete Key',
        role: 'admin',
      });

      await APIKeyModel.delete(created.id);

      const found = await APIKeyModel.findById(created.id);
      expect(found).toBeNull();
    });
  });

  describe('isExpired', () => {
    it('should return false for non-expiring key', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Non-Expiring Key',
        role: 'admin',
      });

      const apiKey = await APIKeyModel.findById(created.id);
      expect(APIKeyModel.isExpired(apiKey!)).toBe(false);
    });

    it('should return false for future expiration', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Future Key',
        role: 'admin',
        expiresAt: new Date('2030-12-31'),
      });

      const apiKey = await APIKeyModel.findById(created.id);
      expect(APIKeyModel.isExpired(apiKey!)).toBe(false);
    });

    it('should return true for past expiration', async () => {
      const created = await APIKeyModel.create({
        name: 'Test Past Key',
        role: 'admin',
        expiresAt: new Date('2020-01-01'),
      });

      const apiKey = await APIKeyModel.findById(created.id);
      expect(APIKeyModel.isExpired(apiKey!)).toBe(true);
    });
  });

  describe('getExpiringSoon', () => {
    it('should return keys expiring within specified days', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now

      await APIKeyModel.create({
        name: 'Test Expiring Soon Key',
        role: 'admin',
        expiresAt: futureDate,
      });

      const expiring = await APIKeyModel.getExpiringSoon(30);

      expect(expiring.length).toBeGreaterThan(0);
      expect(expiring.some((k) => k.name === 'Test Expiring Soon Key')).toBe(true);
    });
  });
});
