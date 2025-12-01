# Metadata Endpoint - Client Examples

Examples of using the `/v2/metadata` endpoint for service discovery and auto-configuration.

## Table of Contents

- [JavaScript/TypeScript](#javascripttypescript)
- [Python](#python)
- [Java](#java)
- [Go](#go)
- [Rust](#rust)
- [cURL](#curl)

---

## JavaScript/TypeScript

### Basic Usage

```typescript
interface RegistryMetadata {
  name: string;
  version: string;
  protocol: string;
  endpoints: {
    authorization: string;
    recognition: string;
    metadata: string;
    public: Record<string, string>;
  };
  supportedActions: string[];
  supportedDIDMethods: string[];
  features: Record<string, boolean>;
  status: string;
}

async function getRegistryMetadata(registryUrl: string): Promise<RegistryMetadata> {
  const response = await fetch(`${registryUrl}/v2/metadata`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch metadata: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage
const metadata = await getRegistryMetadata('https://trust-registry.example.com');
console.log(`Connected to: ${metadata.name} v${metadata.version}`);
console.log(`Protocol: ${metadata.protocol}`);
```

### Auto-Configuration Client

```typescript
class TrustRegistryClient {
  private baseUrl: string;
  private metadata: RegistryMetadata | null = null;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }
  
  async initialize(): Promise<void> {
    this.metadata = await fetch(`${this.baseUrl}/v2/metadata`)
      .then(r => r.json());
    
    console.log(`✅ Connected to ${this.metadata.name}`);
    console.log(`   Version: ${this.metadata.version}`);
    console.log(`   Protocol: ${this.metadata.protocol}`);
    console.log(`   Features: ${Object.keys(this.metadata.features).filter(k => this.metadata!.features[k]).join(', ')}`);
  }
  
  async checkAuthorization(
    entityDid: string,
    authorityDid: string,
    action: string,
    resource: string
  ): Promise<boolean> {
    if (!this.metadata) {
      throw new Error('Client not initialized. Call initialize() first.');
    }
    
    if (!this.metadata.features.authorization) {
      throw new Error('Registry does not support authorization queries');
    }
    
    if (!this.metadata.supportedActions.includes(action)) {
      throw new Error(`Action '${action}' not supported by registry`);
    }
    
    const endpoint = `${this.baseUrl}${this.metadata.endpoints.authorization}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_id: entityDid,
        authority_id: authorityDid,
        action,
        resource,
      }),
    });
    
    const result = await response.json();
    return result.authorized;
  }
  
  supportsAction(action: string): boolean {
    return this.metadata?.supportedActions.includes(action) ?? false;
  }
  
  supportsDIDMethod(method: string): boolean {
    return this.metadata?.supportedDIDMethods.includes(method) ?? false;
  }
  
  hasFeature(feature: string): boolean {
    return this.metadata?.features[feature] ?? false;
  }
}

// Usage
const client = new TrustRegistryClient('https://trust-registry.example.com');
await client.initialize();

if (client.supportsAction('issue')) {
  const authorized = await client.checkAuthorization(
    'did:web:university.edu',
    'did:web:edu-registry.org',
    'issue',
    'UniversityDegree'
  );
  console.log(`Authorized: ${authorized}`);
}
```

---

## Python

### Basic Usage

```python
import requests
from typing import Dict, List, Any

class RegistryMetadata:
    def __init__(self, data: Dict[str, Any]):
        self.name = data['name']
        self.version = data['version']
        self.protocol = data['protocol']
        self.endpoints = data['endpoints']
        self.supported_actions = data['supportedActions']
        self.supported_did_methods = data['supportedDIDMethods']
        self.features = data['features']
        self.status = data['status']

def get_registry_metadata(registry_url: str) -> RegistryMetadata:
    """Fetch registry metadata."""
    response = requests.get(f"{registry_url}/v2/metadata")
    response.raise_for_status()
    return RegistryMetadata(response.json())

# Usage
metadata = get_registry_metadata('https://trust-registry.example.com')
print(f"Connected to: {metadata.name} v{metadata.version}")
print(f"Protocol: {metadata.protocol}")
```

### Auto-Configuration Client

```python
class TrustRegistryClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.metadata = None
    
    def initialize(self):
        """Initialize client by fetching metadata."""
        response = requests.get(f"{self.base_url}/v2/metadata")
        response.raise_for_status()
        self.metadata = RegistryMetadata(response.json())
        
        print(f"✅ Connected to {self.metadata.name}")
        print(f"   Version: {self.metadata.version}")
        print(f"   Protocol: {self.metadata.protocol}")
        
        enabled_features = [k for k, v in self.metadata.features.items() if v]
        print(f"   Features: {', '.join(enabled_features)}")
    
    def check_authorization(
        self,
        entity_did: str,
        authority_did: str,
        action: str,
        resource: str
    ) -> bool:
        """Check if entity is authorized."""
        if not self.metadata:
            raise RuntimeError("Client not initialized. Call initialize() first.")
        
        if not self.metadata.features.get('authorization'):
            raise RuntimeError("Registry does not support authorization queries")
        
        if action not in self.metadata.supported_actions:
            raise ValueError(f"Action '{action}' not supported by registry")
        
        endpoint = f"{self.base_url}{self.metadata.endpoints['authorization']}"
        response = requests.post(endpoint, json={
            'entity_id': entity_did,
            'authority_id': authority_did,
            'action': action,
            'resource': resource,
        })
        response.raise_for_status()
        
        result = response.json()
        return result['authorized']
    
    def supports_action(self, action: str) -> bool:
        """Check if action is supported."""
        return action in (self.metadata.supported_actions if self.metadata else [])
    
    def supports_did_method(self, method: str) -> bool:
        """Check if DID method is supported."""
        return method in (self.metadata.supported_did_methods if self.metadata else [])
    
    def has_feature(self, feature: str) -> bool:
        """Check if feature is enabled."""
        return self.metadata.features.get(feature, False) if self.metadata else False

# Usage
client = TrustRegistryClient('https://trust-registry.example.com')
client.initialize()

if client.supports_action('issue'):
    authorized = client.check_authorization(
        'did:web:university.edu',
        'did:web:edu-registry.org',
        'issue',
        'UniversityDegree'
    )
    print(f"Authorized: {authorized}")
```

---

## Java

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

public class TrustRegistryClient {
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private RegistryMetadata metadata;
    
    public TrustRegistryClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    public void initialize() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(baseUrl + "/v2/metadata"))
            .GET()
            .build();
        
        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );
        
        this.metadata = objectMapper.readValue(
            response.body(),
            RegistryMetadata.class
        );
        
        System.out.println("✅ Connected to " + metadata.getName());
        System.out.println("   Version: " + metadata.getVersion());
        System.out.println("   Protocol: " + metadata.getProtocol());
    }
    
    public boolean checkAuthorization(
        String entityDid,
        String authorityDid,
        String action,
        String resource
    ) throws Exception {
        if (metadata == null) {
            throw new IllegalStateException("Client not initialized");
        }
        
        if (!metadata.getFeatures().get("authorization")) {
            throw new UnsupportedOperationException(
                "Registry does not support authorization queries"
            );
        }
        
        String endpoint = baseUrl + metadata.getEndpoints().get("authorization");
        
        Map<String, String> requestBody = Map.of(
            "entity_id", entityDid,
            "authority_id", authorityDid,
            "action", action,
            "resource", resource
        );
        
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(endpoint))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(
                objectMapper.writeValueAsString(requestBody)
            ))
            .build();
        
        HttpResponse<String> response = httpClient.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );
        
        Map<String, Object> result = objectMapper.readValue(
            response.body(),
            Map.class
        );
        
        return (Boolean) result.get("authorized");
    }
    
    public boolean supportsAction(String action) {
        return metadata != null && 
               metadata.getSupportedActions().contains(action);
    }
    
    public boolean supportsDIDMethod(String method) {
        return metadata != null && 
               metadata.getSupportedDIDMethods().contains(method);
    }
}

// Usage
TrustRegistryClient client = new TrustRegistryClient(
    "https://trust-registry.example.com"
);
client.initialize();

if (client.supportsAction("issue")) {
    boolean authorized = client.checkAuthorization(
        "did:web:university.edu",
        "did:web:edu-registry.org",
        "issue",
        "UniversityDegree"
    );
    System.out.println("Authorized: " + authorized);
}
```

---

## Go

```go
package main

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "bytes"
)

type RegistryMetadata struct {
    Name                string              `json:"name"`
    Version             string              `json:"version"`
    Protocol            string              `json:"protocol"`
    Endpoints           map[string]any      `json:"endpoints"`
    SupportedActions    []string            `json:"supportedActions"`
    SupportedDIDMethods []string            `json:"supportedDIDMethods"`
    Features            map[string]bool     `json:"features"`
    Status              string              `json:"status"`
}

type TrustRegistryClient struct {
    BaseURL  string
    Metadata *RegistryMetadata
    Client   *http.Client
}

func NewTrustRegistryClient(baseURL string) *TrustRegistryClient {
    return &TrustRegistryClient{
        BaseURL: baseURL,
        Client:  &http.Client{},
    }
}

func (c *TrustRegistryClient) Initialize() error {
    resp, err := c.Client.Get(c.BaseURL + "/v2/metadata")
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return err
    }
    
    var metadata RegistryMetadata
    if err := json.Unmarshal(body, &metadata); err != nil {
        return err
    }
    
    c.Metadata = &metadata
    
    fmt.Printf("✅ Connected to %s\n", metadata.Name)
    fmt.Printf("   Version: %s\n", metadata.Version)
    fmt.Printf("   Protocol: %s\n", metadata.Protocol)
    
    return nil
}

func (c *TrustRegistryClient) CheckAuthorization(
    entityDID, authorityDID, action, resource string,
) (bool, error) {
    if c.Metadata == nil {
        return false, fmt.Errorf("client not initialized")
    }
    
    if !c.Metadata.Features["authorization"] {
        return false, fmt.Errorf("registry does not support authorization")
    }
    
    endpoint := c.BaseURL + c.Metadata.Endpoints["authorization"].(string)
    
    requestBody := map[string]string{
        "entity_id":    entityDID,
        "authority_id": authorityDID,
        "action":       action,
        "resource":     resource,
    }
    
    jsonData, err := json.Marshal(requestBody)
    if err != nil {
        return false, err
    }
    
    resp, err := c.Client.Post(
        endpoint,
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return false, err
    }
    defer resp.Body.Close()
    
    var result map[string]any
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return false, err
    }
    
    return result["authorized"].(bool), nil
}

func (c *TrustRegistryClient) SupportsAction(action string) bool {
    if c.Metadata == nil {
        return false
    }
    for _, a := range c.Metadata.SupportedActions {
        if a == action {
            return true
        }
    }
    return false
}

// Usage
func main() {
    client := NewTrustRegistryClient("https://trust-registry.example.com")
    
    if err := client.Initialize(); err != nil {
        panic(err)
    }
    
    if client.SupportsAction("issue") {
        authorized, err := client.CheckAuthorization(
            "did:web:university.edu",
            "did:web:edu-registry.org",
            "issue",
            "UniversityDegree",
        )
        if err != nil {
            panic(err)
        }
        fmt.Printf("Authorized: %v\n", authorized)
    }
}
```

---

## Rust

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct RegistryMetadata {
    name: String,
    version: String,
    protocol: String,
    endpoints: HashMap<String, serde_json::Value>,
    #[serde(rename = "supportedActions")]
    supported_actions: Vec<String>,
    #[serde(rename = "supportedDIDMethods")]
    supported_did_methods: Vec<String>,
    features: HashMap<String, bool>,
    status: String,
}

struct TrustRegistryClient {
    base_url: String,
    metadata: Option<RegistryMetadata>,
    client: reqwest::Client,
}

impl TrustRegistryClient {
    fn new(base_url: String) -> Self {
        Self {
            base_url,
            metadata: None,
            client: reqwest::Client::new(),
        }
    }
    
    async fn initialize(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        let url = format!("{}/v2/metadata", self.base_url);
        let metadata: RegistryMetadata = self.client
            .get(&url)
            .send()
            .await?
            .json()
            .await?;
        
        println!("✅ Connected to {}", metadata.name);
        println!("   Version: {}", metadata.version);
        println!("   Protocol: {}", metadata.protocol);
        
        self.metadata = Some(metadata);
        Ok(())
    }
    
    async fn check_authorization(
        &self,
        entity_did: &str,
        authority_did: &str,
        action: &str,
        resource: &str,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        let metadata = self.metadata.as_ref()
            .ok_or("Client not initialized")?;
        
        if !metadata.features.get("authorization").unwrap_or(&false) {
            return Err("Registry does not support authorization".into());
        }
        
        let endpoint = format!(
            "{}{}",
            self.base_url,
            metadata.endpoints.get("authorization")
                .and_then(|v| v.as_str())
                .ok_or("Authorization endpoint not found")?
        );
        
        let request_body = serde_json::json!({
            "entity_id": entity_did,
            "authority_id": authority_did,
            "action": action,
            "resource": resource,
        });
        
        let response: serde_json::Value = self.client
            .post(&endpoint)
            .json(&request_body)
            .send()
            .await?
            .json()
            .await?;
        
        Ok(response["authorized"].as_bool().unwrap_or(false))
    }
    
    fn supports_action(&self, action: &str) -> bool {
        self.metadata.as_ref()
            .map(|m| m.supported_actions.contains(&action.to_string()))
            .unwrap_or(false)
    }
}

// Usage
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = TrustRegistryClient::new(
        "https://trust-registry.example.com".to_string()
    );
    
    client.initialize().await?;
    
    if client.supports_action("issue") {
        let authorized = client.check_authorization(
            "did:web:university.edu",
            "did:web:edu-registry.org",
            "issue",
            "UniversityDegree",
        ).await?;
        
        println!("Authorized: {}", authorized);
    }
    
    Ok(())
}
```

---

## cURL

### Basic Metadata Fetch

```bash
curl -X GET https://trust-registry.example.com/v2/metadata | jq '.'
```

### Check Specific Fields

```bash
# Check protocol version
curl -s https://trust-registry.example.com/v2/metadata | jq '.protocol, .version'

# List supported actions
curl -s https://trust-registry.example.com/v2/metadata | jq '.supportedActions'

# List supported DID methods
curl -s https://trust-registry.example.com/v2/metadata | jq '.supportedDIDMethods'

# Check features
curl -s https://trust-registry.example.com/v2/metadata | jq '.features'

# Get endpoints
curl -s https://trust-registry.example.com/v2/metadata | jq '.endpoints'
```

### Service Discovery Script

```bash
#!/bin/bash

REGISTRY_URL="https://trust-registry.example.com"

echo "🔍 Discovering registry capabilities..."
echo ""

# Fetch metadata
METADATA=$(curl -s "${REGISTRY_URL}/v2/metadata")

# Extract info
NAME=$(echo "$METADATA" | jq -r '.name')
VERSION=$(echo "$METADATA" | jq -r '.version')
PROTOCOL=$(echo "$METADATA" | jq -r '.protocol')

echo "Registry: $NAME"
echo "Version: $VERSION"
echo "Protocol: $PROTOCOL"
echo ""

# Check features
echo "Features:"
echo "$METADATA" | jq -r '.features | to_entries[] | "  \(.key): \(.value)"'
echo ""

# List actions
echo "Supported Actions:"
echo "$METADATA" | jq -r '.supportedActions[]' | sed 's/^/  - /'
echo ""

# List DID methods
echo "Supported DID Methods:"
echo "$METADATA" | jq -r '.supportedDIDMethods[]' | sed 's/^/  - /'
```

---

## Best Practices

1. **Cache Metadata**: Don't fetch on every request
   ```typescript
   const CACHE_TTL = 3600000; // 1 hour
   let cachedMetadata: RegistryMetadata | null = null;
   let cacheExpiry = 0;
   
   async function getMetadata() {
     if (cachedMetadata && Date.now() < cacheExpiry) {
       return cachedMetadata;
     }
     cachedMetadata = await fetchMetadata();
     cacheExpiry = Date.now() + CACHE_TTL;
     return cachedMetadata;
   }
   ```

2. **Handle Errors Gracefully**
   ```typescript
   try {
     const metadata = await getMetadata();
   } catch (error) {
     console.error('Failed to fetch metadata:', error);
     // Fallback to default configuration
   }
   ```

3. **Validate Protocol Version**
   ```typescript
   if (metadata.protocol !== 'ToIP Trust Registry Query Protocol v2') {
     throw new Error('Incompatible protocol version');
   }
   ```

4. **Check Feature Support**
   ```typescript
   if (!metadata.features.authorization) {
     console.warn('Authorization queries not supported');
   }
   ```
