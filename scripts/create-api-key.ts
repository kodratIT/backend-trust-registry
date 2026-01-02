/**
 * Create API Key Script
 * Generate a new API key without running full seed
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Generate a random API key
 */
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash an API key using bcrypt
 */
async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 12);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const role = args[0] || 'admin'; // Default to admin
  const name = args[1] || `${role.charAt(0).toUpperCase() + role.slice(1)} API Key`;

  if (!['admin', 'registry_owner', 'public'].includes(role)) {
    console.error('❌ Invalid role. Must be: admin, registry_owner, or public');
    process.exit(1);
  }

  console.log(`\n🔑 Creating ${role} API key...`);

  // Generate API key
  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  // Create in database
  const created = await prisma.aPIKey.create({
    data: {
      name,
      role,
      keyHash: apiKeyHash,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  console.log('\n✅ API Key created successfully!');
  console.log('═══════════════════════════════════════');
  console.log(`ID:         ${created.id}`);
  console.log(`Name:       ${created.name}`);
  console.log(`Role:       ${created.role}`);
  console.log(`Expires:    ${created.expiresAt?.toISOString() || 'Never'}`);
  console.log(`API Key:    ${apiKey}`);
  console.log('═══════════════════════════════════════');
  console.log('\n⚠️  Save this key securely! It will not be shown again.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating API key:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
