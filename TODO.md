# TODO - Backend Trust Registry

## 🔄 Pending Tasks

### High Priority

#### 1. DID Resolver - Sovrin Network Support
**Status**: ⏸️ Pending  
**Assigned to**: Future task  
**Description**: Complete implementation of Sovrin DID resolution

**Current State**:
- ✅ Basic DID resolution implemented for: `did:web`, `did:key`, `did:indy`
- ⏸️ Sovrin-specific resolver needs enhancement
- ⏸️ Network endpoint configuration needed

**What Needs to be Done**:
1. Add Sovrin network endpoints configuration
2. Implement proper Sovrin DID resolution with network discovery
3. Add caching for Sovrin DID documents
4. Add error handling for network timeouts
5. Add tests for Sovrin DID resolution

**Files to Update**:
- `src/services/didResolver.ts` - Add Sovrin-specific logic
- `src/config/env.ts` - Add Sovrin network configuration
- `src/services/__tests__/didResolver.test.ts` - Add Sovrin tests

**Reference**:
- Sovrin DID Method Spec: https://sovrin-foundation.github.io/sovrin/spec/did-method-spec-template.html
- Sovrin Networks: MainNet, StagingNet, BuilderNet

**Estimated Effort**: 2-3 days

---

### Medium Priority

#### 2. Credential Status/Revocation Integration
**Status**: ⏸️ Pending  
**Description**: Add support for checking credential status from issuers

**Note**: This is issuer's responsibility, but registry should provide:
- Links to issuer's status list endpoints
- Validation of status list URLs
- Documentation for issuers

---

#### 3. Enhanced Federation Features
**Status**: ⏸️ Pending  
**Description**: Add more federation capabilities
- Automatic recognition discovery
- Federation agreement management
- Cross-registry query routing

---

### Low Priority

#### 4. Performance Optimization
- Add Redis caching for frequently accessed data
- Optimize database queries with proper indexes
- Add query result caching

#### 5. Monitoring & Observability
- Add Prometheus metrics
- Add structured logging
- Add distributed tracing

---

## ✅ Completed Tasks

### Phase 1: TRQP v2 Implementation
- ✅ Metadata endpoint (`GET /v2/metadata`)
- ✅ Authorization queries (`POST /v2/authorization`)
- ✅ Recognition queries (`POST /v2/recognition`)
- ✅ Public trusted list endpoints
- ✅ Swagger/OpenAPI documentation
- ✅ 100% TRQP v2 compliance

### Phase 2: Global Registry Data
- ✅ 45 trust registries across 6 continents
- ✅ 10 trust frameworks
- ✅ Indonesia registry (🇮🇩 did:web:registry.digital.go.id)
- ✅ Inter-registry recognitions (10 relationships)
- ✅ Comprehensive seed data

---

## 📝 Notes

### DID Resolver - Current Support Matrix

| DID Method | Status | Notes |
|------------|--------|-------|
| `did:web` | ✅ Full | HTTP resolution with caching |
| `did:key` | ✅ Full | Self-describing, no network needed |
| `did:indy` | ✅ Partial | Basic support, needs Sovrin enhancement |
| `did:ion` | ⚠️ Basic | Format validation only |
| `did:ethr` | ⚠️ Basic | Format validation only |
| `did:sov` | ⏸️ **Pending** | **Needs implementation** |

### Sovrin Implementation Plan

**Phase 1**: Network Configuration
```typescript
// Add to src/config/env.ts
SOVRIN_MAINNET_URL=https://mainnet.sovrin.org
SOVRIN_STAGINGNET_URL=https://stagingnet.sovrin.org
SOVRIN_BUILDERNET_URL=https://buildernet.sovrin.org
```

**Phase 2**: Resolver Enhancement
```typescript
// Update src/services/didResolver.ts
async function resolveDidSovrin(did: string): Promise<DIDResolutionResult> {
  // 1. Parse Sovrin DID
  // 2. Determine network (mainnet/stagingnet/buildernet)
  // 3. Query Sovrin ledger
  // 4. Parse and validate DID document
  // 5. Cache result
  // 6. Return resolution result
}
```

**Phase 3**: Testing
- Unit tests for Sovrin DID parsing
- Integration tests with Sovrin networks
- Error handling tests
- Cache tests

---

## 🔗 Related Documentation

- [DID Resolver Service](./src/services/didResolver.ts)
- [TRQP Implementation](./IMPLEMENTATION-COMPLETE.md)
- [Seed Data Documentation](./prisma/seed.ts)

---

**Last Updated**: 2024-12-01  
**Version**: 2.0.0
