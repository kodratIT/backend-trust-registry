/**
 * Signature Service Tests
 */

import {
  generateKeyPair,
  signData,
  verifySignature,
  signEntry,
  verifyEntry,
  createRegistryDidDocument,
  initializeRegistryKey,
  getRegistryPublicKey,
  _setRegistryKeyPair,
  _getRegistryKeyPair,
} from '../signatureService';

describe('Signature Service', () => {
  beforeEach(() => {
    // Reset registry key pair before each test
    _setRegistryKeyPair(null);
  });

  describe('generateKeyPair', () => {
    it('should generate valid Ed25519 key pair', async () => {
      const keyPair = await generateKeyPair();

      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      // tweetnacl uses 64-byte secret key (seed + public key)
      expect(keyPair.privateKey).toHaveLength(128); // 64 bytes hex
      expect(keyPair.publicKey).toHaveLength(64); // 32 bytes hex
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await generateKeyPair();
      const keyPair2 = await generateKeyPair();

      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
    });
  });

  describe('signData and verifySignature', () => {
    it('should sign and verify data correctly', async () => {
      const keyPair = await generateKeyPair();
      const data = 'Hello, World!';

      const signature = await signData(data, keyPair.privateKey);
      const isValid = await verifySignature(data, signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong public key', async () => {
      const keyPair1 = await generateKeyPair();
      const keyPair2 = await generateKeyPair();
      const data = 'Hello, World!';

      const signature = await signData(data, keyPair1.privateKey);
      const isValid = await verifySignature(data, signature, keyPair2.publicKey);

      expect(isValid).toBe(false);
    });

    it('should fail verification with tampered data', async () => {
      const keyPair = await generateKeyPair();
      const data = 'Hello, World!';

      const signature = await signData(data, keyPair.privateKey);
      const isValid = await verifySignature('Tampered data', signature, keyPair.publicKey);

      expect(isValid).toBe(false);
    });

    it('should handle JSON data', async () => {
      const keyPair = await generateKeyPair();
      const data = JSON.stringify({ did: 'did:web:example.com', status: 'active' });

      const signature = await signData(data, keyPair.privateKey);
      const isValid = await verifySignature(data, signature, keyPair.publicKey);

      expect(isValid).toBe(true);
    });
  });

  describe('initializeRegistryKey', () => {
    it('should generate new key pair when no env vars', async () => {
      const keyPair = await initializeRegistryKey();

      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
    });

    it('should return same key pair on subsequent calls', async () => {
      const keyPair1 = await initializeRegistryKey();
      const keyPair2 = await initializeRegistryKey();

      expect(keyPair1.privateKey).toBe(keyPair2.privateKey);
      expect(keyPair1.publicKey).toBe(keyPair2.publicKey);
    });

    it('should use env vars when available', async () => {
      const testPrivateKey = 'a'.repeat(64);
      const testPublicKey = 'b'.repeat(64);

      process.env.REGISTRY_PRIVATE_KEY = testPrivateKey;
      process.env.REGISTRY_PUBLIC_KEY = testPublicKey;

      const keyPair = await initializeRegistryKey();

      expect(keyPair.privateKey).toBe(testPrivateKey);
      expect(keyPair.publicKey).toBe(testPublicKey);

      delete process.env.REGISTRY_PRIVATE_KEY;
      delete process.env.REGISTRY_PUBLIC_KEY;
    });
  });

  describe('signEntry and verifyEntry', () => {
    it('should sign and verify registry entry', async () => {
      await initializeRegistryKey();

      const entry = {
        did: 'did:web:issuer.example.com',
        name: 'Test Issuer',
        status: 'active',
        credentialTypes: ['VerifiableCredential'],
      };

      const signedEntry = await signEntry(entry, 'did:web:registry.example.com');

      expect(signedEntry.entry).toEqual(entry);
      expect(signedEntry.proof.type).toBe('Ed25519Signature2020');
      expect(signedEntry.proof.proofPurpose).toBe('assertionMethod');
      expect(signedEntry.proof.proofValue).toBeDefined();

      const result = await verifyEntry(signedEntry);
      expect(result.valid).toBe(true);
    });

    it('should fail verification with tampered entry', async () => {
      await initializeRegistryKey();

      const entry = {
        did: 'did:web:issuer.example.com',
        status: 'active',
      };

      const signedEntry = await signEntry(entry, 'did:web:registry.example.com');

      // Tamper with entry
      signedEntry.entry.status = 'revoked';

      const result = await verifyEntry(signedEntry);
      expect(result.valid).toBe(false);
    });
  });

  describe('getRegistryPublicKey', () => {
    it('should return null when not initialized', () => {
      const publicKey = getRegistryPublicKey();
      expect(publicKey).toBeNull();
    });

    it('should return public key after initialization', async () => {
      await initializeRegistryKey();
      const publicKey = getRegistryPublicKey();
      expect(publicKey).toBeDefined();
      expect(publicKey).toHaveLength(64); // 32 bytes hex
    });
  });

  describe('createRegistryDidDocument', () => {
    it('should create valid DID document', async () => {
      await initializeRegistryKey();

      const registryDid = 'did:web:registry.example.com';
      const didDoc = createRegistryDidDocument(registryDid);

      expect(didDoc.id).toBe(registryDid);
      expect(didDoc['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(didDoc.verificationMethod).toHaveLength(1);
      expect(didDoc.assertionMethod).toContain(`${registryDid}#key-1`);
    });

    it('should throw error when key not initialized', () => {
      expect(() => createRegistryDidDocument('did:web:test.com')).toThrow(
        'Registry public key not initialized'
      );
    });
  });
});
