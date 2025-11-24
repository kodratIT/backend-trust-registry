/**
 * Database Connection Test Script
 * ToIP Trust Registry v2 Backend
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Basic Connection
    console.log('1️⃣  Testing basic connection...');
    await prisma.$connect();
    console.log('   ✅ Connected to database successfully\n');

    // Test 2: Count Records
    console.log('2️⃣  Counting records in each table...');
    
    const trustFrameworkCount = await prisma.trustFramework.count();
    console.log(`   • Trust Frameworks: ${trustFrameworkCount}`);
    
    const trustRegistryCount = await prisma.trustRegistry.count();
    console.log(`   • Trust Registries: ${trustRegistryCount}`);
    
    const credentialSchemaCount = await prisma.credentialSchema.count();
    console.log(`   • Credential Schemas: ${credentialSchemaCount}`);
    
    const issuerCount = await prisma.issuer.count();
    console.log(`   • Issuers: ${issuerCount}`);
    
    const verifierCount = await prisma.verifier.count();
    console.log(`   • Verifiers: ${verifierCount}`);
    
    const apiKeyCount = await prisma.aPIKey.count();
    console.log(`   • API Keys: ${apiKeyCount}`);
    
    const auditLogCount = await prisma.auditLog.count();
    console.log(`   • Audit Logs: ${auditLogCount}\n`);

    // Test 3: Query Trust Frameworks
    console.log('3️⃣  Querying trust frameworks...');
    const frameworks = await prisma.trustFramework.findMany({
      select: {
        id: true,
        name: true,
        version: true,
        status: true,
      },
    });
    frameworks.forEach((fw) => {
      console.log(`   • ${fw.name} (v${fw.version}) - ${fw.status}`);
    });
    console.log();

    // Test 4: Query Issuers with Relations
    console.log('4️⃣  Querying issuers with relations...');
    const issuers = await prisma.issuer.findMany({
      include: {
        registry: {
          select: {
            name: true,
          },
        },
        credentialTypes: {
          include: {
            schema: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });
    issuers.forEach((issuer) => {
      console.log(`   • ${issuer.name || issuer.did}`);
      console.log(`     Registry: ${issuer.registry.name}`);
      console.log(`     Status: ${issuer.status}`);
      console.log(`     Credential Types: ${issuer.credentialTypes.length}`);
    });
    console.log();

    // Test 5: Test CRUD Operations
    console.log('5️⃣  Testing CRUD operations...');
    
    // Create
    const testFramework = await prisma.trustFramework.create({
      data: {
        name: 'Test Framework',
        version: '1.0',
        status: 'active',
      },
    });
    console.log(`   ✅ Created: ${testFramework.name}`);
    
    // Read
    const foundFramework = await prisma.trustFramework.findUnique({
      where: { id: testFramework.id },
    });
    console.log(`   ✅ Read: ${foundFramework?.name}`);
    
    // Update
    const updatedFramework = await prisma.trustFramework.update({
      where: { id: testFramework.id },
      data: { version: '1.1' },
    });
    console.log(`   ✅ Updated: ${updatedFramework.name} to v${updatedFramework.version}`);
    
    // Delete
    await prisma.trustFramework.delete({
      where: { id: testFramework.id },
    });
    console.log(`   ✅ Deleted: Test Framework\n`);

    // Test 6: Connection Pooling
    console.log('6️⃣  Testing connection pooling...');
    const promises = Array.from({ length: 10 }, () =>
      prisma.trustFramework.count()
    );
    await Promise.all(promises);
    console.log('   ✅ Handled 10 concurrent queries successfully\n');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ All database tests passed!');
    console.log('═══════════════════════════════════════\n');
    console.log('Database Status:');
    console.log(`  • Connection: ✅ Working`);
    console.log(`  • CRUD Operations: ✅ Working`);
    console.log(`  • Relations: ✅ Working`);
    console.log(`  • Connection Pooling: ✅ Working`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Database test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('👋 Disconnected from database\n');
  }
}

testConnection();
