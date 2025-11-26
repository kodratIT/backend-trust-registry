/**
 * DID Resolver Service
 * ToIP Trust Registry v2 Backend
 *
 * Service for resolving and validating DIDs
 */

/* eslint-disable no-console */

/**
 * DID Resolution Result
 */
export interface DIDResolutionResult {
  valid: boolean;
  did: string;
  method: string;
  didDocument?: DIDDocument;
  error?: string;
}

/**
 * Basic DID Document structure
 */
export interface DIDDocument {
  '@context': string | string[];
  id: string;
  verificationMethod?: VerificationMethod[];
  authentication?: (string | VerificationMethod)[];
  service?: ServiceEndpoint[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk?: Record<string, unknown>;
  publicKeyMultibase?: string;
}

export interface ServiceEndpoint {
  id: string;
  type: string;
  serviceEndpoint: string | string[] | Record<string, unknown>;
}

/**
 * Supported DID methods
 */
const SUPPORTED_DID_METHODS = ['web', 'key', 'ion', 'ethr', 'sov', 'indy'];

/**
 * Parse a DID string into its components
 */
export function parseDID(did: string): {
  valid: boolean;
  method?: string;
  identifier?: string;
  error?: string;
} {
  // Basic DID format: did:<method>:<identifier>
  const didRegex = /^did:([a-z0-9]+):(.+)$/i;
  const match = did.match(didRegex);

  if (!match) {
    return {
      valid: false,
      error: 'Invalid DID format. Expected: did:<method>:<identifier>',
    };
  }

  const [, methodPart, identifierPart] = match;

  return {
    valid: true,
    method: methodPart?.toLowerCase() ?? '',
    identifier: identifierPart ?? '',
  };
}

/**
 * Validate DID format without resolution
 */
export function validateDIDFormat(did: string): {
  valid: boolean;
  method?: string;
  error?: string;
} {
  const parsed = parseDID(did);

  if (!parsed.valid) {
    return parsed;
  }

  // Check if method is supported
  const method = parsed.method ?? '';
  if (!SUPPORTED_DID_METHODS.includes(method)) {
    return {
      valid: false,
      method: method,
      error: `Unsupported DID method: ${method}. Supported methods: ${SUPPORTED_DID_METHODS.join(', ')}`,
    };
  }

  return {
    valid: true,
    method: parsed.method,
  };
}

/**
 * Resolve a DID to its DID Document
 * Note: This is a simplified implementation. In production, you would use
 * a proper DID resolver library like @decentralized-identity/did-resolver
 */
export async function resolveDID(did: string): Promise<DIDResolutionResult> {
  const parsed = parseDID(did);

  if (!parsed.valid) {
    return {
      valid: false,
      did,
      method: 'unknown',
      error: parsed.error,
    };
  }

  const method = parsed.method!;

  try {
    switch (method) {
      case 'web':
        return await resolveDidWeb(did, parsed.identifier!);

      case 'key':
        return resolveDidKey(did, parsed.identifier!);

      default:
        // For other methods, just validate format for now
        return {
          valid: true,
          did,
          method,
          didDocument: createPlaceholderDocument(did),
        };
    }
  } catch (error) {
    console.error(`Error resolving DID ${did}:`, error);
    return {
      valid: false,
      did,
      method,
      error: `Failed to resolve DID: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Resolve did:web DID
 * did:web DIDs are resolved by fetching the DID document from a well-known URL
 */
async function resolveDidWeb(did: string, identifier: string): Promise<DIDResolutionResult> {
  // Convert did:web identifier to URL
  // did:web:example.com -> https://example.com/.well-known/did.json
  // did:web:example.com:path:to:doc -> https://example.com/path/to/doc/did.json
  const parts = identifier.split(':');
  const domain = (parts[0] ?? '').replace(/%3A/g, ':'); // Handle port encoding
  const path = parts.slice(1).join('/');

  const url = path
    ? `https://${domain}/${path}/did.json`
    : `https://${domain}/.well-known/did.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // If we can't fetch, still consider it valid if format is correct
      // This allows for DIDs that may not have published documents yet
      return {
        valid: true,
        did,
        method: 'web',
        didDocument: createPlaceholderDocument(did),
      };
    }

    const didDocument = (await response.json()) as DIDDocument;

    // Validate that the document ID matches the DID
    if (didDocument.id !== did) {
      return {
        valid: false,
        did,
        method: 'web',
        error: `DID document ID mismatch. Expected: ${did}, Got: ${didDocument.id}`,
      };
    }

    return {
      valid: true,
      did,
      method: 'web',
      didDocument,
    };
  } catch (error) {
    // Network errors or timeouts - still consider valid if format is correct
    console.warn(`Could not fetch DID document for ${did}:`, error);
    return {
      valid: true,
      did,
      method: 'web',
      didDocument: createPlaceholderDocument(did),
    };
  }
}

/**
 * Resolve did:key DID
 * did:key DIDs are self-describing and don't require network resolution
 */
function resolveDidKey(did: string, identifier: string): DIDResolutionResult {
  // did:key identifiers start with 'z' followed by multibase-encoded public key
  if (!identifier.startsWith('z')) {
    return {
      valid: false,
      did,
      method: 'key',
      error: 'Invalid did:key identifier. Must start with "z"',
    };
  }

  // Create a basic DID document for did:key
  const didDocument: DIDDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: did,
    verificationMethod: [
      {
        id: `${did}#${identifier}`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: identifier,
      },
    ],
    authentication: [`${did}#${identifier}`],
  };

  return {
    valid: true,
    did,
    method: 'key',
    didDocument,
  };
}

/**
 * Create a placeholder DID document for DIDs that can't be resolved
 */
function createPlaceholderDocument(did: string): DIDDocument {
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
  };
}

/**
 * Check if a DID is resolvable (can be validated)
 */
export async function isDIDResolvable(did: string): Promise<boolean> {
  const result = await resolveDID(did);
  return result.valid;
}

/**
 * Get supported DID methods
 */
export function getSupportedDIDMethods(): string[] {
  return [...SUPPORTED_DID_METHODS];
}
