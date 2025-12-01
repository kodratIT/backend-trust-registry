# Metadata Endpoint - Quick Reference

## 🚀 Quick Start

```bash
# Fetch metadata
curl http://localhost:3000/v2/metadata | jq '.'

# Check if authorization is supported
curl -s http://localhost:3000/v2/metadata | jq '.features.authorization'

# Get list of endpoints
curl -s http://localhost:3000/v2/metadata | jq '.endpoints'
```

---

## 📍 Endpoint

```
GET /v2/metadata
```

**Authentication**: Not required  
**Rate Limit**: 60 requests/minute  
**Cache**: Recommended (1 hour TTL)

---

## 📦 Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Registry name |
| `version` | string | Registry version |
| `protocol` | string | TRQP protocol version |
| `specification` | string | Link to TRQP spec |
| `endpoints` | object | All available endpoints |
| `supportedActions` | array | TRQP actions supported |
| `supportedDIDMethods` | array | DID methods supported |
| `features` | object | Feature flags |
| `status` | string | Service status |
| `timestamp` | string | Current server time |

---

## 🎯 Common Use Cases

### 1. Auto-Configure Client

```typescript
const metadata = await fetch(`${registryUrl}/v2/metadata`).then(r => r.json());

const config = {
  authEndpoint: `${registryUrl}${metadata.endpoints.authorization}`,
  recognitionEndpoint: `${registryUrl}${metadata.endpoints.recognition}`,
  supportsRecognition: metadata.features.recognition,
};
```

### 2. Check Compatibility

```typescript
const metadata = await fetch(`${registryUrl}/v2/metadata`).then(r => r.json());

if (metadata.protocol !== 'ToIP Trust Registry Query Protocol v2') {
  throw new Error('Incompatible protocol');
}

if (!metadata.features.authorization) {
  throw new Error('Authorization not supported');
}
```

### 3. Validate DID Method

```typescript
const metadata = await fetch(`${registryUrl}/v2/metadata`).then(r => r.json());

const didMethod = issuerDid.split(':')[1]; // e.g., 'web' from 'did:web:...'

if (!metadata.supportedDIDMethods.includes(didMethod)) {
  console.warn(`DID method '${didMethod}' not supported`);
}
```

---

## 🔑 Key Features

| Feature | Flag | Description |
|---------|------|-------------|
| Authorization Queries | `features.authorization` | TRQP authorization endpoint |
| Recognition Queries | `features.recognition` | TRQP recognition endpoint |
| Delegation | `features.delegation` | Issuer delegation support |
| Federation | `features.federation` | Cross-registry federation |
| Signed Entries | `features.signedEntries` | Cryptographic signatures |
| Audit Log | `features.auditLog` | Comprehensive audit trail |
| Public Trusted List | `features.publicTrustedList` | EU-style trusted list |
| DID Resolution | `features.didResolution` | DID resolution service |
| Caching | `features.caching` | Response caching |
| Rate Limiting | `features.rateLimiting` | Request rate limiting |

---

## 📋 Supported Actions

- `issue` - Authorize entity to issue credentials
- `verify` - Authorize entity to verify credentials
- `recognize` - Recognize another authority
- `govern` - Governance authority
- `delegate` - Delegate authority

---

## 🆔 Supported DID Methods

- `web` - did:web (Web DID)
- `key` - did:key (Key DID)
- `indy` - did:indy (Hyperledger Indy)
- `ion` - did:ion (ION)
- `ethr` - did:ethr (Ethereum)
- `sov` - did:sov (Sovrin)

---

## 🔗 Available Endpoints

### TRQP Core
- `/v2/authorization` - Authorization queries
- `/v2/recognition` - Recognition queries
- `/v2/metadata` - This endpoint

### Public (No Auth)
- `/v2/public/registries` - List all registries
- `/v2/public/issuers` - List all issuers
- `/v2/public/verifiers` - List all verifiers
- `/v2/public/schemas` - List all schemas
- `/v2/public/lookup/issuer/{did}` - Lookup issuer by DID
- `/v2/public/lookup/verifier/{did}` - Lookup verifier by DID

### Management (Auth Required)
- `/v2/trust-frameworks` - Trust frameworks
- `/v2/registries` - Registries
- `/v2/schemas` - Credential schemas
- `/v2/issuers` - Issuers
- `/v2/verifiers` - Verifiers
- `/v2/recognitions` - Recognition statements
- `/v2/audit-log` - Audit logs

---

## 💻 Code Examples

### JavaScript/TypeScript

```typescript
const metadata = await fetch('http://localhost:3000/v2/metadata')
  .then(response => response.json());

console.log(`Registry: ${metadata.name} v${metadata.version}`);
console.log(`Protocol: ${metadata.protocol}`);
console.log(`Features:`, metadata.features);
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/v2/metadata')
metadata = response.json()

print(f"Registry: {metadata['name']} v{metadata['version']}")
print(f"Protocol: {metadata['protocol']}")
print(f"Features: {metadata['features']}")
```

### cURL + jq

```bash
# Full metadata
curl -s http://localhost:3000/v2/metadata | jq '.'

# Specific fields
curl -s http://localhost:3000/v2/metadata | jq '{
  name: .name,
  version: .version,
  protocol: .protocol,
  features: .features
}'
```

---

## ⚡ Performance Tips

1. **Cache the response** (1 hour recommended)
2. **Don't fetch on every request**
3. **Use conditional requests** (If-Modified-Since)
4. **Store in local storage** for offline access

```typescript
// Cache example
const CACHE_KEY = 'registry-metadata';
const CACHE_TTL = 3600000; // 1 hour

async function getMetadata() {
  const cached = localStorage.getItem(CACHE_KEY);
  const cacheTime = localStorage.getItem(`${CACHE_KEY}-time`);
  
  if (cached && cacheTime && Date.now() - parseInt(cacheTime) < CACHE_TTL) {
    return JSON.parse(cached);
  }
  
  const metadata = await fetch('/v2/metadata').then(r => r.json());
  localStorage.setItem(CACHE_KEY, JSON.stringify(metadata));
  localStorage.setItem(`${CACHE_KEY}-time`, Date.now().toString());
  
  return metadata;
}
```

---

## 🧪 Testing

```bash
# Run automated tests
npm test -- metadataController.test.ts

# Manual testing
./test-metadata.sh

# Or with curl
curl http://localhost:3000/v2/metadata | jq '.'
```

---

## 📚 Documentation

- **Complete Guide**: [docs/METADATA-ENDPOINT.md](./docs/METADATA-ENDPOINT.md)
- **Client Examples**: [docs/examples/metadata-client-examples.md](./docs/examples/metadata-client-examples.md)
- **Implementation Summary**: [METADATA-IMPLEMENTATION-SUMMARY.md](./METADATA-IMPLEMENTATION-SUMMARY.md)
- **Public API**: [docs/PUBLIC-API.md](./docs/PUBLIC-API.md)

---

## ✅ Checklist for Clients

- [ ] Fetch metadata on first connection
- [ ] Cache metadata (1 hour TTL)
- [ ] Validate protocol version
- [ ] Check required features
- [ ] Validate DID method support
- [ ] Handle errors gracefully
- [ ] Use discovered endpoints
- [ ] Refresh on protocol errors

---

## 🎖️ Compliance

✅ TRQP v2 Specification  
✅ W3C DID Core  
✅ REST API Best Practices  
✅ Service Discovery Pattern  
✅ OpenAPI/Swagger  

---

**Quick Links**:
- [TRQP Spec](https://trustoverip.github.io/tswg-trust-registry-protocol/)
- [API Docs](http://localhost:3000/api-docs)
- [GitHub](https://github.com/trustoverip/tswg-trust-registry-protocol)
