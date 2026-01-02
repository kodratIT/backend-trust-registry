# API Key Management Scripts

## Create New API Key

Script untuk membuat API key baru tanpa menghapus data yang ada.

### Usage

```bash
# Create admin API key
npx ts-node scripts/create-api-key.ts admin "Production Admin Key"

# Create public API key
npx ts-node scripts/create-api-key.ts public "Production Public Key"

# Create registry owner API key
npx ts-node scripts/create-api-key.ts registry_owner "Registry Owner Key"
```

### Parameters

1. **Role** (required): `admin`, `registry_owner`, atau `public`
2. **Name** (optional): Nama deskriptif untuk API key

### Example Output

```
🔑 Creating admin API key...

✅ API Key created successfully!
═══════════════════════════════════════
ID:         abc123...
Name:       Production Admin Key
Role:       admin
Expires:    2027-01-02T00:00:00.000Z
API Key:    2de915aad6d34bf04192418a8031000ff801904b1008b53e08acf28311c599e0
═══════════════════════════════════════

⚠️  Save this key securely! It will not be shown again.
```

## Production Deployment

### SSH ke Production Server

```bash
ssh user@trust-registry-api.devlab.biz.id
cd /path/to/backend
```

### Generate New API Keys

```bash
# Admin key
npx ts-node scripts/create-api-key.ts admin "Production Admin Key 2026"

# Public key
npx ts-node scripts/create-api-key.ts public "Production Public Key 2026"
```

### Update Frontend .env

Setelah generate API keys baru, update `frontend/.env`:

```env
# Copy API keys dari output script di atas
```

## Revoke Old API Keys

Jika ingin revoke API key lama:

```bash
# Via API (butuh admin key yang valid)
curl -X DELETE https://trust-registry-api.devlab.biz.id/v2/api-keys/{key-id} \
  -H "X-API-Key: YOUR_ADMIN_KEY"

# Atau via database
npx prisma studio
# Lalu delete manual dari UI
```

## Security Notes

- ⚠️ **NEVER commit API keys** ke version control
- 🔒 Store API keys di environment variables atau secrets manager
- 🔄 Rotate API keys secara berkala (recommended: setiap 3-6 bulan)
- 📝 Set expiration date untuk semua API keys
- 🗑️ Revoke API keys yang tidak digunakan

## Troubleshooting

### "API key has expired"

Generate API key baru dengan script ini.

### "Unauthorized"

Pastikan:
1. API key benar (64 karakter hex)
2. Header `X-API-Key` digunakan
3. API key belum expired
4. Role sesuai dengan endpoint yang diakses

### "Database connection error"

Pastikan:
1. `DATABASE_URL` di `.env` benar
2. Database server berjalan
3. Network access ke database tersedia
