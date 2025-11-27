# Endpoint Reference

Dokumentasi detail setiap endpoint di Trust Registry API.

---

## 1. Health Check

### `GET /health`
Cek status server dan service availability.

**Auth:** Tidak perlu

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-27T10:00:00Z",
  "service": "ToIP Trust Registry v2",
  "version": "1.0.0"
}
```

---

## 2. API Keys

### `POST /v2/api-keys/bootstrap`
Buat admin API key pertama kali (hanya bisa sekali).

**Auth:** Tidak perlu (one-time setup)

**Body:**
```json
{
  "name": "Initial Admin",
  "secret": "bootstrap-secret-from-env"
}
```

### `POST /v2/api-keys`
Buat API key baru.

**Auth:** Admin

**Body:**
```json
{
  "name": "Registry Owner Key",
  "role": "registry_owner",
  "registryId": "uuid",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

### `GET /v2/api-keys`
List semua API keys.

**Auth:** Admin

### `DELETE /v2/api-keys/{id}`
Hapus/revoke API key.

**Auth:** Admin

---

## 3. Trust Frameworks

### Fungsi
Trust Framework adalah **governance document** yang mendefinisikan aturan ekosistem:
- Jurisdictions yang berlaku
- Legal agreements
- Credential types yang diizinkan
- Policies untuk issuers/verifiers

### `POST /v2/trust-frameworks`
Buat trust framework baru.

**Auth:** Admin

**Body:**
```json
{
  "name": "Education Trust Framework",
  "version": "1.0.0",
  "description": "Framework untuk kredensial pendidikan",
  "governanceFrameworkUrl": "https://example.com/governance.pdf",
  "legalAgreements": ["https://example.com/terms.pdf"],
  "jurisdictions": ["ID", "SG"],
  "contexts": ["https://w3id.org/education/v1"],
  "status": "active"
}
```

### `GET /v2/trust-frameworks`
List trust frameworks dengan pagination dan filter.

**Query params:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `status` - Filter by status (active/inactive/deprecated)

### `GET /v2/trust-frameworks/{id}`
Detail trust framework dengan related registries.

### `PUT /v2/trust-frameworks/{id}`
Update trust framework.

**Auth:** Admin

### `DELETE /v2/trust-frameworks/{id}`
Hapus trust framework (soft delete).

**Auth:** Admin

---

## 4. Trust Registries

### Fungsi
Trust Registry adalah **container** untuk issuers dan verifiers dalam satu ekosistem:
- Memiliki ecosystem DID sebagai identifier
- Terhubung ke Trust Framework
- Menyimpan daftar authorized entities

### `POST /v2/registries`
Buat registry baru.

**Auth:** Admin

**Body:**
```json
{
  "name": "Indonesia Education Registry",
  "description": "Registry untuk institusi pendidikan",
  "ecosystemDid": "did:web:education.go.id",
  "trustFrameworkId": "uuid",
  "governanceAuthority": "Kementerian Pendidikan",
  "status": "active"
}
```

### `GET /v2/registries`
List registries.

**Query params:**
- `page`, `limit` - Pagination
- `status` - Filter status
- `trustFrameworkId` - Filter by framework
- `ecosystemDid` - Search by DID

### `GET /v2/registries/{id}`
Detail registry dengan issuers, verifiers, schemas count.

### `PUT /v2/registries/{id}`
Update registry.

**Auth:** Admin atau Registry Owner

### `POST /v2/registries/verify-did`
Verify dan resolve DID.

**Body:**
```json
{
  "did": "did:web:example.com"
}
```

**Response:**
```json
{
  "did": "did:web:example.com",
  "valid": true,
  "method": "web",
  "didDocument": { ... }
}
```

### `PATCH /v2/registries/{id}/trust-framework`
Link registry ke trust framework.

**Auth:** Admin atau Registry Owner

### `DELETE /v2/registries/{id}/trust-framework`
Unlink dari trust framework.

**Auth:** Admin atau Registry Owner

---

## 5. Credential Schemas

### Fungsi
Credential Schema mendefinisikan **tipe credential** yang bisa di-issue/verify:
- JSON Schema untuk validasi
- Issuer mode (siapa boleh issue)
- Verifier mode (siapa boleh verify)

### Issuer/Verifier Modes

| Mode | Deskripsi |
|------|-----------|
| `OPEN` | Siapa saja boleh |
| `ECOSYSTEM` | Hanya yang terdaftar di registry |
| `GRANTOR` | Hanya yang explicitly di-grant |

### `POST /v2/schemas`
Buat credential schema.

**Auth:** Admin atau Registry Owner

**Body:**
```json
{
  "registryId": "uuid",
  "trustFrameworkId": "uuid",
  "name": "University Degree",
  "version": "1.0.0",
  "type": "UniversityDegree",
  "issuerMode": "ECOSYSTEM",
  "verifierMode": "OPEN",
  "contexts": ["https://w3id.org/education/v1"],
  "jurisdictions": ["ID"],
  "jsonSchema": {
    "type": "object",
    "required": ["degreeName", "institution"],
    "properties": {
      "degreeName": { "type": "string" },
      "institution": { "type": "string" },
      "graduationDate": { "type": "string", "format": "date" }
    }
  }
}
```

### `GET /v2/schemas`
List schemas.

**Query params:**
- `registryId` - Filter by registry
- `type` - Search by credential type

### `GET /v2/schemas/{id}`
Detail schema.

### `PUT /v2/schemas/{id}`
Update schema.

### `DELETE /v2/schemas/{id}`
Hapus schema.

---

## 6. Issuers

### Fungsi
Issuer adalah entity yang **menerbitkan credentials**:
- Identified by DID
- Terdaftar di registry
- Punya credential types yang boleh di-issue
- Status lifecycle (pending → active → suspended → revoked)

### `POST /v2/issuers`
Register issuer baru.

**Auth:** Admin atau Registry Owner

**Body:**
```json
{
  "did": "did:web:university.edu",
  "name": "Example University",
  "registryId": "uuid",
  "trustFrameworkId": "uuid",
  "status": "pending",
  "jurisdictions": [
    { "code": "ID", "name": "Indonesia" }
  ],
  "accreditationLevel": "high",
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2029-12-31T23:59:59Z",
  "endpoint": "https://university.edu/credentials",
  "credentialTypes": ["schema-uuid-1", "schema-uuid-2"]
}
```

### `GET /v2/issuers`
List issuers.

**Query params:**
- `registryId` - Filter by registry
- `status` - Filter by status
- `jurisdiction` - Filter by jurisdiction code
- `accreditationLevel` - Filter by level (high/medium/low)
- `did` - Search by DID

### `GET /v2/issuers/{did}`
Detail issuer (DID harus URL-encoded).

### `PUT /v2/issuers/{did}`
Update issuer info.

### `PATCH /v2/issuers/{did}/status`
Update status dengan validation.

**Body:**
```json
{
  "status": "active",
  "reason": "Accreditation verified",
  "statusDetails": {
    "verifiedBy": "admin@registry.org",
    "verificationDate": "2024-11-27"
  }
}
```

### `GET /v2/issuers/{did}/status-history`
Lihat history perubahan status.

### `POST /v2/issuers/{did}/credential-types`
Tambah credential type ke issuer.

**Body:**
```json
{
  "schemaId": "uuid"
}
```

### `DELETE /v2/issuers/{did}/credential-types/{schemaId}`
Hapus credential type dari issuer.

---

## 7. Verifiers

### Fungsi
Verifier adalah entity yang **memverifikasi credentials**:
- Sama seperti issuer tapi untuk verification
- Bisa punya credential types yang boleh di-verify

### Endpoints
Sama dengan Issuers, ganti `/issuers` dengan `/verifiers`.

---

## 8. Delegations

### Fungsi
Delegation memungkinkan issuer **mendelegasikan** wewenang ke issuer lain:
- Root issuer → Delegate issuer
- Dengan scope restrictions
- Cryptographic proof

### `POST /v2/issuers/{did}/delegate`
Buat delegation.

**Auth:** Admin atau Registry Owner

**Body:**
```json
{
  "delegateDid": "did:web:branch.university.edu",
  "scope": {
    "jurisdictions": ["ID-JK"],
    "credentialTypes": ["UniversityDegree"],
    "contexts": ["undergraduate"]
  },
  "delegationProof": {
    "type": "Ed25519Signature2020",
    "created": "2024-11-27T10:00:00Z",
    "proofValue": "..."
  },
  "validUntil": "2025-12-31T23:59:59Z"
}
```

### `GET /v2/issuers/{did}/delegates`
List delegates dari issuer.

### `GET /v2/issuers/{did}/delegation-chain`
Lihat full delegation chain (untuk verify delegated credentials).

### `DELETE /v2/issuers/{did}/delegates/{delegateDid}`
Revoke delegation.

---

## 9. TRQP Protocol

### Fungsi
TRQP (Trust Registry Query Protocol) adalah **public endpoints** untuk trust resolution:
- Tidak perlu authentication
- Mengikuti ToIP TRQP v2 specification
- Untuk verifier/wallet query authorization

### `POST /v2/authorization`
Query apakah entity authorized untuk action+resource.

**Auth:** Tidak perlu (public)

**Body:**
```json
{
  "entity_id": "did:web:university.edu",
  "authority_id": "did:web:education.go.id",
  "action": "issue",
  "resource": "UniversityDegree",
  "context": {
    "time": "2024-11-27T10:00:00Z"
  }
}
```

**Response (authorized):**
```json
{
  "entity_id": "did:web:university.edu",
  "authority_id": "did:web:education.go.id",
  "action": "issue",
  "resource": "UniversityDegree",
  "authorized": true,
  "time_evaluated": "2024-11-27T10:00:00Z",
  "message": "did:web:university.edu is authorized for issue+UniversityDegree"
}
```

**Response (not authorized):**
```json
{
  "entity_id": "did:web:unknown.edu",
  "authority_id": "did:web:education.go.id",
  "action": "issue",
  "resource": "UniversityDegree",
  "authorized": false,
  "time_evaluated": "2024-11-27T10:00:00Z",
  "message": "Entity 'did:web:unknown.edu' not found in registry"
}
```

### `POST /v2/recognition`
Query apakah authority mengakui entity lain sebagai authority.

**Auth:** Tidak perlu (public)

**Body:**
```json
{
  "entity_id": "did:web:other-registry.org",
  "authority_id": "did:web:our-registry.org",
  "action": "govern",
  "resource": "professional-licenses",
  "context": {
    "time": "2024-11-27T10:00:00Z"
  }
}
```

**Response:**
```json
{
  "entity_id": "did:web:other-registry.org",
  "authority_id": "did:web:our-registry.org",
  "action": "govern",
  "resource": "professional-licenses",
  "recognized": true,
  "time_evaluated": "2024-11-27T10:00:00Z",
  "message": "did:web:other-registry.org is recognized by did:web:our-registry.org"
}
```

---

## 10. Recognitions (Admin)

### Fungsi
Recognition adalah **trust relationship** antar registries:
- Untuk federation
- Authority A mengakui Authority B
- Dengan scope (action + resource)

### `POST /v2/recognitions`
Buat recognition relationship.

**Auth:** Admin

**Body:**
```json
{
  "authorityRegistryId": "uuid",
  "entityId": "did:web:other-registry.org",
  "action": "govern",
  "resource": "professional-licenses",
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2029-12-31T23:59:59Z",
  "metadata": {
    "agreementUrl": "https://example.com/mou.pdf"
  }
}
```

### `GET /v2/recognitions`
List recognitions.

**Query params:**
- `authorityId` - Filter by authority registry
- `entityId` - Filter by recognized entity
- `action` - Filter by action

### `GET /v2/recognitions/{id}`
Detail recognition.

### `DELETE /v2/recognitions/{id}`
Revoke recognition.

---

## 11. Query (Legacy)

### Fungsi
Legacy query endpoints untuk backward compatibility.

### `GET /v2/query/issuer/{did}`
Query issuer by DID.

### `GET /v2/query/verifier/{did}`
Query verifier by DID.

---

## 12. Audit Logs

### Fungsi
Audit log mencatat semua operasi untuk compliance:
- Siapa melakukan apa
- Kapan
- Hasilnya (success/failure)

### `GET /v2/audit-log`
Query audit logs.

**Auth:** Admin

**Query params:**
- `page`, `limit` - Pagination
- `actor` - Filter by actor
- `action` - Filter by action
- `resourceType` - Filter by resource type
- `result` - Filter by result (success/failure)
- `startDate`, `endDate` - Date range

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "actor": "admin@example.com",
      "action": "CREATE",
      "resourceType": "issuer",
      "resourceId": "uuid",
      "details": { "did": "did:web:university.edu" },
      "result": "success",
      "timestamp": "2024-11-27T10:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```
