# Trust Registry API Documentation
## ToIP Trust Registry v2 Backend

This document describes the Trust Registry API endpoints for managing trust registries.

---

## 📚 Overview

Trust Registries are the core entities that manage issuers, verifiers, and credential schemas within a trust ecosystem. Each registry is identified by a unique ecosystem DID and can be linked to a Trust Framework.

---

## 🔐 Authentication

Most write operations require authentication via API key:

```
X-API-Key: your-api-key-here
```

| Endpoint | Authentication |
|----------|---------------|
| POST /v2/registries | Admin only |
| GET /v2/registries | Public |
| GET /v2/registries/:id | Public |
| PUT /v2/registries/:id | Admin or Registry Owner |
| PATCH /v2/registries/:id/trust-framework | Admin or Registry Owner |
| DELETE /v2/registries/:id/trust-framework | Admin or Registry Owner |
| POST /v2/registries/verify-did | Public |

---

## 📋 Endpoints

### Create Trust Registry

**POST** `/v2/registries`

Create a new trust registry.

**Request Body:**
```json
{
  "name": "My Trust Registry",
  "description": "A trust registry for verifiable credentials",
  "ecosystemDid": "did:web:example.com",
  "trustFrameworkId": "uuid-of-trust-framework",
  "governanceAuthority": "https://example.com/governance",
  "status": "active"
}
```

**Required Fields:**
- `name` (string, max 255 chars)
- `ecosystemDid` (string, valid DID format)

**Optional Fields:**
- `description` (string)
- `trustFrameworkId` (UUID)
- `governanceAuthority` (string, max 500 chars)
- `status` (enum: active, inactive, deprecated)

**Response (201):**
```json
{
  "message": "Trust registry created successfully",
  "data": {
    "id": "uuid",
    "name": "My Trust Registry",
    "description": "A trust registry for verifiable credentials",
    "ecosystemDid": "did:web:example.com",
    "trustFrameworkId": "uuid",
    "governanceAuthority": "https://example.com/governance",
    "status": "active",
    "createdAt": "2024-11-24T10:00:00Z",
    "updatedAt": "2024-11-24T10:00:00Z",
    "trustFramework": {
      "id": "uuid",
      "name": "Framework Name",
      "version": "1.0"
    }
  }
}
```

**Error Responses:**
- `400` - Validation error or trust framework not found
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `409` - Conflict (ecosystemDid already exists)

---

### List Trust Registries

**GET** `/v2/registries`

Retrieve a paginated list of trust registries.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | integer | 1 | Page number |
| limit | integer | 10 | Items per page (max 100) |
| status | string | - | Filter by status |
| trustFrameworkId | UUID | - | Filter by trust framework |
| ecosystemDid | string | - | Filter by DID (partial match) |

**Example:**
```
GET /v2/registries?page=1&limit=10&status=active
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Registry Name",
      "ecosystemDid": "did:web:example.com",
      "status": "active",
      "trustFramework": {
        "id": "uuid",
        "name": "Framework Name",
        "version": "1.0"
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### Get Trust Registry

**GET** `/v2/registries/:id`

Retrieve a single trust registry with related data.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "name": "Registry Name",
    "description": "Description",
    "ecosystemDid": "did:web:example.com",
    "governanceAuthority": "https://example.com/governance",
    "status": "active",
    "createdAt": "2024-11-24T10:00:00Z",
    "updatedAt": "2024-11-24T10:00:00Z",
    "trustFramework": {
      "id": "uuid",
      "name": "Framework Name",
      "version": "1.0"
    },
    "credentialSchemas": [],
    "issuers": [
      {
        "id": "uuid",
        "did": "did:web:issuer.example.com",
        "name": "Issuer Name",
        "status": "active"
      }
    ],
    "verifiers": []
  }
}
```

**Error Responses:**
- `404` - Trust registry not found

---

### Update Trust Registry

**PUT** `/v2/registries/:id`

Update an existing trust registry.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "trustFrameworkId": "new-uuid",
  "governanceAuthority": "https://new-governance.com",
  "status": "inactive"
}
```

All fields are optional. Only provided fields will be updated.

**Response (200):**
```json
{
  "message": "Trust registry updated successfully",
  "data": { ... }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin or owner)
- `404` - Trust registry not found

---

### Link to Trust Framework

**PATCH** `/v2/registries/:id/trust-framework`

Link a trust registry to a trust framework.

**Request Body:**
```json
{
  "trustFrameworkId": "uuid-of-trust-framework"
}
```

**Response (200):**
```json
{
  "message": "Trust registry linked to trust framework successfully",
  "data": { ... }
}
```

**Error Responses:**
- `400` - Trust framework is inactive or deprecated
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Registry or trust framework not found

---

### Unlink from Trust Framework

**DELETE** `/v2/registries/:id/trust-framework`

Remove the link between a trust registry and its trust framework.

**Response (200):**
```json
{
  "message": "Trust registry unlinked from trust framework successfully",
  "data": { ... }
}
```

**Error Responses:**
- `400` - Registry is not linked to any trust framework
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Registry not found

---

### Verify DID

**POST** `/v2/registries/verify-did`

Validate and resolve a DID.

**Request Body:**
```json
{
  "did": "did:web:example.com"
}
```

**Response (200):**
```json
{
  "message": "DID is valid and resolvable",
  "data": {
    "did": "did:web:example.com",
    "valid": true,
    "method": "web",
    "didDocument": {
      "@context": "https://www.w3.org/ns/did/v1",
      "id": "did:web:example.com"
    }
  }
}
```

**Supported DID Methods:**
- `did:web` - Web-based DIDs
- `did:key` - Key-based DIDs
- `did:ion` - ION DIDs
- `did:ethr` - Ethereum DIDs
- `did:sov` - Sovrin DIDs
- `did:indy` - Indy DIDs

---

## 🔍 DID Format

Ecosystem DIDs must follow the standard DID format:

```
did:<method>:<identifier>
```

**Examples:**
- `did:web:example.com`
- `did:web:example.com:registry:v1`
- `did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK`

---

## 📊 Data Model

### Trust Registry

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | string | Registry name |
| description | string | Registry description |
| ecosystemDid | string | Unique ecosystem DID |
| trustFrameworkId | UUID | Linked trust framework |
| governanceAuthority | string | Governance authority URL |
| status | enum | active, inactive, deprecated |
| createdAt | datetime | Creation timestamp |
| updatedAt | datetime | Last update timestamp |

### Relationships

- **Trust Framework**: A registry can be linked to one trust framework
- **Credential Schemas**: A registry can have multiple credential schemas
- **Issuers**: A registry can have multiple registered issuers
- **Verifiers**: A registry can have multiple registered verifiers

---

## 💡 Best Practices

1. **Use meaningful ecosystem DIDs**: Choose DIDs that represent your organization
2. **Link to trust frameworks**: Establish governance by linking to a trust framework
3. **Set appropriate status**: Use status to indicate registry availability
4. **Verify DIDs before use**: Use the verify-did endpoint to validate DIDs

---

## 🔗 Related Documentation

- [Authentication Guide](./AUTHENTICATION.md)
- [Trust Framework API](./TRUST-FRAMEWORK-API.md)
- [Swagger UI](/api-docs)

---

**Last Updated**: November 24, 2024  
**Version**: 1.0
