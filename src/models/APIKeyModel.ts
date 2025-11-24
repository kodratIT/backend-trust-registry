/**
 * API Key Model
 * ToIP Trust Registry v2 Backend
 * 
 * Handles API key generation, validation, and management
 */

import { PrismaClient, APIKey } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * API Key creation data
 */
export interface CreateAPIKeyData {
  name: string;
  role: 'admin' | 'registry_owner' | 'public';
  registryId?: string;
  expiresAt?: Date;
}

/**
 * API Key with plaintext key (only returned on creation)
 */
export interface APIKeyWithPlaintext extends Omit<APIKey, 'keyHash'> {
  key: string;
}

/**
 * API Key verification result
 */
export interface VerifyResult {
  valid: boolean;
  apiKey?: APIKey;
  reason?: string;
}

/**
 * API Key Model Class
 */
export class APIKeyModel {
  private static readonly BCRYPT_ROUNDS = 12;
  private static readonly KEY_LENGTH = 32; // 32 bytes = 64 hex characters

  /**
   * Generate a secure random API key
   * @returns 64-character hexadecimal string
   */
  static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Hash an API key using bcrypt
   * @param key - Plaintext API key
   * @returns Hashed key
   */
  static async hashKey(key: string): Promise<string> {
    return bcrypt.hash(key, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare a plaintext key with a hashed key
   * @param key - Plaintext API key
   * @param hash - Hashed API key
   * @returns True if keys match
   */
  static async compareKey(key: string, hash: string): Promise<boolean> {
    return bcrypt.compare(key, hash);
  }

  /**
   * Create a new API key
   * @param data - API key creation data
   * @returns API key with plaintext key (only time it's returned)
   */
  static async create(data: CreateAPIKeyData): Promise<APIKeyWithPlaintext> {
    // Generate random key
    const key = this.generateKey();

    // Hash the key
    const keyHash = await this.hashKey(key);

    // Create in database
    const apiKey = await prisma.aPIKey.create({
      data: {
        keyHash,
        name: data.name,
        role: data.role,
        registryId: data.registryId,
        expiresAt: data.expiresAt,
      },
    });

    // Return with plaintext key (only time it's available)
    return {
      ...apiKey,
      key,
    };
  }

  /**
   * Verify an API key
   * @param key - Plaintext API key to verify
   * @returns Verification result with API key data if valid
   */
  static async verify(key: string): Promise<VerifyResult> {
    try {
      // Get all API keys (we need to check against all hashes)
      const apiKeys = await prisma.aPIKey.findMany();

      // Check each key hash
      for (const apiKey of apiKeys) {
        const isMatch = await this.compareKey(key, apiKey.keyHash);

        if (isMatch) {
          // Check if expired
          if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return {
              valid: false,
              reason: 'API key has expired',
            };
          }

          // Update last used timestamp
          await prisma.aPIKey.update({
            where: { id: apiKey.id },
            data: { lastUsedAt: new Date() },
          });

          return {
            valid: true,
            apiKey,
          };
        }
      }

      // No matching key found
      return {
        valid: false,
        reason: 'Invalid API key',
      };
    } catch (error) {
      console.error('Error verifying API key:', error);
      return {
        valid: false,
        reason: 'Error verifying API key',
      };
    }
  }

  /**
   * Find API key by ID
   * @param id - API key ID
   * @returns API key or null
   */
  static async findById(id: string): Promise<APIKey | null> {
    return prisma.aPIKey.findUnique({
      where: { id },
    });
  }

  /**
   * List all API keys
   * @param role - Optional role filter
   * @returns Array of API keys
   */
  static async list(role?: string): Promise<APIKey[]> {
    return prisma.aPIKey.findMany({
      where: role ? { role } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Delete an API key
   * @param id - API key ID
   * @returns Deleted API key
   */
  static async delete(id: string): Promise<APIKey> {
    return prisma.aPIKey.delete({
      where: { id },
    });
  }

  /**
   * Check if an API key is expired
   * @param apiKey - API key to check
   * @returns True if expired
   */
  static isExpired(apiKey: APIKey): boolean {
    if (!apiKey.expiresAt) {
      return false;
    }
    return apiKey.expiresAt < new Date();
  }

  /**
   * Get API keys expiring soon (within days)
   * @param days - Number of days to check
   * @returns Array of API keys expiring soon
   */
  static async getExpiringSoon(days: number = 30): Promise<APIKey[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.aPIKey.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      orderBy: { expiresAt: 'asc' },
    });
  }
}
