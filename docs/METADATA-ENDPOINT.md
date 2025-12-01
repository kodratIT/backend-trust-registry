# TRQP Metadata Endpoint

## Overview

The metadata endpoint (`/v2/metadata`) provides comprehensive information about the Trust Registry's capabilities, supported features, and available endpoints. This enables **service discovery** and **auto-configuration** for clients.

## Endpoint

```
GET /v2/metadata
```

**Authentication**: Not required (public endpoint)

## Response Structure

```json
{
  "name": "ToIP Trust Registry v2",
  "version": "2.0.0",
  "protocol": "ToIP Trust Registry Query Protocol v2",
  "specification": "https://trustoverip.github.io/tswg-trust-registry-protocol/",
  "description": "A verifiable credentials trust registry implementing TRQP v2 specification",
  
  "endpoints": {
    "authorization": "/v2/authorization",
    "recognition": "/v2/recognition",
    "metadata": "/v2/metadata",
    "public": { ... },
    "management": { ... }
  },
  
  "supportedActions": ["issue", "verify", "recognize", "govern", "delegate"],
  "supportedDIDMethods": ["web", "key", "indy", "ion", "ethr", "sov"],
  
  "features": {
    "authorization": true,
    "recognition": true,
    "delegation": true,
    "federation": true,
    "signedEntries": true,
    "auditLog": true,
    "publicTrustedList": true,
    "didResolution": true,
    "caching": true,
    "rateLimiting": true
  },
  
  "documentation": "http://localhost:3000/api-docs",
  "contact": {
    "name": "Technical Team",
    "email": "support@trustregistry.example.com"
  },
  "status": "operational",
  "timestamp": "2024-11-27T10:30:00Z"
}
```

## Use Cases

### 1. Service Discovery (Wallet Auto-Configuration)

Wallets can automatically discover registry capabilities:

```typescript
async function connectToRegistry(registryUrl: string) {
  const metadata = await fetch(`${registryUrl}/v2/metadata`).then(r => r.json());
  
  // Auto-configure endpoints
  const config = {
    name: metadata.name,
    version: metadata.version,
    authEndpoint: `${registryUrl}${metadata.endpoints.authorization}`,
    recognitionEndpoint: `${registryUrl}${metadata.endpoints.recognition}`,
    publicIssuersEndpoint: `${registryUrl}${metadata.endpoints.public.issuers}`,
  };
  
  // Check capabilities
  if (!metadata.features.authorization) {
    throw new Error('Registry does not support authorization queries');
  }
  
  // Check DID method support
  if (!metadata.supportedDIDMethods.includes('web')) {
    console.warn('Registry does not support did:web');
  }
  
  return config;
}
```

### 2. Federation Compatibility Check

Registries can check compatibility before federation:

```typescript
async function checkFederationCompatibility(remoteRegistryUrl: string) {
  const metadata = await fetch(`${remoteRegistryUrl}/v2/metadata`).then(r => r.json());
  
  // Check protocol version
  if (metadata.protocol !== 'ToIP Trust Registry Query Protocol v2') {
    return {
      compatible: false,
      reason: 'Incompatible protocol version'
    };
  }
  
  // Check if recognition is supported
  if (!metadata.features.recognition) {
    return {
      compatible: false,
      reason: 'Remote registry does not support recognition queries'
    };
  }
  
  // Check supported actions
  if (!metadata.supportedActions.includes('recognize')) {
    return {
      compatible: false,
      reason: 'Remote registry does not support recognize action'
    };
  }
  
  return {
    compatible: true,
    metadata
  };
}
```

### 3. Developer Onboarding

Developers can quickly understand registry capabilities:

```bash
# Quick check of registry capabilities
curl https://trust-registry.example.com/v2/metadata | jq

# Check if authorization is supported
curl https://trust-registry.example.com/v2/metadata | jq '.features.authorization'

# Get list of supported DID methods
curl https://trust-registry.example.com/v2/metadata | jq '.supportedDIDMethods'

# Get all available endpoints
curl https://trust-registry.example.com/v2/metadata | jq '.endpoints'
```

### 4. Multi-Registry Client

Applications that connect to multiple registries:

```typescript
class MultiRegistryClient {
  private registries: Map<string, RegistryConfig> = new Map();
  
  async addRegistry(url: string) {
    const metadata = await fetch(`${url}/v2/metadata`).then(r => r.json());
    
    this.registries.set(url, {
      name: metadata.name,
      version: metadata.version,
      endpoints: metadata.endpoints,
      features: metadata.features,
      supportedActions: metadata.supportedActions,
      supportedDIDMethods: metadata.supportedDIDMethods,
    });
    
    console.log(`✅ Added registry: ${metadata.name}`);
    console.log(`   Features: ${Object.keys(metadata.features).filter(k => metadata.features[k]).join(', ')}`);
  }
  
  async checkAuthorization(issuerDid: string, credentialType: string) {
    // Find registries that support the issuer's DID method
    const didMethod = issuerDid.split(':')[1];
    
    for (const [url, config] of this.registries) {
      if (config.supportedDIDMethods.includes(didMethod)) {
        // Try authorization query
        const result = await this.queryAuthorization(url, issuerDid, credentialType);
        if (result.authorized) {
          return { authorized: true, registry: config.name };
        }
      }
    }
    
    return { authorized: false };
  }
}
```

## Response Fields

### Core Information

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Registry name |
| `version` | string | Registry version (semver) |
| `protocol` | string | Protocol name and version |
| `specification` | string | URL to TRQP specification |
| `description` | string | Registry description |

### Endpoints

| Field | Type | Description |
|-------|------|-------------|
| `endpoints.authorization` | string | Authorization query endpoint |
| `endpoints.recognition` | string | Recognition query endpoint |
| `endpoints.metadata` | string | This metadata endpoint |
| `endpoints.public` | object | Public endpoints (no auth) |
| `endpoints.management` | object | Management endpoints (auth required) |

### Capabilities

| Field | Type | Description |
|-------|------|-------------|
| `supportedActions` | string[] | TRQP actions supported |
| `supportedDIDMethods` | string[] | DID methods supported |

### Features

| Field | Type | Description |
|-------|------|-------------|
| `features.authorization` | boolean | Authorization queries supported |
| `features.recognition` | boolean | Recognition queries supported |
| `features.delegation` | boolean | Delegation supported |
| `features.federation` | boolean | Federation supported |
| `features.signedEntries` | boolean | Cryptographic signatures on entries |
| `features.auditLog` | boolean | Audit logging enabled |
| `features.publicTrustedList` | boolean | Public trusted list available |
| `features.didResolution` | boolean | DID resolution service |
| `features.caching` | boolean | Response caching enabled |
| `features.rateLimiting` | boolean | Rate limiting enabled |

### Additional Info

| Field | Type | Description |
|-------|------|-------------|
| `documentation` | string | URL to API documentation |
| `contact` | object | Contact information |
| `status` | string | Service status (operational, maintenance, etc) |
| `timestamp` | string | Current server time (ISO 8601) |

## Examples

### cURL

```bash
curl -X GET https://trust-registry.example.com/v2/metadata
```

### JavaScript/TypeScript

```typescript
const metadata = await fetch('https://trust-registry.example.com/v2/metadata')
  .then(response => response.json());

console.log(`Registry: ${metadata.name} v${metadata.version}`);
console.log(`Protocol: ${metadata.protocol}`);
console.log(`Features:`, metadata.features);
```

### Python

```python
import requests

response = requests.get('https://trust-registry.example.com/v2/metadata')
metadata = response.json()

print(f"Registry: {metadata['name']} v{metadata['version']}")
print(f"Protocol: {metadata['protocol']}")
print(f"Features: {metadata['features']}")
```

## Caching

The metadata endpoint response can be cached by clients:

```http
Cache-Control: public, max-age=3600
```

Clients should refresh metadata:
- On first connection
- After 1 hour (or based on Cache-Control header)
- When receiving unexpected errors (protocol mismatch)

## Error Handling

The metadata endpoint should always return 200 OK. If the service is unavailable, standard HTTP error codes apply:

- `500 Internal Server Error` - Service error
- `503 Service Unavailable` - Maintenance mode

## Best Practices

### For Registry Operators

1. **Keep metadata up-to-date** - Update when features change
2. **Use semantic versioning** - Follow semver for version field
3. **Document breaking changes** - Update specification URL
4. **Monitor metadata requests** - Track client discovery patterns

### For Client Developers

1. **Cache metadata** - Don't fetch on every request
2. **Handle missing features gracefully** - Check feature flags
3. **Validate protocol version** - Ensure compatibility
4. **Use service discovery** - Don't hardcode endpoints

## Compliance

This metadata endpoint follows:
- ✅ TRQP v2 Specification recommendations
- ✅ REST API best practices
- ✅ OpenAPI/Swagger conventions
- ✅ Service discovery patterns

## Related Documentation

- [TRQP API Documentation](./TRQP-API.md)
- [Public API Documentation](./PUBLIC-API.md)
- [API Guide](./API-GUIDE.md)
- [TRQP Specification](https://trustoverip.github.io/tswg-trust-registry-protocol/)
