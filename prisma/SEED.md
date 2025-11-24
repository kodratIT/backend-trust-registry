# Database Seed Script
## ToIP Trust Registry v2 Backend

This document explains the database seed script and how to use it.

---

## 📋 Overview

The seed script (`prisma/seed.ts`) populates the database with initial test data for development and testing purposes.

**Purpose**:
- Provide sample data for development
- Enable immediate testing of API endpoints
- Demonstrate data relationships
- Generate test API keys

---

## 🌱 What Gets Seeded

### Trust Frameworks (2)

1. **Pan-Canadian Trust Framework**
   - Version: 1.4
   - Jurisdiction: Canada (CA)
   - Status: Active
   - URL: https://diacc.ca/trust-framework/

2. **European Digital Identity Framework**
   - Version: 2.0
   - Jurisdictions: EU, DE, FR, IT, ES
   - Status: Active
   - URL: https://ec.europa.eu/digital-identity

### Trust Registries (2)

1. **Canadian Digital Identity Registry**
   - DID: did:web:registry.diacc.ca
   - Framework: Pan-Canadian Trust Framework
   - Authority: DIACC

2. **EU Digital Identity Registry**
   - DID: did:web:registry.eudi.eu
   - Framework: European Digital Identity Framework
   - Authority: European Commission

### Credential Schemas (2)

1. **Verified Person Credential**
   - Type: VerifiedPersonCredential
   - Registry: Canadian
   - Issuer Mode: ECOSYSTEM
   - Verifier Mode: OPEN

2. **EU Digital Identity Credential**
   - Type: EUDigitalIdentityCredential
   - Registry: EU
   - Issuer Mode: ECOSYSTEM
   - Verifier Mode: ECOSYSTEM

### Issuers (2)

1. **Example Canadian Issuer**
   - DID: did:web:issuer.example.ca
   - Registry: Canadian
   - Status: Active
   - Accreditation: High
   - Valid: 2024-01-01 to 2025-12-31

2. **Example EU Issuer**
   - DID: did:web:issuer.example.eu
   - Registry: EU
   - Status: Active
   - Accreditation: High
   - Valid: 2024-01-01 to 2025-12-31

### Verifiers (1)

1. **Example Canadian Verifier**
   - DID: did:web:verifier.example.ca
   - Registry: Canadian
   - Status: Active
   - Accreditation: Medium

### API Keys (3)

1. **Admin API Key**
   - Role: admin
   - Full system access
   - Expires: 2025-12-31

2. **Registry Owner API Key**
   - Role: registry_owner
   - Registry: Canadian
   - Expires: 2025-12-31

3. **Public API Key**
   - Role: public
   - Read-only access
   - Expires: 2025-12-31

### Additional Data

- **DID Directory Entries**: 2 entries
- **Audit Logs**: 1 initial log entry

---

## 🚀 How to Run

### Prerequisites

1. **PostgreSQL Running**:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d postgres
   ```

2. **Migrations Applied**:
   ```bash
   npx prisma migrate dev
   ```

### Run Seed Script

**Method 1: Using Prisma**:
```bash
npx prisma db seed
```

**Method 2: Using ts-node**:
```bash
npx ts-node prisma/seed.ts
```

**Method 3: Using npm script** (if added):
```bash
npm run seed
```

---

## 📊 Expected Output

```
🌱 Starting database seed...

🧹 Cleaning existing data...
✅ Existing data cleaned

📋 Creating Trust Frameworks...
✅ Created 2 trust frameworks

🏛️  Creating Trust Registries...
✅ Created 2 trust registries

📜 Creating Credential Schemas...
✅ Created 2 credential schemas

🏢 Creating Issuers...
✅ Created 2 issuers

🔗 Linking Issuers to Credential Schemas...
✅ Created 2 issuer-schema links

🔍 Creating Verifiers...
✅ Created 1 verifier

🔗 Linking Verifiers to Credential Schemas...
✅ Created 1 verifier-schema link

🔑 Creating API Keys...
✅ Created 3 API keys

📇 Creating DID Directory Entries...
✅ Created 2 DID directory entries

📝 Creating Sample Audit Logs...
✅ Created 1 audit log

═══════════════════════════════════════
✅ Database seed completed successfully!

📊 Summary:
   • Trust Frameworks: 2
   • Trust Registries: 2
   • Credential Schemas: 2
   • Issuers: 2
   • Verifiers: 1
   • API Keys: 3
   • DID Directory Entries: 2
   • Audit Logs: 1
═══════════════════════════════════════

🔑 API Keys (save these for testing):
═══════════════════════════════════════
Admin Key:          abc123...
Registry Owner Key: def456...
Public Key:         ghi789...
═══════════════════════════════════════

⚠️  Note: These keys are for development only!
   Store them securely and never commit to version control.
```

---

## 🔑 Using API Keys

After seeding, you'll receive 3 API keys. Save them for testing:

### Admin Key

**Usage**:
```bash
curl -H "X-API-Key: YOUR_ADMIN_KEY" \
  http://localhost:3000/v2/trust-frameworks
```

**Permissions**:
- Create/update/delete trust frameworks
- Create/update/delete registries
- Manage API keys
- Full system access

### Registry Owner Key

**Usage**:
```bash
curl -H "X-API-Key: YOUR_REGISTRY_KEY" \
  http://localhost:3000/v2/issuers
```

**Permissions**:
- Manage issuers in their registry
- Manage verifiers in their registry
- View registry data
- Limited to specific registry

### Public Key

**Usage**:
```bash
curl -H "X-API-Key: YOUR_PUBLIC_KEY" \
  http://localhost:3000/v2/query
```

**Permissions**:
- Query trust registry
- Read-only access
- No write operations

---

## 🔄 Re-seeding

The seed script **cleans existing data** before seeding. This means:

⚠️ **WARNING**: Running the seed script will **delete all existing data**!

**Safe for**:
- Development environment
- Testing environment
- Local database

**NOT safe for**:
- Production environment
- Staging with important data
- Any database with real data

### Conditional Seeding

To prevent accidental data loss, you can add environment check:

```typescript
// In seed.ts
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Cannot seed production database!');
  process.exit(1);
}
```

---

## 🧪 Testing with Seed Data

### Query Trust Frameworks

```bash
curl http://localhost:3000/v2/trust-frameworks
```

### Query Issuers

```bash
curl http://localhost:3000/v2/issuers
```

### Query by DID

```bash
curl http://localhost:3000/v2/issuers/did:web:issuer.example.ca
```

### Create New Issuer (with Admin Key)

```bash
curl -X POST http://localhost:3000/v2/issuers \
  -H "X-API-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:web:new-issuer.example.com",
    "name": "New Issuer",
    "registryId": "REGISTRY_ID",
    "status": "pending"
  }'
```

---

## 📝 Customizing Seed Data

### Add More Data

Edit `prisma/seed.ts` and add more entries:

```typescript
const framework3 = await prisma.trustFramework.create({
  data: {
    name: 'Your Custom Framework',
    version: '1.0',
    // ... more fields
  },
});
```

### Modify Existing Data

Change the values in the seed script:

```typescript
const issuer1 = await prisma.issuer.create({
  data: {
    did: 'did:web:your-custom-did',
    name: 'Your Custom Name',
    // ... more fields
  },
});
```

### Add Custom API Keys

```typescript
const customKey = generateApiKey();
const customKeyHash = await hashApiKey(customKey);

await prisma.aPIKey.create({
  data: {
    keyHash: customKeyHash,
    name: 'Custom API Key',
    role: 'admin',
    expiresAt: new Date('2026-12-31'),
  },
});

console.log(`Custom Key: ${customKey}`);
```

---

## 🐛 Troubleshooting

### Seed Script Fails

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npx prisma generate
```

---

**Error**: `Connection refused`

**Solution**:
```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Wait for it to be ready
docker-compose -f docker-compose.dev.yml logs -f postgres
```

---

**Error**: `Table does not exist`

**Solution**:
```bash
# Apply migrations first
npx prisma migrate dev
```

---

### Seed Data Not Appearing

**Check database**:
```bash
npx prisma studio
```

**Verify connection**:
```bash
npx prisma db pull
```

---

## 📚 Additional Resources

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
- [TypeScript Seeding Guide](https://www.prisma.io/docs/guides/database/seed-database#typescript)

---

## ⚠️ Important Notes

1. **Development Only**: Seed data is for development/testing only
2. **API Keys**: Save the generated API keys securely
3. **Data Loss**: Seeding deletes existing data
4. **Environment**: Never seed production database
5. **Version Control**: Never commit API keys to Git

---

**Last Updated**: November 24, 2024  
**Maintainer**: Technical Team
