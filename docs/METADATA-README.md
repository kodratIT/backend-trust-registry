# Metadata Endpoint Documentation

## 📚 Documentation Index

This directory contains complete documentation for the TRQP Metadata Endpoint implementation.

---

## 🚀 Quick Start

**New to metadata endpoint?** Start here:

1. **[Quick Reference](../METADATA-QUICK-REFERENCE.md)** ⭐ - 5-minute overview
2. **[Complete Guide](./METADATA-ENDPOINT.md)** - Full documentation
3. **[Client Examples](./examples/metadata-client-examples.md)** - Code examples in 6 languages

---

## 📖 Documentation Files

### For Developers

| Document | Description | Time to Read |
|----------|-------------|--------------|
| [Quick Reference](../METADATA-QUICK-REFERENCE.md) | Quick reference card with common use cases | 5 min |
| [Complete Guide](./METADATA-ENDPOINT.md) | Full endpoint documentation with examples | 15 min |
| [Client Examples](./examples/metadata-client-examples.md) | Multi-language client implementations | 10 min |
| [Public API Guide](./PUBLIC-API.md) | Public API documentation including metadata | 20 min |

### For Registry Operators

| Document | Description | Time to Read |
|----------|-------------|--------------|
| [Implementation Summary](../METADATA-IMPLEMENTATION-SUMMARY.md) | What was implemented and how | 10 min |
| [Swagger Update](../SWAGGER-UPDATE.md) | Swagger/OpenAPI documentation changes | 5 min |
| [Changelog](../CHANGELOG-METADATA.md) | Detailed changelog of implementation | 5 min |

### For Project Managers

| Document | Description | Time to Read |
|----------|-------------|--------------|
| [Implementation Complete](../IMPLEMENTATION-COMPLETE.md) | Final status and compliance report | 10 min |

---

## 🎯 Use Case Guides

### 1. Wallet Integration

**Goal**: Auto-configure wallet to connect to registry

**Read**:
1. [Quick Reference - Auto-Configure Client](../METADATA-QUICK-REFERENCE.md#1-auto-configure-client)
2. [Client Examples - JavaScript/TypeScript](./examples/metadata-client-examples.md#javascripttypescript)

**Time**: 10 minutes

---

### 2. Federation Setup

**Goal**: Check compatibility before federating with another registry

**Read**:
1. [Quick Reference - Check Compatibility](../METADATA-QUICK-REFERENCE.md#2-check-compatibility)
2. [Complete Guide - Federation Use Case](./METADATA-ENDPOINT.md#2-federation-compatibility-check)

**Time**: 10 minutes

---

### 3. Multi-Registry Client

**Goal**: Build application that connects to multiple registries

**Read**:
1. [Client Examples - Multi-Registry Client](./examples/metadata-client-examples.md#4-multi-registry-client)
2. [Complete Guide - Multi-Registry Client](./METADATA-ENDPOINT.md#4-multi-registry-client)

**Time**: 15 minutes

---

### 4. Developer Onboarding

**Goal**: Quickly understand registry capabilities

**Read**:
1. [Quick Reference](../METADATA-QUICK-REFERENCE.md)
2. [Complete Guide - Developer Onboarding](./METADATA-ENDPOINT.md#3-developer-onboarding)

**Time**: 5 minutes

---

## 🔗 Quick Links

### Endpoint
```
GET /v2/metadata
```

### Live Documentation
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI Spec**: http://localhost:3000/api-docs/swagger.json

### Testing
```bash
# Quick test
curl http://localhost:3000/v2/metadata | jq '.'

# Full test suite
npm test -- metadataController.test.ts

# Manual test script
./test-metadata.sh
```

---

## 📊 Response Structure

```json
{
  "name": "ToIP Trust Registry v2",
  "version": "2.0.0",
  "protocol": "ToIP Trust Registry Query Protocol v2",
  "endpoints": { ... },
  "supportedActions": [ ... ],
  "supportedDIDMethods": [ ... ],
  "features": { ... },
  "status": "operational"
}
```

**Full schema**: See [Swagger Update](../SWAGGER-UPDATE.md#schema-structure)

---

## 💻 Code Examples

### JavaScript/TypeScript
```typescript
const metadata = await fetch('/v2/metadata').then(r => r.json());
console.log(`Registry: ${metadata.name} v${metadata.version}`);
```

### Python
```python
import requests
metadata = requests.get('/v2/metadata').json()
print(f"Registry: {metadata['name']} v{metadata['version']}")
```

### cURL
```bash
curl http://localhost:3000/v2/metadata | jq '.'
```

**More examples**: See [Client Examples](./examples/metadata-client-examples.md)

---

## 🎓 Learning Path

### Beginner (30 minutes)
1. Read [Quick Reference](../METADATA-QUICK-REFERENCE.md) (5 min)
2. Try [cURL examples](../METADATA-QUICK-REFERENCE.md#curl) (5 min)
3. Read [Complete Guide - Overview](./METADATA-ENDPOINT.md#overview) (10 min)
4. Test in [Swagger UI](http://localhost:3000/api-docs) (10 min)

### Intermediate (1 hour)
1. Complete Beginner path (30 min)
2. Read [Client Examples - JavaScript](./examples/metadata-client-examples.md#javascripttypescript) (15 min)
3. Implement auto-configuration in your app (15 min)

### Advanced (2 hours)
1. Complete Intermediate path (1 hour)
2. Read [Complete Guide](./METADATA-ENDPOINT.md) (30 min)
3. Implement multi-registry client (30 min)

---

## 🔍 Search by Topic

### Service Discovery
- [Quick Reference - Auto-Configure](../METADATA-QUICK-REFERENCE.md#1-auto-configure-client)
- [Complete Guide - Service Discovery](./METADATA-ENDPOINT.md#1-service-discovery-wallet-auto-configuration)

### Federation
- [Quick Reference - Check Compatibility](../METADATA-QUICK-REFERENCE.md#2-check-compatibility)
- [Complete Guide - Federation](./METADATA-ENDPOINT.md#2-federation-compatibility-check)

### Features & Capabilities
- [Quick Reference - Key Features](../METADATA-QUICK-REFERENCE.md#key-features)
- [Complete Guide - Response Fields](./METADATA-ENDPOINT.md#response-fields)

### DID Methods
- [Quick Reference - Supported DID Methods](../METADATA-QUICK-REFERENCE.md#supported-did-methods)
- [Complete Guide - Validate DID Method](../METADATA-QUICK-REFERENCE.md#3-validate-did-method)

### Caching
- [Quick Reference - Performance Tips](../METADATA-QUICK-REFERENCE.md#performance-tips)
- [Complete Guide - Caching](./METADATA-ENDPOINT.md#caching)

---

## 🧪 Testing Resources

### Automated Tests
```bash
npm test -- metadataController.test.ts
```

**Test file**: `src/controllers/__tests__/metadataController.test.ts`

### Manual Testing
```bash
./test-metadata.sh
```

**Test script**: `test-metadata.sh`

### Swagger UI
```
http://localhost:3000/api-docs
```

---

## 📞 Support

### Documentation Issues
If you find any issues with the documentation:
1. Check [Implementation Complete](../IMPLEMENTATION-COMPLETE.md) for known issues
2. Review [Changelog](../CHANGELOG-METADATA.md) for recent changes
3. Contact technical team

### Implementation Questions
For questions about implementation:
1. Review [Implementation Summary](../METADATA-IMPLEMENTATION-SUMMARY.md)
2. Check [Swagger Update](../SWAGGER-UPDATE.md) for API details
3. Refer to [TRQP Specification](https://trustoverip.github.io/tswg-trust-registry-protocol/)

---

## 🎯 Compliance

✅ **TRQP v2 Specification** - Full compliance  
✅ **W3C DID Core** - 90% compliance  
✅ **REST API Best Practices** - Full compliance  
✅ **OpenAPI 3.0** - Full compliance  

**Details**: See [Implementation Complete](../IMPLEMENTATION-COMPLETE.md#trqp-v2-compliance)

---

## 🔄 Updates

**Last Updated**: 2024-11-27  
**Version**: 2.0.0  
**Status**: ✅ Complete & Production Ready  

**Changelog**: See [CHANGELOG-METADATA.md](../CHANGELOG-METADATA.md)

---

## 📚 External Resources

- **TRQP Specification**: https://trustoverip.github.io/tswg-trust-registry-protocol/
- **W3C DID Core**: https://www.w3.org/TR/did-core/
- **OpenAPI Specification**: https://swagger.io/specification/
- **Service Discovery Pattern**: https://microservices.io/patterns/server-side-discovery.html

---

**Need help?** Start with the [Quick Reference](../METADATA-QUICK-REFERENCE.md) or jump to [Client Examples](./examples/metadata-client-examples.md)!
