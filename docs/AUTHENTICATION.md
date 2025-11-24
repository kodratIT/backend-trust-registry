# Authentication & Authorization
## ToIP Trust Registry v2 Backend

This document explains how authentication and authorization work in the ToIP Trust Registry v2 system.

---

## 🔐 Overview

The system uses **API Key authentication** with **Role-Based Access Control (RBAC)** to secure endpoints.

**Authentication**: Verifies who you are (API key validation)  
**Authorization**: Verifies what you can do (role-based permissions)

---

## 🔑 API Keys

### Key Generation

API keys are generated using cryptographically secure random bytes:

```typescript
crypto.randomBytes(32).toString('hex')
// Generates: 64-character hexadecimal string
```

**Example**:
```
afe8c6f2051fe144809c93ab2df72a26eda9ba5ff35a41bff6984ce4b9de26ce
```

### Key Storage

- **Plaintext key**: Shown only once during creation
- **Hashed key**: Stored in database using bcrypt (cost 12)
- **Never stored**: Plaintext keys are never stored

### Key Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| `admin` | Full system access | System administrators |
| `registry_owner` | Registry-specific access | Registry operators |
| `public` | Read-only access | Public queries |

---

## 🔄 Authentication Flow

### Request Flow

```
1. Client sends request with X-API-Key header
   ↓
2. authenticate() middleware extracts key
   ↓
3. APIKeyModel.verify() validates key
   ↓
4. Check if key exists in database (compare hash)
   ↓
5. Check if key is expired
   ↓
6. Update lastUsedAt timestamp
   ↓
7. Attach user info to request
   ↓
8. Continue to authorization check
   ↓
9. authorize() middleware checks role
   ↓
10. Allow or deny access
```

### Sequence Diagram

```
┌────────┐         ┌────────┐         ┌──────────┐         ┌──────────┐
│ Client │         │  API   │         │   Auth   │         │ Database │
└───┬────┘         └───┬────┘         └────┬─────┘         └────┬─────┘
    │                  │                   │                    │
    │ GET /v2/issuers  │                   │                    │
    │ X-API-Key: xxx   │                   │                    │
    ├─────────────────>│                   │                    │
    │                  │                   │                    │
    │                  │ Extract API Key   │                    │
    │                  ├──────────────────>│                    │
    │                  │                   │                    │
    │                  │                   │ Query API Keys     │
    │                  │                   ├───────────────────>│
    │                  │                   │                    │
    │                  │                   │ Return Keys        │
    │                  │                   │<───────────────────┤
    │                  │                   │                    │
    │                  │                   │ Compare Hash       │
    │                  │                   │ Check Expiration   │
    │                  │                   │ Update lastUsedAt  │
    │                  │                   │                    │
    │                  │ User Info         │                    │
    │                  │<──────────────────┤                    │
    │                  │                   │                    │
    │                  │ Check Role        │                    │
    │                  │ (authorize)       │                    │
    │                  │                   │                    │
    │                  │ Process Request   │                    │
    │                  │                   │                    │
    │ 200 OK + Data    │                   │                    │
    │<─────────────────┤                   │                    │
    │                  │                   │                    │
```

---

## 🛡️ Using Authentication

### Making Authenticated Requests

**Header Format**:
```
X-API-Key: your-api-key-here
```

**Example with curl**:
```bash
curl -H "X-API-Key: afe8c6f2051fe144809c93ab2df72a26eda9ba5ff35a41bff6984ce4b9de26ce" \
  http://localhost:3000/v2/api-keys
```

**Example with JavaScript**:
```javascript
fetch('http://localhost:3000/v2/api-keys', {
  headers: {
    'X-API-Key': 'your-api-key-here'
  }
})
```

**Example with Python**:
```python
import requests

headers = {
    'X-API-Key': 'your-api-key-here'
}

response = requests.get('http://localhost:3000/v2/api-keys', headers=headers)
```

---

## 🎭 Role-Based Access Control (RBAC)

### Role Hierarchy

```
admin (Level 3)
  ↓
registry_owner (Level 2)
  ↓
public (Level 1)
```

Higher roles inherit permissions from lower roles.

### Role Permissions

#### Admin Role

**Permissions**:
- ✅ Create/update/delete trust frameworks
- ✅ Create/update/delete trust registries
- ✅ Manage all issuers and verifiers
- ✅ Manage API keys
- ✅ Access all registries
- ✅ View audit logs

**Endpoints**:
- All endpoints

#### Registry Owner Role

**Permissions**:
- ✅ Manage issuers in their registry
- ✅ Manage verifiers in their registry
- ✅ View their registry data
- ❌ Cannot access other registries
- ❌ Cannot manage API keys
- ❌ Cannot manage trust frameworks

**Endpoints**:
- POST /v2/issuers (their registry)
- PUT /v2/issuers/{did} (their registry)
- GET /v2/issuers (their registry)
- Similar for verifiers

#### Public Role

**Permissions**:
- ✅ Query trust registry
- ✅ Read trust frameworks
- ✅ Read registries
- ✅ Read issuers and verifiers
- ❌ No write operations
- ❌ No management operations

**Endpoints**:
- GET /v2/trust-frameworks
- GET /v2/registries
- GET /v2/issuers
- GET /v2/verifiers
- POST /v2/query

---

## 📝 API Key Management

### Creating API Keys

**Endpoint**: `POST /v2/api-keys`  
**Auth**: Admin only

**Request**:
```json
{
  "name": "My API Key",
  "role": "admin",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "message": "API key created successfully",
  "apiKey": {
    "id": "key-uuid",
    "name": "My API Key",
    "role": "admin",
    "key": "afe8c6f2051fe144809c93ab2df72a26eda9ba5ff35a41bff6984ce4b9de26ce",
    "createdAt": "2024-11-24T10:00:00Z",
    "expiresAt": "2025-12-31T23:59:59Z"
  },
  "warning": "Save this key securely. It will not be shown again."
}
```

⚠️ **Important**: Save the `key` value immediately. It will never be shown again!

### Listing API Keys

**Endpoint**: `GET /v2/api-keys`  
**Auth**: Admin only

**Query Parameters**:
- `role` (optional): Filter by role

**Example**:
```bash
curl -H "X-API-Key: admin-key" \
  http://localhost:3000/v2/api-keys?role=admin
```

**Response**:
```json
{
  "data": [
    {
      "id": "key-uuid",
      "name": "Admin Key",
      "role": "admin",
      "createdAt": "2024-11-24T10:00:00Z",
      "expiresAt": "2025-12-31T23:59:59Z",
      "lastUsedAt": "2024-11-24T12:00:00Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

### Revoking API Keys

**Endpoint**: `DELETE /v2/api-keys/:id`  
**Auth**: Admin only

**Example**:
```bash
curl -X DELETE \
  -H "X-API-Key: admin-key" \
  http://localhost:3000/v2/api-keys/key-uuid
```

**Response**:
```json
{
  "message": "API key revoked successfully",
  "data": {
    "id": "key-uuid",
    "name": "Admin Key"
  }
}
```

---

## 🚨 Error Responses

### 401 Unauthorized

**Causes**:
- No API key provided
- Invalid API key
- Expired API key

**Response**:
```json
{
  "error": "Unauthorized",
  "message": "API key is required. Please provide X-API-Key header."
}
```

### 403 Forbidden

**Causes**:
- Insufficient permissions
- Wrong role for endpoint
- Accessing other registry (registry_owner)

**Response**:
```json
{
  "error": "Forbidden",
  "message": "Access denied. Required role: admin. Your role: public"
}
```

---

## 🔒 Security Best Practices

### For API Key Holders

1. **Store Securely**:
   - Use environment variables
   - Never commit to version control
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)

2. **Rotate Regularly**:
   - Create new key
   - Update applications
   - Revoke old key

3. **Monitor Usage**:
   - Check lastUsedAt timestamps
   - Revoke unused keys
   - Set expiration dates

4. **Principle of Least Privilege**:
   - Use lowest role needed
   - Create registry-specific keys
   - Avoid admin keys when possible

### For Administrators

1. **Key Management**:
   - Regular audits of active keys
   - Revoke unused keys
   - Set expiration dates
   - Monitor for suspicious activity

2. **Access Control**:
   - Limit admin keys
   - Use registry_owner for delegation
   - Public keys for read-only access

3. **Monitoring**:
   - Track lastUsedAt
   - Alert on expired keys
   - Log all key operations

---

## 📊 Middleware Usage

### Protecting Endpoints

**Admin Only**:
```typescript
import { authenticate, requireAdmin } from '../middleware';

router.post('/admin-endpoint', authenticate, requireAdmin, handler);
```

**Registry Owner or Admin**:
```typescript
import { authenticate, requireRegistryOwner } from '../middleware';

router.post('/registry-endpoint', authenticate, requireRegistryOwner, handler);
```

**Multiple Roles**:
```typescript
import { authenticate, authorize } from '../middleware';

router.post('/endpoint', 
  authenticate, 
  authorize('admin', 'registry_owner'), 
  handler
);
```

**Registry-Specific Access**:
```typescript
import { authenticate, requireRegistryAccess } from '../middleware';

router.put('/registries/:id/issuers', 
  authenticate,
  requireRegistryAccess((req) => req.params.id),
  handler
);
```

**Public Access (Optional Auth)**:
```typescript
import { optionalAuthenticate } from '../middleware';

router.get('/public-endpoint', optionalAuthenticate, handler);
```

---

## 🧪 Testing Authentication

### Get Test API Keys

Run the seed script to generate test keys:

```bash
npx prisma db seed
```

You'll receive 3 keys:
- Admin key (full access)
- Registry owner key (registry-specific)
- Public key (read-only)

### Test Endpoints

**Test Admin Access**:
```bash
curl -H "X-API-Key: YOUR_ADMIN_KEY" \
  http://localhost:3000/v2/api-keys
```

**Test Public Access**:
```bash
curl -H "X-API-Key: YOUR_PUBLIC_KEY" \
  http://localhost:3000/v2/trust-frameworks
```

**Test Unauthorized**:
```bash
curl http://localhost:3000/v2/api-keys
# Should return 401
```

**Test Forbidden**:
```bash
curl -H "X-API-Key: YOUR_PUBLIC_KEY" \
  http://localhost:3000/v2/api-keys
# Should return 403
```

---

## 📚 Code Examples

### Creating an API Key

```typescript
import { APIKeyModel } from './models/APIKeyModel';

const apiKey = await APIKeyModel.create({
  name: 'Production API Key',
  role: 'registry_owner',
  registryId: 'registry-uuid',
  expiresAt: new Date('2025-12-31'),
});

console.log('API Key:', apiKey.key);
// Save this key! It won't be shown again
```

### Verifying an API Key

```typescript
const result = await APIKeyModel.verify(apiKey);

if (result.valid) {
  console.log('Valid key:', result.apiKey);
} else {
  console.log('Invalid:', result.reason);
}
```

### Using in Middleware

```typescript
import { authenticate, requireAdmin } from './middleware';

app.post('/admin-endpoint', 
  authenticate,    // Validates API key
  requireAdmin,    // Checks admin role
  async (req, res) => {
    // req.user is available here
    console.log('User role:', req.user.role);
  }
);
```

---

## 🔍 Troubleshooting

### "API key is required"

**Problem**: No X-API-Key header provided

**Solution**:
```bash
curl -H "X-API-Key: your-key-here" http://localhost:3000/endpoint
```

### "Invalid API key"

**Problem**: Key doesn't exist or is incorrect

**Solution**:
- Verify key is correct
- Check if key was revoked
- Generate new key if needed

### "API key has expired"

**Problem**: Key expiration date has passed

**Solution**:
- Create new API key
- Update application with new key
- Revoke old key

### "Access denied"

**Problem**: Insufficient permissions for endpoint

**Solution**:
- Check required role for endpoint
- Use key with appropriate role
- Contact admin for role upgrade

---

## 📖 API Reference

### POST /v2/api-keys

Create a new API key.

**Auth**: Admin only  
**Body**:
```json
{
  "name": "string (required)",
  "role": "admin | registry_owner | public (required)",
  "registryId": "string (required for registry_owner)",
  "expiresAt": "ISO 8601 date (optional)"
}
```

### GET /v2/api-keys

List all API keys.

**Auth**: Admin only  
**Query**: `?role=admin` (optional)

### GET /v2/api-keys/:id

Get API key by ID.

**Auth**: Admin only

### DELETE /v2/api-keys/:id

Revoke an API key.

**Auth**: Admin only

---

## 🎯 Best Practices

### Development

1. Use seed script to generate test keys
2. Store keys in `.env` file (never commit!)
3. Use different keys for different environments
4. Test with all role types

### Production

1. Generate production keys separately
2. Store in secrets management system
3. Set expiration dates (e.g., 1 year)
4. Rotate keys regularly
5. Monitor usage via lastUsedAt
6. Revoke unused keys
7. Use registry_owner keys for delegation
8. Limit admin keys to minimum necessary

### Security

1. Never log API keys
2. Never commit keys to version control
3. Use HTTPS in production
4. Implement rate limiting
5. Monitor for suspicious activity
6. Revoke compromised keys immediately

---

## 📚 Additional Resources

- [API Key Model Source](../src/models/APIKeyModel.ts)
- [Authentication Middleware](../src/middleware/authenticate.ts)
- [Authorization Middleware](../src/middleware/authorize.ts)
- [API Key Controller](../src/controllers/apiKeyController.ts)

---

**Last Updated**: November 24, 2024  
**Version**: 1.0
