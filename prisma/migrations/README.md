# Database Migrations
## ToIP Trust Registry v2 Backend

This directory contains all database migrations for the ToIP Trust Registry v2 system.

---

## 📋 Migration History

### 20241124000000_init (Initial Migration)

**Date**: November 24, 2024  
**Status**: ✅ Ready to apply  
**Description**: Initial database schema creation

**Tables Created** (14 tables):
1. `trust_frameworks` - Trust framework definitions
2. `trust_registries` - Trust registries
3. `credential_schemas` - Credential schema definitions
4. `issuers` - Registered issuers
5. `issuer_credential_types` - Issuer-schema junction table
6. `issuer_delegations` - Issuer delegation relationships
7. `verifiers` - Registered verifiers
8. `verifier_credential_types` - Verifier-schema junction table
9. `status_history` - Status change history
10. `registry_entries` - Signed registry entries
11. `federation_connections` - Federation connections
12. `did_directory` - DID directory
13. `audit_logs` - Audit trail
14. `api_keys` - API key management

**Extensions**:
- `uuid-ossp` - UUID generation
- `pg_trgm` - Trigram matching for full-text search

**Indexes Created**: 30+ indexes for performance optimization

---

## 🚀 How to Apply Migrations

### Development Environment

**Using Docker Compose**:
```bash
# Start PostgreSQL
docker-compose -f docker-compose.dev.yml up -d postgres

# Apply migrations
npx prisma migrate dev

# Or apply specific migration
npx prisma migrate deploy
```

**Local PostgreSQL**:
```bash
# Ensure DATABASE_URL is set in .env
# Apply migrations
npx prisma migrate dev
```

### Production Environment

```bash
# Apply migrations (no prompts)
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

---

## 🔄 Migration Commands

### Create New Migration

```bash
# After modifying schema.prisma
npx prisma migrate dev --name description_of_changes
```

### Apply Migrations

```bash
# Development (with prompts)
npx prisma migrate dev

# Production (no prompts)
npx prisma migrate deploy
```

### Check Status

```bash
# View migration status
npx prisma migrate status
```

### Reset Database

```bash
# ⚠️ WARNING: This will delete all data!
npx prisma migrate reset
```

### Resolve Migration Issues

```bash
# Mark migration as applied (if already applied manually)
npx prisma migrate resolve --applied "20241124000000_init"

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20241124000000_init"
```

---

## 📊 Migration Best Practices

### Before Creating Migration

1. ✅ Test schema changes locally
2. ✅ Validate schema: `npx prisma validate`
3. ✅ Generate client: `npx prisma generate`
4. ✅ Review generated SQL
5. ✅ Backup production database

### During Migration

1. ✅ Use descriptive migration names
2. ✅ Keep migrations small and focused
3. ✅ Test rollback procedures
4. ✅ Document breaking changes
5. ✅ Communicate with team

### After Migration

1. ✅ Verify tables created
2. ✅ Check indexes applied
3. ✅ Test application functionality
4. ✅ Monitor performance
5. ✅ Update documentation

---

## 🔍 Troubleshooting

### Migration Failed

```bash
# Check migration status
npx prisma migrate status

# View detailed error
npx prisma migrate dev --create-only

# Manually fix SQL if needed
# Then apply: npx prisma migrate deploy
```

### Database Out of Sync

```bash
# Reset and reapply (development only)
npx prisma migrate reset

# Or resolve manually
npx prisma migrate resolve --applied "migration_name"
```

### Connection Issues

```bash
# Test database connection
npx prisma db pull

# Verify DATABASE_URL
echo $DATABASE_URL
```

---

## 📚 Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/migrate/troubleshooting)
- [Production Best Practices](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)

---

## ⚠️ Important Notes

1. **Never edit migration files manually** after they've been applied
2. **Always backup production database** before applying migrations
3. **Test migrations in staging** before production
4. **Keep migration history** in version control
5. **Document breaking changes** in migration comments

---

**Last Updated**: November 24, 2024  
**Maintainer**: Technical Team
