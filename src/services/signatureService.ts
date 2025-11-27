/**
 * Signature Service
 * ToIP Trust Registry v2 Backend
 *
 * Handles Ed25519 key generation, signing, and verification using tweetnacl
 */

/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

// Types
export interface KeyPair {
  privateKey: string; // hex encoded
  publicKey: string; // hex encoded
}

export interface SignedEntry {
  entry: Record<string, unknown>;
  proof: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string; // hex encoded signature
  };
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

// Helper functions
function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'));
}

// Registry key management
let registryKeyPair: KeyPair | null = null;

/**
 * Generate a new Ed25519 key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = nacl.sign.keyPair();

  return {
    privateKey: bytesToHex(keyPair.secretKey),
    publicKey: bytesToHex(keyPair.publicKey),
  };
}

/**
 * Initialize registry key pair from environment or generate new
 */
export async function initializeRegistryKey(): Promise<KeyPair> {
  // Check if already initialized
  if (registryKeyPair) {
    return registryKeyPair;
  }

  // Try to load from environment
  const envPrivateKey = process.env.REGISTRY_PRIVATE_KEY;
  const envPublicKey = process.env.REGISTRY_PUBLIC_KEY;

  if (envPrivateKey && envPublicKey) {
    registryKeyPair = {
      privateKey: envPrivateKey,
      publicKey: envPublicKey,
    };
    return registryKeyPair;
  }

  // Generate new key pair (for development)
  console.warn('⚠️  No registry keys found in environment. Generating new keys...');
  console.warn('⚠️  For production, set REGISTRY_PRIVATE_KEY and REGISTRY_PUBLIC_KEY');

  registryKeyPair = await generateKeyPair();

  console.log('📝 Generated Registry Keys:');
  console.log(`   Public Key: ${registryKeyPair.publicKey}`);

  return registryKeyPair;
}

/**
 * Get the registry public key
 */
export function getRegistryPublicKey(): string | null {
  return registryKeyPair?.publicKey || process.env.REGISTRY_PUBLIC_KEY || null;
}

/**
 * Sign data with a private key
 */
export async function signData(data: string, privateKeyHex: string): Promise<string> {
  const privateKey = hexToBytes(privateKeyHex);
  const message = naclUtil.decodeUTF8(data);
  const signature = nacl.sign.detached(message, privateKey);
  return bytesToHex(signature);
}

/**
 * Verify a signature with a public key
 */
export async function verifySignature(
  data: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const publicKey = hexToBytes(publicKeyHex);
    const signature = hexToBytes(signatureHex);
    const message = naclUtil.decodeUTF8(data);
    return nacl.sign.detached.verify(message, signature, publicKey);
  } catch {
    return false;
  }
}

/**
 * Create a canonical JSON string for signing
 */
function canonicalize(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Sign a registry entry (issuer or verifier)
 */
export async function signEntry(
  entry: Record<string, unknown>,
  registryDid: string
): Promise<SignedEntry> {
  // Ensure registry key is initialized
  if (!registryKeyPair) {
    await initializeRegistryKey();
  }

  if (!registryKeyPair) {
    throw new Error('Registry key pair not initialized');
  }

  // Create canonical representation
  const canonicalEntry = canonicalize(entry);

  // Sign the entry
  const proofValue = await signData(canonicalEntry, registryKeyPair.privateKey);

  return {
    entry,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      verificationMethod: `${registryDid}#key-1`,
      proofPurpose: 'assertionMethod',
      proofValue,
    },
  };
}

/**
 * Verify a signed registry entry
 */
export async function verifyEntry(signedEntry: SignedEntry): Promise<VerificationResult> {
  try {
    // Get public key
    const publicKey = getRegistryPublicKey();
    if (!publicKey) {
      return { valid: false, error: 'Registry public key not available' };
    }

    // Recreate canonical representation
    const canonicalEntry = canonicalize(signedEntry.entry);

    // Verify signature
    const isValid = await verifySignature(canonicalEntry, signedEntry.proof.proofValue, publicKey);

    if (!isValid) {
      return { valid: false, error: 'Invalid signature' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * Create a DID document for the registry with public key
 */
export function createRegistryDidDocument(registryDid: string): Record<string, unknown> {
  const publicKey = getRegistryPublicKey();

  if (!publicKey) {
    throw new Error('Registry public key not initialized');
  }

  return {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/suites/ed25519-2020/v1',
    ],
    id: registryDid,
    verificationMethod: [
      {
        id: `${registryDid}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: registryDid,
        publicKeyMultibase: `z${Buffer.from(hexToBytes(publicKey)).toString('base64url')}`,
      },
    ],
    assertionMethod: [`${registryDid}#key-1`],
    authentication: [`${registryDid}#key-1`],
  };
}

// Export for testing
export function _setRegistryKeyPair(keyPair: KeyPair | null): void {
  registryKeyPair = keyPair;
}

export function _getRegistryKeyPair(): KeyPair | null {
  return registryKeyPair;
}
