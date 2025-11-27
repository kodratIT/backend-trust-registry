# ToIP Trust Registry v2 - API Guide

Panduan lengkap penggunaan API Trust Registry sesuai spesifikasi TRQP v2.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Flow Penggunaan](#flow-penggunaan)
3. [Endpoint Reference](#endpoint-reference)
4. [Contoh Penggunaan](#contoh-penggunaan)

---

## Overview

Trust Registry API menyediakan:
- **Management API** - CRUD untuk trust frameworks, registries, issuers, verifiers
- **TRQP Protocol** - Authorization & Recognition queries (public)
- **Admin API** - API keys, audit logs, recognitions

### Authentication

| Role | Header | Access |
|------|--------|--------|
| `admin` | `X-API-Key: <key>` | Full access |
| `registry_owner` | `X-API-Key: <key>` | Manage own registry |
| `public` | - | Read-only + TRQP queries |

---

## Flow Penggunaan

### 🚀 Setup Awal (Urutan Wajib)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Create API Key (Bootstrap)                             │
│  POST /v2/api-keys/bootstrap                                    │
│  → Dapat admin API key untuk setup selanjutnya                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Create Trust Framework                                 │
│  POST /v2/trust-frameworks                                      │
│  → Definisikan governance framework untuk ecosystem             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Create Trust Registry                                  │
│  POST /v2/registries                                            │
│  → Buat registry dengan ecosystem DID                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Create Credential Schemas                              │
│  POST /v2/schemas                                               │
│  → Definisikan credential types yang didukung                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Register Issuers                                       │
│  POST /v2/issuers                                               │
│  → Daftarkan issuer dengan DID dan credential types             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Register Verifiers                                     │
│  POST /v2/verifiers                                             │
│  → Daftarkan verifier dengan DID dan credential types           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: Activate Entities                                      │
│  PATCH /v2/issuers/{did}/status                                 │
│  PATCH /v2/verifiers/{did}/status                               │
│  → Ubah status dari 'pending' ke 'active'                       │
└─────────────────────────────────────────────────────────────────┘
```

### 🔍 Query Flow (Setelah Setup)

```
┌─────────────────────────────────────────────────────────────────┐
│  TRQP Authorization Query                                       │
│  POST /v2/authorization                                         │
│  → "Apakah entity X boleh issue/verify credential Y?"           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TRQP Recognition Query                                         │
│  POST /v2/recognition                                           │
│  → "Apakah registry A mengakui registry B?"                     │
└─────────────────────────────────────────────────────────────────┘
```

### 🌐 Federation Flow (Optional)

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: Create Recognition (Admin)                             │
│  POST /v2/recognitions                                          │
│  → Buat trust relationship dengan registry lain                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Endpoint Reference

### 1. Health Check
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/health` | - | Cek status server |

### 2. API Keys (Admin)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/api-keys/bootstrap` | - | Buat admin key pertama |
| POST | `/v2/api-keys` | Admin | Buat API key baru |
| GET | `/v2/api-keys` | Admin | List semua API keys |
| DELETE | `/v2/api-keys/{id}` | Admin | Hapus API key |

### 3. Trust Frameworks
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/trust-frameworks` | Admin | Buat trust framework |
| GET | `/v2/trust-frameworks` | - | List trust frameworks |
| GET | `/v2/trust-frameworks/{id}` | - | Detail trust framework |
| PUT | `/v2/trust-frameworks/{id}` | Admin | Update trust framework |
| DELETE | `/v2/trust-frameworks/{id}` | Admin | Hapus trust framework |

### 4. Trust Registries
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/registries` | Admin | Buat registry baru |
| GET | `/v2/registries` | - | List registries |
| GET | `/v2/registries/{id}` | - | Detail registry |
| PUT | `/v2/registries/{id}` | Admin/Owner | Update registry |
| POST | `/v2/registries/verify-did` | - | Verify/resolve DID |
| PATCH | `/v2/registries/{id}/trust-framework` | Admin/Owner | Link ke trust framework |
| DELETE | `/v2/registries/{id}/trust-framework` | Admin/Owner | Unlink trust framework |

### 5. Credential Schemas
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/schemas` | Admin/Owner | Buat credential schema |
| GET | `/v2/schemas` | - | List schemas |
| GET | `/v2/schemas/{id}` | - | Detail schema |
| PUT | `/v2/schemas/{id}` | Admin/Owner | Update schema |
| DELETE | `/v2/schemas/{id}` | Admin/Owner | Hapus schema |

### 6. Issuers
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/issuers` | Admin/Owner | Register issuer |
| GET | `/v2/issuers` | - | List issuers |
| GET | `/v2/issuers/{did}` | - | Detail issuer |
| PUT | `/v2/issuers/{did}` | Admin/Owner | Update issuer |
| PATCH | `/v2/issuers/{did}/status` | Admin/Owner | Update status |
| GET | `/v2/issuers/{did}/status-history` | - | Status history |
| POST | `/v2/issuers/{did}/credential-types` | Admin/Owner | Add credential type |
| DELETE | `/v2/issuers/{did}/credential-types/{schemaId}` | Admin/Owner | Remove credential type |

### 7. Verifiers
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/verifiers` | Admin/Owner | Register verifier |
| GET | `/v2/verifiers` | - | List verifiers |
| GET | `/v2/verifiers/{did}` | - | Detail verifier |
| PUT | `/v2/verifiers/{did}` | Admin/Owner | Update verifier |
| PATCH | `/v2/verifiers/{did}/status` | Admin/Owner | Update status |
| GET | `/v2/verifiers/{did}/status-history` | - | Status history |
| POST | `/v2/verifiers/{did}/credential-types` | Admin/Owner | Add credential type |
| DELETE | `/v2/verifiers/{did}/credential-types/{schemaId}` | Admin/Owner | Remove credential type |

### 8. Delegations
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/issuers/{did}/delegate` | Admin/Owner | Create delegation |
| GET | `/v2/issuers/{did}/delegates` | - | List delegates |
| GET | `/v2/issuers/{did}/delegation-chain` | - | Get delegation chain |
| DELETE | `/v2/issuers/{did}/delegates/{delegateDid}` | Admin/Owner | Revoke delegation |

### 9. TRQP Protocol (Public)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/authorization` | - | Authorization query |
| POST | `/v2/recognition` | - | Recognition query |

### 10. Recognitions (Admin)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/v2/recognitions` | Admin | Create recognition |
| GET | `/v2/recognitions` | Admin | List recognitions |
| GET | `/v2/recognitions/{id}` | Admin | Detail recognition |
| DELETE | `/v2/recognitions/{id}` | Admin | Revoke recognition |

### 11. Query (Legacy)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/v2/query/issuer/{did}` | - | Query issuer |
| GET | `/v2/query/verifier/{did}` | - | Query verifier |

### 12. Audit Logs (Admin)
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/v2/audit-log` | Admin | Query audit logs |

---

## Contoh Penggunaan

### Step 1: Bootstrap Admin Key

```bash
curl -X POST http://localhost:3000/v2/api-keys/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Initial Admin Key",
    "secret": "your-bootstrap-secret"
  }'
```

Response:
```json
{
  "message": "Admin API key created",
  "data": {
    "id": "uuid",
    "name": "Initial Admin Key",
    "key": "tr_xxxxxxxxxxxxxxxx",
    "role": "admin"
  }
}
```

> ⚠️ Simpan `key` ini! Tidak bisa dilihat lagi.

---

### Step 2: Create Trust Framework

```bash
curl -X POST http://localhost:3000/v2/trust-frameworks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tr_xxxxxxxxxxxxxxxx" \
  -d '{
    "name": "Indonesia Education Trust Framework",
    "version": "1.0.0",
    "description": "Governance framework untuk kredensial pendidikan Indonesia",
    "governanceFrameworkUrl": "https://dikti.go.id/governance",
    "jurisdictions": ["ID"],
    "status": "active"
  }'
```

---

### Step 3: Create Trust Registry

```bash
curl -X POST http://localhost:3000/v2/registries \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tr_xxxxxxxxxxxxxxxx" \
  -d '{
    "name": "Indonesia Education Registry",
    "description": "Trust registry untuk institusi pendidikan Indonesia",
    "ecosystemDid": "did:web:education.go.id",
    "trustFrameworkId": "<trust-framework-id>",
    "status": "active"
  }'
```

---

### Step 4: Create Credential Schema

```bash
curl -X POST http://localhost:3000/v2/schemas \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tr_xxxxxxxxxxxxxxxx" \
  -d '{
    "registryId": "<registry-id>",
    "name": "University Degree",
    "version": "1.0.0",
    "type": "UniversityDegree",
    "issuerMode": "ECOSYSTEM",
    "verifierMode": "OPEN",
    "jsonSchema": {
      "type": "object",
      "properties": {
        "degreeName": { "type": "string" },
        "graduationDate": { "type": "string", "format": "date" }
      }
    }
  }'
```

---

### Step 5: Register Issuer

```bash
curl -X POST http://localhost:3000/v2/issuers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tr_xxxxxxxxxxxxxxxx" \
  -d '{
    "did": "did:web:ui.ac.id",
    "name": "Universitas Indonesia",
    "registryId": "<registry-id>",
    "status": "pending",
    "accreditationLevel": "high",
    "credentialTypes": ["<schema-id>"]
  }'
```

---

### Step 6: Activate Issuer

```bash
curl -X PATCH http://localhost:3000/v2/issuers/did:web:ui.ac.id/status \
  -H "Content-Type: application/json" \
  -H "X-API-Key: tr_xxxxxxxxxxxxxxxx" \
  -d '{
    "status": "active",
    "reason": "Accreditation verified"
  }'
```

---

### Step 7: TRQP Authorization Query

```bash
curl -X POST http://localhost:3000/v2/authorization \
  -H "Content-Type: application/json" \
  -d '{
    "entity_id": "did:web:ui.ac.id",
    "authority_id": "did:web:education.go.id",
    "action": "issue",
    "resource": "UniversityDegree"
  }'
```

Response (authorized):
```json
{
  "entity_id": "did:web:ui.ac.id",
  "authority_id": "did:web:education.go.id",
  "action": "issue",
  "resource": "UniversityDegree",
  "authorized": true,
  "time_evaluated": "2024-11-27T10:00:00Z",
  "message": "did:web:ui.ac.id is authorized for issue+UniversityDegree by did:web:education.go.id"
}
```

---

## Status Lifecycle

### Issuer/Verifier Status Flow

```
┌──────────┐     activate      ┌──────────┐
│ pending  │ ─────────────────▶│  active  │
└──────────┘                   └──────────┘
                                    │
                    suspend         │ reactivate
                    ┌───────────────┼───────────────┐
                    ▼               │               │
              ┌───────────┐        │               │
              │ suspended │ ◀──────┘               │
              └───────────┘                        │
                    │                              │
                    │ revoke                       │
                    ▼                              │
              ┌───────────┐                        │
              │  revoked  │ ◀──────────────────────┘
              └───────────┘        revoke
```

| Transition | Allowed |
|------------|---------|
| pending → active | ✅ |
| pending → revoked | ✅ |
| active → suspended | ✅ |
| active → revoked | ✅ |
| suspended → active | ✅ |
| suspended → revoked | ✅ |
| revoked → * | ❌ (final) |

---

## Error Responses

Semua error mengikuti RFC 7807 Problem Details:

```json
{
  "type": "https://api.trustregistry.io/problems/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "entity_id: must be a non-empty string",
  "instance": "/v2/authorization"
}
```

| Status | Type | Deskripsi |
|--------|------|-----------|
| 400 | validation-error | Request tidak valid |
| 401 | unauthorized | API key tidak valid |
| 403 | forbidden | Tidak punya akses |
| 404 | not-found | Resource tidak ditemukan |
| 409 | conflict | Resource sudah ada |
| 500 | internal-error | Server error |
