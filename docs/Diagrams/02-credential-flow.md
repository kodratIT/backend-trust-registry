# Credential Issuance & Verification Flow

## 1. Complete Credential Lifecycle

```mermaid
sequenceDiagram
    autonumber
    
    participant H as 👤 Holder<br/>(Citizen)
    participant W as 💼 Wallet<br/>(Mobile App)
    participant I as ✅ Issuer<br/>(University)
    participant TR as 🗄️ Trust Registry
    participant V as 👤 Verifier<br/>(Employer)

    rect rgb(230, 245, 255)
        Note over H,TR: Phase 1: Credential Request & Issuance
        
        H->>W: Open wallet app
        W->>I: Request credential<br/>(with identity proof)
        
        I->>TR: Query: Can I issue this credential?
        Note right of TR: POST /v2/authorization<br/>{<br/>  entity_id: "did:web:university.edu",<br/>  authority_id: "did:web:edu-registry.id",<br/>  action: "issue",<br/>  resource: "UniversityDegree"<br/>}
        
        TR-->>I: ✅ { authorized: true }
        
        I->>I: Create & Sign Credential
        I-->>W: Issue Verifiable Credential
        W->>W: Store credential
        W-->>H: ✅ Credential received!
    end

    rect rgb(255, 245, 230)
        Note over H,V: Phase 2: Credential Presentation & Verification
        
        H->>W: Select credential to share
        W->>V: Present Verifiable Credential
        
        V->>V: Verify signature
        
        V->>TR: Query: Is issuer authorized?
        Note right of TR: POST /v2/authorization<br/>{<br/>  entity_id: "did:web:university.edu",<br/>  authority_id: "did:web:edu-registry.id",<br/>  action: "issue",<br/>  resource: "UniversityDegree"<br/>}
        
        TR-->>V: ✅ { authorized: true }
        
        V->>TR: Query: Can I verify this?
        Note right of TR: POST /v2/authorization<br/>{<br/>  entity_id: "did:web:employer.com",<br/>  authority_id: "did:web:edu-registry.id",<br/>  action: "verify",<br/>  resource: "UniversityDegree"<br/>}
        
        TR-->>V: ✅ { authorized: true }
        
        V-->>H: ✅ Credential Accepted!
    end
```

---

## 2. Trust Registry Query Decision Tree

```mermaid
flowchart TB
    START([🔍 Authorization Query]) --> CHECK_REGISTRY{Registry exists?}
    
    CHECK_REGISTRY -->|No| FAIL1[❌ Not Authorized<br/>Registry not found]
    CHECK_REGISTRY -->|Yes| CHECK_REGISTRY_STATUS{Registry active?}
    
    CHECK_REGISTRY_STATUS -->|No| FAIL2[❌ Not Authorized<br/>Registry not active]
    CHECK_REGISTRY_STATUS -->|Yes| CHECK_ENTITY{Entity exists<br/>in registry?}
    
    CHECK_ENTITY -->|No| CHECK_DELEGATION{Check delegation<br/>chain?}
    CHECK_ENTITY -->|Yes| CHECK_ENTITY_STATUS{Entity active?}
    
    CHECK_DELEGATION -->|No delegate| FAIL3[❌ Not Authorized<br/>Entity not found]
    CHECK_DELEGATION -->|Has delegate| CHECK_DELEGATE_STATUS{Delegate active?}
    
    CHECK_DELEGATE_STATUS -->|No| FAIL4[❌ Not Authorized<br/>Delegate not active]
    CHECK_DELEGATE_STATUS -->|Yes| CHECK_DELEGATE_VALIDITY
    
    CHECK_ENTITY_STATUS -->|No| FAIL5[❌ Not Authorized<br/>Entity not active]
    CHECK_ENTITY_STATUS -->|Yes| CHECK_VALIDITY{Within validity<br/>period?}
    
    CHECK_VALIDITY -->|No| FAIL6[❌ Not Authorized<br/>Outside validity period]
    CHECK_VALIDITY -->|Yes| CHECK_SCHEMA{Has credential<br/>schema?}
    
    CHECK_DELEGATE_VALIDITY{Delegation valid?} -->|No| FAIL7[❌ Not Authorized<br/>Delegation expired]
    CHECK_DELEGATE_VALIDITY -->|Yes| CHECK_SCHEMA
    
    CHECK_SCHEMA -->|No| FAIL8[❌ Not Authorized<br/>Schema not assigned]
    CHECK_SCHEMA -->|Yes| SUCCESS[✅ Authorized]

    style START fill:#3b82f6,color:#fff
    style SUCCESS fill:#10b981,color:#fff
    style FAIL1 fill:#ef4444,color:#fff
    style FAIL2 fill:#ef4444,color:#fff
    style FAIL3 fill:#ef4444,color:#fff
    style FAIL4 fill:#ef4444,color:#fff
    style FAIL5 fill:#ef4444,color:#fff
    style FAIL6 fill:#ef4444,color:#fff
    style FAIL7 fill:#ef4444,color:#fff
    style FAIL8 fill:#ef4444,color:#fff
```

---

## 3. Cross-Border Credential Verification

```mermaid
sequenceDiagram
    participant H as 👤 Indonesian Citizen
    participant V_SG as 👤 Singapore Employer
    participant TR_SG as 🗄️ Singapore Registry
    participant TR_ID as 🗄️ Indonesia Registry
    participant I_ID as ✅ Indonesian University

    Note over H,I_ID: Scenario: Indonesian graduate applying for job in Singapore

    H->>V_SG: Present Indonesian degree credential
    
    V_SG->>TR_SG: Is Indonesian issuer recognized?
    Note right of TR_SG: POST /v2/recognition<br/>{<br/>  entity_id: "did:web:registry.id",<br/>  authority_id: "did:web:registry.sg",<br/>  action: "recognize",<br/>  resource: "academic-credentials"<br/>}
    
    TR_SG-->>V_SG: ✅ { recognized: true }
    
    V_SG->>TR_ID: Is issuer authorized in Indonesia?
    Note right of TR_ID: POST /v2/authorization<br/>{<br/>  entity_id: "did:web:university.id",<br/>  authority_id: "did:web:registry.id",<br/>  action: "issue",<br/>  resource: "UniversityDegree"<br/>}
    
    TR_ID-->>V_SG: ✅ { authorized: true }
    
    V_SG->>V_SG: Verify credential signature
    V_SG-->>H: ✅ Credential Accepted!
    
    Note over H,I_ID: Cross-border trust established through<br/>inter-registry recognition
```

---

## 4. Delegation Verification Flow

```mermaid
sequenceDiagram
    participant V as 👤 Verifier
    participant TR as 🗄️ Trust Registry
    participant DB as 🗃️ Database

    V->>TR: Check authorization for<br/>did:web:branch-campus.edu

    TR->>DB: Find issuer by DID
    DB-->>TR: Not found as direct issuer

    TR->>DB: Check delegation chain
    DB-->>TR: Found delegation:<br/>Root: did:web:main-university.edu<br/>Delegate: did:web:branch-campus.edu

    TR->>DB: Verify root issuer status
    DB-->>TR: Root issuer: ACTIVE

    TR->>DB: Verify delegation status
    DB-->>TR: Delegation: ACTIVE<br/>Valid until: 2025-12-31

    TR->>DB: Check root issuer has schema
    DB-->>TR: Schema: UniversityDegree ✅

    TR-->>V: ✅ { authorized: true }<br/>via delegation chain

    Note over V,DB: Delegate inherits authorization<br/>from root issuer through delegation
```

---

## 5. Real-World Example: Job Application

```mermaid
graph TB
    subgraph "Step 1: Education"
        UNI[🏫 University ABC]
        STUDENT[👤 Student]
        DEGREE[📜 Degree Credential]
        
        UNI -->|"graduates"| STUDENT
        UNI -->|"issues"| DEGREE
        DEGREE -->|"stored in"| WALLET[💼 Wallet]
    end

    subgraph "Step 2: Job Application"
        WALLET -->|"presents"| EMPLOYER[🏢 Employer XYZ]
    end

    subgraph "Step 3: Verification"
        EMPLOYER -->|"1. Verify signature"| CHECK1{Valid?}
        CHECK1 -->|Yes| QUERY1[Query Trust Registry]
        
        QUERY1 -->|"2. Is issuer authorized?"| TR[🗄️ Trust Registry]
        TR -->|"✅ Yes"| QUERY2[Continue]
        
        QUERY2 -->|"3. Am I authorized to verify?"| TR
        TR -->|"✅ Yes"| ACCEPT[✅ Accept Credential]
    end

    subgraph "Step 4: Outcome"
        ACCEPT -->|"Credential trusted"| HIRE[🎉 Hire Candidate]
    end

    style UNI fill:#10b981,color:#fff
    style EMPLOYER fill:#f59e0b,color:#fff
    style TR fill:#3b82f6,color:#fff
    style HIRE fill:#8b5cf6,color:#fff
```

---

## 6. Error Scenarios

```mermaid
flowchart LR
    subgraph "Scenario 1: Revoked Issuer"
        Q1[Query] --> R1[Registry]
        R1 --> I1[Issuer: REVOKED]
        I1 --> E1[❌ Not Authorized<br/>Issuer has been revoked]
    end

    subgraph "Scenario 2: Expired Validity"
        Q2[Query] --> R2[Registry]
        R2 --> I2[Issuer: ACTIVE]
        I2 --> V2[Valid Until: 2023-12-31]
        V2 --> E2[❌ Not Authorized<br/>Validity period expired]
    end

    subgraph "Scenario 3: Wrong Schema"
        Q3[Query] --> R3[Registry]
        R3 --> I3[Issuer: ACTIVE]
        I3 --> S3[Schemas: DriverLicense]
        S3 --> E3[❌ Not Authorized<br/>Not authorized for<br/>UniversityDegree]
    end

    subgraph "Scenario 4: Revoked Delegation"
        Q4[Query] --> R4[Registry]
        R4 --> D4[Delegation: REVOKED]
        D4 --> E4[❌ Not Authorized<br/>Delegation has been revoked]
    end

    style E1 fill:#ef4444,color:#fff
    style E2 fill:#ef4444,color:#fff
    style E3 fill:#ef4444,color:#fff
    style E4 fill:#ef4444,color:#fff
```

---

## Summary Table

| Step | Actor | Action | Trust Registry Query |
|------|-------|--------|---------------------|
| 1 | Issuer | Issue credential | `POST /v2/authorization` (action: issue) |
| 2 | Holder | Store credential | - (no query needed) |
| 3 | Holder | Present credential | - (no query needed) |
| 4 | Verifier | Verify issuer | `POST /v2/authorization` (action: issue) |
| 5 | Verifier | Check own authorization | `POST /v2/authorization` (action: verify) |
| 6 | Verifier | Cross-border check | `POST /v2/recognition` |
