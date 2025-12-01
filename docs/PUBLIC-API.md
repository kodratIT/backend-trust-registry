# Public API Endpoints untuk Wallet Integration

## Base URL

```
Development: http://localhost:3000
Production:  https://trust-registry.example.com
```

---

## Trusted List Endpoints (Public - No Auth Required)

Seperti EU Trusted List, endpoint ini menyediakan daftar registry, issuer, dan verifier yang terpercaya.

### 1. List All Registries

```
GET /v2/public/registries
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "count": 2,
  "registries": [
    {
      "id": "uuid",
      "name": "Education Registry",
      "did": "did:web:edu-registry.go.id",
      "description": "Registry untuk institusi pendidikan",
      "status": "active",
      "trustFramework": {
        "id": "uuid",
        "name": "National Education Framework",
        "version": "1.0.0"
      },
      "stats": {
        "issuers": 45,
        "verifiers": 23,
        "schemas": 12
      }
    }
  ]
}
```

### 2. List All Issuers

```
GET /v2/public/issuers
GET /v2/public/issuers?registryId=xxx
GET /v2/public/issuers?credentialType=UniversityDegree
```

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "count": 45,
  "issuers": [
    {
      "id": "uuid",
      "did": "did:web:university.edu",
      "name": "University ABC",
      "status": "active",
      "endpoint": "https://api.university.edu",
      "validFrom": "2024-01-01T00:00:00Z",
      "validUntil": "2025-12-31T23:59:59Z",
      "registry": {
        "id": "uuid",
        "name": "Education Registry",
        "did": "did:web:edu-registry.go.id"
      },
      "credentialTypes": [
        { "type": "UniversityDegree", "name": "University Degree", "version": "1.0.0" }
      ]
    }
  ]
}
```

### 3. List All Verifiers

```
GET /v2/public/verifiers
GET /v2/public/verifiers?registryId=xxx
GET /v2/public/verifiers?credentialType=UniversityDegree
```

### 4. List All Schemas

```
GET /v2/public/schemas
GET /v2/public/schemas?registryId=xxx
```

### 5. Lookup Issuer by DID (Simple Check)

```
GET /v2/public/lookup/issuer/{did}
```

**Example:**
```
GET /v2/public/lookup/issuer/did%3Aweb%3Auniversity.edu
```

**Response (Found & Trusted):**
```json
{
  "found": true,
  "trusted": true,
  "issuer": {
    "did": "did:web:university.edu",
    "name": "University ABC",
    "status": "active",
    "registry": {
      "name": "Education Registry",
      "did": "did:web:edu-registry.go.id",
      "status": "active"
    },
    "credentialTypes": ["UniversityDegree", "AcademicTranscript"]
  }
}
```

**Response (Not Found):**
```json
{
  "found": false,
  "did": "did:web:unknown.edu",
  "message": "Issuer not found in any trusted registry"
}
```

### 6. Lookup Verifier by DID

```
GET /v2/public/lookup/verifier/{did}
```

---

## TRQP v2 Endpoints (Public - No Auth Required)

### 1. Authorization Query

Cek apakah issuer/verifier berwenang untuk action tertentu.

```
POST /v2/authorization
Content-Type: application/json
```

**Request Body:**
```json
{
  "entity_id": "did:web:issuer.example.com",
  "authority_id": "did:web:registry.example.com",
  "action": "issue",
  "resource": "UniversityDegree",
  "context": {
    "time": "2024-01-15T10:30:00Z"
  }
}
```

**Response (Authorized):**
```json
{
  "authorized": true,
  "entity_id": "did:web:issuer.example.com",
  "authority_id": "did:web:registry.example.com",
  "action": "issue",
  "resource": "UniversityDegree",
  "time_evaluated": "2024-01-15T10:30:00Z",
  "message": "Entity is authorized"
}
```

**Response (Not Authorized):**
```json
{
  "authorized": false,
  "entity_id": "did:web:unknown.example.com",
  "authority_id": "did:web:registry.example.com",
  "action": "issue",
  "resource": "UniversityDegree",
  "time_evaluated": "2024-01-15T10:30:00Z",
  "message": "Entity not found in registry"
}
```

---

### 2. Recognition Query

Cek apakah authority mengakui authority lain.

```
POST /v2/recognition
Content-Type: application/json
```

**Request Body:**
```json
{
  "entity_id": "did:web:other-registry.example.com",
  "authority_id": "did:web:main-registry.example.com",
  "action": "recognize",
  "resource": "professional-licenses",
  "context": {
    "time": "2024-01-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "recognized": true,
  "entity_id": "did:web:other-registry.example.com",
  "authority_id": "did:web:main-registry.example.com",
  "action": "recognize",
  "resource": "professional-licenses",
  "time_evaluated": "2024-01-15T10:30:00Z"
}
```

---

### 3. Registry Metadata (Service Discovery)

Dapatkan informasi lengkap tentang registry capabilities, endpoints, dan features.

```
GET /v2/metadata
```

**Response:**
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
    "public": {
      "registries": "/v2/public/registries",
      "issuers": "/v2/public/issuers",
      "verifiers": "/v2/public/verifiers",
      "schemas": "/v2/public/schemas",
      "lookupIssuer": "/v2/public/lookup/issuer/{did}",
      "lookupVerifier": "/v2/public/lookup/verifier/{did}"
    }
  },
  
  "supportedActions": [
    "issue",
    "verify",
    "recognize",
    "govern",
    "delegate"
  ],
  
  "supportedDIDMethods": [
    "web",
    "key",
    "indy",
    "ion",
    "ethr",
    "sov"
  ],
  
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
  "status": "operational",
  "timestamp": "2024-11-27T10:30:00Z"
}
```

**Use Cases:**
- **Service Discovery**: Wallet auto-discovers registry capabilities
- **Federation**: Other registries check compatibility
- **Developer Onboarding**: Quick overview of available features
- **Version Detection**: Clients know which protocol version is supported

---

## Wallet Integration - Recommended Approach

### Approach 0: Service Discovery (Auto-Configuration)

Wallet pertama kali connect, fetch metadata untuk auto-configure:

```typescript
// Discover registry capabilities
async function configureRegistry(registryUrl: string) {
  const metadata = await fetch(`${registryUrl}/v2/metadata`).then(r => r.json());
  
  console.log(`Connected to: ${metadata.name} v${metadata.version}`);
  console.log(`Protocol: ${metadata.protocol}`);
  console.log(`Supported actions:`, metadata.supportedActions);
  console.log(`Supported DID methods:`, metadata.supportedDIDMethods);
  
  // Check features
  if (metadata.features.authorization) {
    console.log('✅ Authorization queries supported');
  }
  
  if (metadata.features.recognition) {
    console.log('✅ Cross-registry trust supported');
  }
  
  if (metadata.features.publicTrustedList) {
    console.log('✅ Public trusted list available');
  }
  
  // Save endpoints for later use
  return {
    authEndpoint: `${registryUrl}${metadata.endpoints.authorization}`,
    recognitionEndpoint: `${registryUrl}${metadata.endpoints.recognition}`,
    publicIssuersEndpoint: `${registryUrl}${metadata.endpoints.public.issuers}`,
    publicVerifiersEndpoint: `${registryUrl}${metadata.endpoints.public.verifiers}`,
  };
}

// Usage
const endpoints = await configureRegistry('https://trust-registry.example.com');
```

### Approach 1: Simple Lookup (Recommended for Wallet)

Wallet cukup lookup issuer/verifier DID tanpa perlu tau registry:

```typescript
// Wallet hanya perlu DID, tidak perlu authority_id
async function checkIssuerTrust(issuerDid: string): Promise<{
  trusted: boolean;
  issuer?: any;
  message?: string;
}> {
  const encodedDid = encodeURIComponent(issuerDid);
  const response = await fetch(
    `https://trust-registry.example.com/v2/public/lookup/issuer/${encodedDid}`
  );
  
  const result = await response.json();
  
  return {
    trusted: result.found && result.trusted,
    issuer: result.issuer,
    message: result.message
  };
}

// Usage
const { trusted, issuer } = await checkIssuerTrust('did:web:university.edu');
if (trusted) {
  console.log(`✅ Trusted issuer from ${issuer.registry.name}`);
} else {
  console.log('⚠️ Issuer not in trusted list');
}
```

### Approach 2: Fetch & Cache Trusted List

Wallet fetch list sekali, lalu cache untuk offline check:

```typescript
// Fetch trusted list saat app start
async function fetchTrustedList() {
  const [issuers, verifiers] = await Promise.all([
    fetch('https://trust-registry.example.com/v2/public/issuers').then(r => r.json()),
    fetch('https://trust-registry.example.com/v2/public/verifiers').then(r => r.json())
  ]);
  
  // Cache locally
  await AsyncStorage.setItem('trustedIssuers', JSON.stringify(issuers.issuers));
  await AsyncStorage.setItem('trustedVerifiers', JSON.stringify(verifiers.verifiers));
  await AsyncStorage.setItem('trustedListUpdated', new Date().toISOString());
}

// Check from cache
function isIssuerTrusted(issuerDid: string): boolean {
  const cachedIssuers = JSON.parse(AsyncStorage.getItem('trustedIssuers') || '[]');
  return cachedIssuers.some(i => i.did === issuerDid && i.status === 'active');
}
```

### Approach 3: TRQP Query (Full Protocol)

Untuk compliance penuh dengan ToIP TRQP:

```typescript
// Perlu tau registry DID (dari credential atau config)
async function checkAuthorizationTRQP(
  entityDid: string,
  registryDid: string,
  action: 'issue' | 'verify',
  credentialType: string
): Promise<boolean> {
  const response = await fetch('https://trust-registry.example.com/v2/authorization', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entity_id: entityDid,
      authority_id: registryDid,
      action,
      resource: credentialType
    })
  });
  
  const result = await response.json();
  return result.authorized;
}
```

---

## Wallet Integration Examples

### JavaScript/TypeScript

```typescript
// Check if issuer is authorized
async function checkIssuerAuthorization(
  issuerDid: string,
  registryDid: string,
  credentialType: string
): Promise<boolean> {
  const response = await fetch('http://localhost:3000/v2/authorization', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entity_id: issuerDid,
      authority_id: registryDid,
      action: 'issue',
      resource: credentialType,
    }),
  });

  const result = await response.json();
  return result.authorized;
}

// Usage in wallet
const isAuthorized = await checkIssuerAuthorization(
  'did:web:university-abc.edu',
  'did:web:edu-registry.example.com',
  'UniversityDegree'
);

if (isAuthorized) {
  console.log('✅ Issuer is trusted');
} else {
  console.log('❌ Issuer is NOT trusted');
}
```

### React Native (Mobile Wallet)

```typescript
import axios from 'axios';

const TRUST_REGISTRY_URL = 'http://localhost:3000';

export const TrustRegistryService = {
  async verifyIssuer(
    issuerDid: string,
    registryDid: string,
    credentialType: string
  ): Promise<{
    authorized: boolean;
    message?: string;
  }> {
    try {
      const response = await axios.post(
        `${TRUST_REGISTRY_URL}/v2/authorization`,
        {
          entity_id: issuerDid,
          authority_id: registryDid,
          action: 'issue',
          resource: credentialType,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Trust Registry error:', error);
      return { authorized: false, message: 'Failed to verify' };
    }
  },

  async verifyVerifier(
    verifierDid: string,
    registryDid: string,
    credentialType: string
  ): Promise<{
    authorized: boolean;
    message?: string;
  }> {
    try {
      const response = await axios.post(
        `${TRUST_REGISTRY_URL}/v2/authorization`,
        {
          entity_id: verifierDid,
          authority_id: registryDid,
          action: 'verify',
          resource: credentialType,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Trust Registry error:', error);
      return { authorized: false, message: 'Failed to verify' };
    }
  },

  async checkCrossRegistryTrust(
    entityRegistryDid: string,
    authorityRegistryDid: string,
    scope: string
  ): Promise<{
    recognized: boolean;
    message?: string;
  }> {
    try {
      const response = await axios.post(
        `${TRUST_REGISTRY_URL}/v2/recognition`,
        {
          entity_id: entityRegistryDid,
          authority_id: authorityRegistryDid,
          action: 'recognize',
          resource: scope,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Trust Registry error:', error);
      return { recognized: false, message: 'Failed to check recognition' };
    }
  },
};
```

### Python

```python
import requests

TRUST_REGISTRY_URL = "http://localhost:3000"

def check_issuer_authorization(issuer_did: str, registry_did: str, credential_type: str) -> dict:
    """Check if an issuer is authorized to issue a credential type."""
    response = requests.post(
        f"{TRUST_REGISTRY_URL}/v2/authorization",
        json={
            "entity_id": issuer_did,
            "authority_id": registry_did,
            "action": "issue",
            "resource": credential_type
        }
    )
    return response.json()

def check_verifier_authorization(verifier_did: str, registry_did: str, credential_type: str) -> dict:
    """Check if a verifier is authorized to verify a credential type."""
    response = requests.post(
        f"{TRUST_REGISTRY_URL}/v2/authorization",
        json={
            "entity_id": verifier_did,
            "authority_id": registry_did,
            "action": "verify",
            "resource": credential_type
        }
    )
    return response.json()

# Usage
result = check_issuer_authorization(
    "did:web:university-abc.edu",
    "did:web:edu-registry.example.com",
    "UniversityDegree"
)

if result["authorized"]:
    print("✅ Issuer is trusted")
else:
    print(f"❌ Not authorized: {result.get('message', 'Unknown reason')}")
```

### cURL

```bash
# Check Issuer Authorization
curl -X POST http://localhost:3000/v2/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "did:web:university-abc.edu",
    "authority_id": "did:web:edu-registry.example.com",
    "action": "issue",
    "resource": "UniversityDegree"
  }'

# Check Verifier Authorization
curl -X POST http://localhost:3000/v2/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "did:web:hr-platform.example.com",
    "authority_id": "did:web:edu-registry.example.com",
    "action": "verify",
    "resource": "UniversityDegree"
  }'

# Check Recognition (Cross-Registry Trust)
curl -X POST http://localhost:3000/v2/recognition \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "did:web:partner-registry.example.com",
    "authority_id": "did:web:main-registry.example.com",
    "action": "recognize",
    "resource": "professional-licenses"
  }'

# Get Metadata
curl -X GET http://localhost:3000/v2/metadata
```

---

## Wallet Verification Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     WALLET APP                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Receive Credential from Issuer                          │
│     ↓                                                        │
│  2. Extract issuer DID from credential                      │
│     issuer: "did:web:university-abc.edu"                    │
│     ↓                                                        │
│  3. Query Trust Registry                                     │
│     POST /v2/authorization                                   │
│     {                                                        │
│       entity_id: "did:web:university-abc.edu",              │
│       authority_id: "did:web:edu-registry.example.com",     │
│       action: "issue",                                       │
│       resource: "UniversityDegree"                          │
│     }                                                        │
│     ↓                                                        │
│  4. Check Response                                           │
│     if (authorized === true) {                              │
│       ✅ Show "Trusted Issuer" badge                        │
│       Store credential                                       │
│     } else {                                                 │
│       ⚠️ Show warning "Unverified Issuer"                   │
│       Ask user confirmation                                  │
│     }                                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Known Registries

Untuk development/testing, gunakan registry berikut:

| Registry | Ecosystem DID | Scope |
|----------|---------------|-------|
| Education Registry | `did:web:edu-registry.example.com` | Academic credentials |
| Government Registry | `did:web:gov-registry.example.com` | Identity credentials |
| Healthcare Registry | `did:web:health-registry.example.com` | Medical credentials |

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success (check `authorized`/`recognized` field) |
| 400 | Bad Request - Missing required fields |
| 500 | Server Error |

---

## Rate Limiting

- **Window**: 60 seconds
- **Max Requests**: 100 per window
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

---

## Production Deployment

Untuk production, ganti URL dengan domain publik:

```
https://trust-registry.yourdomain.com/v2/authorization
https://trust-registry.yourdomain.com/v2/recognition
https://trust-registry.yourdomain.com/v2/metadata
```

Pastikan:
- ✅ HTTPS enabled
- ✅ CORS configured untuk domain wallet
- ✅ Rate limiting aktif
- ✅ Monitoring dan logging
