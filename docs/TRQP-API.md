# TRQP v2 API Documentation

**Trust Registry Query Protocol (TRQP) v2 Implementation**

This document describes the TRQP v2 compliant endpoints implemented in the Trust Registry backend.

---

## Overview

TRQP is a lightweight, read-only protocol for querying trust registries. It answers two types of questions:

1. **Authorization Query**: "Is entity X authorized to perform action Y on resource Z?"
2. **Recognition Query**: "Does authority A recognize entity B as an authority?"

---

## Endpoints

### Authorization Query

**POST /v2/authorization**

Query if an entity is authorized to perform an action on a resource.

#### Request

```json
{
  "entity_id": "did:web:university.edu",
  "authority_id": "did:web:education-trust.org",
  "action": "issue",
  "resource": "UniversityDegree",
  "context": {
    "time": "2025-06-19T11:30:00Z"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `entity_id` | string | ✅ | DID of the entity |
| `authority_id` | string | ✅ | DID of the authority (ecosystem) |
| `action` | string | ✅ | Action to check ("issue", "verify") |
| `resource` | string | ✅ | Credential type |
| `context.time` | string | ❌ | ISO8601 datetime for validity check |

#### Response

```json
{
  "entity_id": "did:web:university.edu",
  "authority_id": "did:web:education-trust.org",
  "action": "issue",
  "resource": "UniversityDegree",
  "authorized": true,
  "time_evaluated": "2025-06-19T11:30:05Z",
  "message": "did:web:university.edu is authorized for issue+UniversityDegree"
}
```

---

### Recognition Query

**POST /v2/recognition**

Query if an authority recognizes another entity as an authority.

#### Request

```json
{
  "entity_id": "did:web:other-registry.org",
  "authority_id": "did:web:our-registry.org",
  "action": "govern",
  "resource": "professional-licenses"
}
```

#### Response

```json
{
  "entity_id": "did:web:other-registry.org",
  "authority_id": "did:web:our-registry.org",
  "action": "govern",
  "resource": "professional-licenses",
  "recognized": true,
  "time_evaluated": "2025-06-19T10:00:05Z",
  "message": "did:web:other-registry.org is recognized by did:web:our-registry.org"
}
```

---

## Recognition Management (Admin Only)

### Create Recognition

**POST /v2/recognitions**

```json
{
  "authorityRegistryId": "uuid",
  "entityId": "did:web:other-registry.org",
  "action": "govern",
  "resource": "professional-licenses",
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2026-01-01T00:00:00Z"
}
```

### List Recognitions

**GET /v2/recognitions?page=1&limit=10&authorityId=uuid**

### Get Recognition

**GET /v2/recognitions/:id**

### Delete Recognition

**DELETE /v2/recognitions/:id**

---

## Action Vocabulary

| Action | Description |
|--------|-------------|
| `issue` | Authorize to issue credentials |
| `verify` | Authorize to verify credentials |
| `recognize` | Recognize another authority |
| `govern` | Governance authority |
| `delegate` | Delegate authority |

---

## Error Responses

All errors follow RFC 7807 Problem Details format:

```json
{
  "type": "https://api.trustregistry.io/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "entity_id is required",
  "instance": "/v2/authorization"
}
```

---

## Headers

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Request correlation ID (auto-generated if not provided) |
| `X-API-Key` | API key for admin endpoints |

---

## TRQP Compliance

This implementation follows the ToIP Trust Registry Query Protocol v2 specification.

**Compliance Status:** ~90%

- ✅ Authorization Query
- ✅ Recognition Query
- ✅ RFC 7807 Error Format
- ✅ X-Request-ID Tracing
- ✅ Time-based Validity
