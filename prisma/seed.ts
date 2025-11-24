/**
 * Database Seed Script
 * ToIP Trust Registry v2 Backend
 * 
 * This script populates the database with initial test data for development.
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
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.federationConnection.deleteMany();
  await prisma.registryEntry.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.issuerDelegation.deleteMany();
  await prisma.issuerCredentialType.deleteMany();
  await prisma.verifierCredentialType.deleteMany();
  await prisma.issuer.deleteMany();
  await prisma.verifier.deleteMany();
  await prisma.credentialSchema.deleteMany();
  await prisma.trustRegistry.deleteMany();
  await prisma.trustFramework.deleteMany();
  await prisma.dIDDirectory.deleteMany();
  console.log('✅ Existing data cleaned\n');

  // ============================================
  // TRUST FRAMEWORKS
  // ============================================
  console.log('📋 Creating Trust Frameworks...');
  
  const framework1 = await prisma.trustFramework.create({
    data: {
      name: 'Pan-Canadian Trust Framework',
      version: '1.4',
      description: 'A trust framework for digital identity in Canada',
      governanceFrameworkUrl: 'https://diacc.ca/trust-framework/',
      legalAgreements: ['https://diacc.ca/legal/terms'],
      jurisdictions: ['CA'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  const framework2 = await prisma.trustFramework.create({
    data: {
      name: 'European Digital Identity Framework',
      version: '2.0',
      description: 'EU Digital Identity Wallet framework',
      governanceFrameworkUrl: 'https://ec.europa.eu/digital-identity',
      legalAgreements: ['https://ec.europa.eu/legal/terms'],
      jurisdictions: ['EU', 'DE', 'FR', 'IT', 'ES'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  console.log(`✅ Created ${2} trust frameworks\n`);

  // ============================================
  // TRUST REGISTRIES
  // ============================================
  console.log('🏛️  Creating Trust Registries...');

  const registry1 = await prisma.trustRegistry.create({
    data: {
      name: 'Canadian Digital Identity Registry',
      description: 'Official registry for Canadian digital identity credentials',
      trustFrameworkId: framework1.id,
      ecosystemDid: 'did:web:registry.diacc.ca',
      governanceAuthority: 'Digital ID & Authentication Council of Canada',
      status: 'active',
    },
  });

  const registry2 = await prisma.trustRegistry.create({
    data: {
      name: 'EU Digital Identity Registry',
      description: 'European Union digital identity wallet registry',
      trustFrameworkId: framework2.id,
      ecosystemDid: 'did:web:registry.eudi.eu',
      governanceAuthority: 'European Commission',
      status: 'active',
    },
  });

  console.log(`✅ Created ${2} trust registries\n`);

  // ============================================
  // CREDENTIAL SCHEMAS
  // ============================================
  console.log('📜 Creating Credential Schemas...');

  const schema1 = await prisma.credentialSchema.create({
    data: {
      registryId: registry1.id,
      trustFrameworkId: framework1.id,
      name: 'Verified Person Credential',
      version: '1.0',
      type: 'VerifiedPersonCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          givenName: { type: 'string' },
          familyName: { type: 'string' },
          birthDate: { type: 'string', format: 'date' },
        },
        required: ['givenName', 'familyName'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['CA'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'OPEN',
    },
  });

  const schema2 = await prisma.credentialSchema.create({
    data: {
      registryId: registry2.id,
      trustFrameworkId: framework2.id,
      name: 'EU Digital Identity Credential',
      version: '1.0',
      type: 'EUDigitalIdentityCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          nationality: { type: 'string' },
        },
        required: ['firstName', 'lastName', 'dateOfBirth'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['EU'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  console.log(`✅ Created ${2} credential schemas\n`);

  // ============================================
  // ISSUERS
  // ============================================
  console.log('🏢 Creating Issuers...');

  const issuer1 = await prisma.issuer.create({
    data: {
      did: 'did:web:issuer.example.ca',
      name: 'Example Canadian Issuer',
      registryId: registry1.id,
      trustFrameworkId: framework1.id,
      status: 'active',
      jurisdictions: [{ code: 'CA', name: 'Canada' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      accreditationDetails: {
        accreditor: 'DIACC',
        date: '2024-01-01',
        expiryDate: '2025-01-01',
      },
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://issuer.example.ca/credentials',
      metadata: {
        organizationType: 'government',
        contactEmail: 'contact@example.ca',
      },
    },
  });

  const issuer2 = await prisma.issuer.create({
    data: {
      did: 'did:web:issuer.example.eu',
      name: 'Example EU Issuer',
      registryId: registry2.id,
      trustFrameworkId: framework2.id,
      status: 'active',
      jurisdictions: [
        { code: 'EU', name: 'European Union' },
        { code: 'DE', name: 'Germany' },
      ],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://issuer.example.eu/credentials',
    },
  });

  console.log(`✅ Created ${2} issuers\n`);

  // ============================================
  // ISSUER CREDENTIAL TYPES
  // ============================================
  console.log('🔗 Linking Issuers to Credential Schemas...');

  await prisma.issuerCredentialType.create({
    data: {
      issuerId: issuer1.id,
      schemaId: schema1.id,
    },
  });

  await prisma.issuerCredentialType.create({
    data: {
      issuerId: issuer2.id,
      schemaId: schema2.id,
    },
  });

  console.log(`✅ Created ${2} issuer-schema links\n`);

  // ============================================
  // VERIFIERS
  // ============================================
  console.log('🔍 Creating Verifiers...');

  const verifier1 = await prisma.verifier.create({
    data: {
      did: 'did:web:verifier.example.ca',
      name: 'Example Canadian Verifier',
      registryId: registry1.id,
      trustFrameworkId: framework1.id,
      status: 'active',
      jurisdictions: [{ code: 'CA', name: 'Canada' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'medium',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://verifier.example.ca/verify',
    },
  });

  console.log(`✅ Created ${1} verifier\n`);

  // ============================================
  // VERIFIER CREDENTIAL TYPES
  // ============================================
  console.log('🔗 Linking Verifiers to Credential Schemas...');

  await prisma.verifierCredentialType.create({
    data: {
      verifierId: verifier1.id,
      schemaId: schema1.id,
    },
  });

  console.log(`✅ Created ${1} verifier-schema link\n`);

  // ============================================
  // API KEYS
  // ============================================
  console.log('🔑 Creating API Keys...');

  // Admin API Key
  const adminKey = generateApiKey();
  const adminKeyHash = await hashApiKey(adminKey);
  
  await prisma.aPIKey.create({
    data: {
      keyHash: adminKeyHash,
      name: 'Admin API Key',
      role: 'admin',
      expiresAt: new Date('2025-12-31'),
    },
  });

  // Registry Owner API Key
  const registryKey = generateApiKey();
  const registryKeyHash = await hashApiKey(registryKey);
  
  await prisma.aPIKey.create({
    data: {
      keyHash: registryKeyHash,
      name: 'Registry Owner API Key',
      role: 'registry_owner',
      registryId: registry1.id,
      expiresAt: new Date('2025-12-31'),
    },
  });

  // Public API Key
  const publicKey = generateApiKey();
  const publicKeyHash = await hashApiKey(publicKey);
  
  await prisma.aPIKey.create({
    data: {
      keyHash: publicKeyHash,
      name: 'Public API Key',
      role: 'public',
      expiresAt: new Date('2025-12-31'),
    },
  });

  console.log(`✅ Created ${3} API keys\n`);

  // ============================================
  // DID DIRECTORY
  // ============================================
  console.log('📇 Creating DID Directory Entries...');

  await prisma.dIDDirectory.create({
    data: {
      did: issuer1.did,
      serviceType: 'CredentialIssuer',
      endpoint: issuer1.endpoint,
      metadata: {
        name: issuer1.name,
        type: 'issuer',
      },
    },
  });

  await prisma.dIDDirectory.create({
    data: {
      did: verifier1.did,
      serviceType: 'CredentialVerifier',
      endpoint: verifier1.endpoint,
      metadata: {
        name: verifier1.name,
        type: 'verifier',
      },
    },
  });

  console.log(`✅ Created ${2} DID directory entries\n`);

  // ============================================
  // AUDIT LOGS
  // ============================================
  console.log('📝 Creating Sample Audit Logs...');

  await prisma.auditLog.create({
    data: {
      actor: 'system',
      action: 'database.seed',
      resourceType: 'database',
      details: {
        message: 'Database seeded with initial test data',
        timestamp: new Date().toISOString(),
      },
      result: 'success',
    },
  });

  console.log(`✅ Created ${1} audit log\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════');
  console.log('✅ Database seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   • Trust Frameworks: 2`);
  console.log(`   • Trust Registries: 2`);
  console.log(`   • Credential Schemas: 2`);
  console.log(`   • Issuers: 2`);
  console.log(`   • Verifiers: 1`);
  console.log(`   • API Keys: 3`);
  console.log(`   • DID Directory Entries: 2`);
  console.log(`   • Audit Logs: 1`);
  console.log('═══════════════════════════════════════\n');

  // Print API Keys (for development use)
  console.log('🔑 API Keys (save these for testing):');
  console.log('═══════════════════════════════════════');
  console.log(`Admin Key:          ${adminKey}`);
  console.log(`Registry Owner Key: ${registryKey}`);
  console.log(`Public Key:         ${publicKey}`);
  console.log('═══════════════════════════════════════\n');
  console.log('⚠️  Note: These keys are for development only!');
  console.log('   Store them securely and never commit to version control.\n');
}

/**
 * Execute seed and handle errors
 */
main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
