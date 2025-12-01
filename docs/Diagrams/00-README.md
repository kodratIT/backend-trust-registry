# Trust Registry Diagrams

Kumpulan diagram untuk memahami arsitektur dan flow Trust Registry.

## Daftar Diagram

| File | Konten |
|------|--------|
| [01-ecosystem-overview.md](./01-ecosystem-overview.md) | Hierarki, Federation, Trust Triangle, Delegation Chain |
| [02-credential-flow.md](./02-credential-flow.md) | Issuance Flow, Verification Flow, Cross-Border, Error Scenarios |

## Cara Melihat Diagram

Diagram menggunakan format **Mermaid**. Beberapa cara untuk melihat:

### 1. VS Code
Install extension:
- "Markdown Preview Mermaid Support"
- "Mermaid Markdown Syntax Highlighting"

Lalu tekan `Cmd+Shift+V` untuk preview.

### 2. GitHub
GitHub otomatis render Mermaid diagram saat view file.

### 3. Online Editor
Copy kode Mermaid ke [Mermaid Live Editor](https://mermaid.live/)

### 4. Obsidian
Obsidian memiliki native support untuk Mermaid.

## Quick Reference

### Entities

```
🛡️ Trust Framework  - Governance layer
🗄️ Registry         - Trust Registry
✅ Issuer           - Credential issuer
👤 Verifier         - Credential verifier
👤 Holder           - Credential holder
📄 Schema           - Credential schema
📜 Credential       - Verifiable Credential
💼 Wallet           - Digital wallet
🤝 Recognition      - Inter-registry trust
```

### Status Colors

```
🟢 Active     - Entity is operational
🟡 Pending    - Awaiting approval
🟠 Suspended  - Temporarily disabled
🔴 Revoked    - Permanently disabled
```

### TRQP Endpoints

```
POST /v2/authorization  - Check entity authorization
POST /v2/recognition    - Check inter-registry trust
GET  /v2/metadata       - Get registry metadata
```

## Export to Image

Untuk export diagram ke PNG/SVG:

1. Buka [Mermaid Live Editor](https://mermaid.live/)
2. Paste kode diagram
3. Klik "Export" → pilih format (PNG/SVG)
4. Download

## Kontribusi

Untuk menambah diagram baru:
1. Buat file `XX-nama-diagram.md`
2. Gunakan format Mermaid
3. Update README ini
