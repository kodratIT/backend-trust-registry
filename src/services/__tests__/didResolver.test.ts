/**
 * DID Resolver Service Tests
 */

import {
  parseDID,
  validateDIDFormat,
  resolveDID,
  isDIDResolvable,
  getSupportedDIDMethods,
  clearDIDCache,
  getDIDCacheStats,
} from '../didResolver';

describe('DID Resolver Service', () => {
  beforeEach(() => {
    clearDIDCache();
  });

  describe('parseDID', () => {
    it('should parse valid DID', () => {
      const result = parseDID('did:web:example.com');
      expect(result.valid).toBe(true);
      expect(result.method).toBe('web');
      expect(result.identifier).toBe('example.com');
    });

    it('should parse DID with path', () => {
      const result = parseDID('did:web:example.com:path:to:doc');
      expect(result.valid).toBe(true);
      expect(result.method).toBe('web');
      expect(result.identifier).toBe('example.com:path:to:doc');
    });

    it('should reject invalid DID format', () => {
      const result = parseDID('invalid-did');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid DID format');
    });

    it('should reject DID without method', () => {
      const result = parseDID('did::identifier');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateDIDFormat', () => {
    it('should validate supported DID methods', () => {
      expect(validateDIDFormat('did:web:example.com').valid).toBe(true);
      expect(validateDIDFormat('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK').valid).toBe(true);
      expect(validateDIDFormat('did:indy:sovrin:123456').valid).toBe(true);
    });

    it('should reject unsupported DID methods', () => {
      const result = validateDIDFormat('did:unsupported:identifier');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported DID method');
    });
  });

  describe('resolveDID', () => {
    describe('did:web', () => {
      it('should resolve did:web with placeholder when network unavailable', async () => {
        const result = await resolveDID('did:web:example.com');
        expect(result.valid).toBe(true);
        expect(result.method).toBe('web');
        expect(result.didDocument).toBeDefined();
        expect(result.didDocument?.id).toBe('did:web:example.com');
      });
    });

    describe('did:key', () => {
      it('should resolve valid did:key', async () => {
        const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
        const result = await resolveDID(did);
        expect(result.valid).toBe(true);
        expect(result.method).toBe('key');
        expect(result.didDocument?.verificationMethod).toHaveLength(1);
      });

      it('should reject did:key without z prefix', async () => {
        const result = await resolveDID('did:key:invalid');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Must start with "z"');
      });
    });

    describe('did:indy', () => {
      it('should resolve did:indy with placeholder', async () => {
        const result = await resolveDID('did:indy:sovrin:WRfXPg8dantKVubE3HX8pw');
        expect(result.valid).toBe(true);
        expect(result.method).toBe('indy');
        expect(result.didDocument).toBeDefined();
      });

      it('should reject invalid did:indy format', async () => {
        const result = await resolveDID('did:indy:invalid');
        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid did:indy format');
      });
    });

    describe('other methods', () => {
      it('should return placeholder for other supported methods', async () => {
        const result = await resolveDID('did:ethr:0x1234567890abcdef');
        expect(result.valid).toBe(true);
        expect(result.method).toBe('ethr');
      });
    });
  });

  describe('caching', () => {
    it('should cache resolved DIDs', async () => {
      const did = 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';

      // First resolution
      await resolveDID(did);
      const stats1 = getDIDCacheStats();
      expect(stats1.size).toBe(1);

      // Second resolution should use cache
      await resolveDID(did);
      const stats2 = getDIDCacheStats();
      expect(stats2.size).toBe(1);
    });

    it('should clear cache', async () => {
      await resolveDID('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK');
      expect(getDIDCacheStats().size).toBe(1);

      clearDIDCache();
      expect(getDIDCacheStats().size).toBe(0);
    });
  });

  describe('isDIDResolvable', () => {
    it('should return true for valid DIDs', async () => {
      expect(await isDIDResolvable('did:web:example.com')).toBe(true);
      expect(await isDIDResolvable('did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')).toBe(true);
    });

    it('should return false for invalid DIDs', async () => {
      expect(await isDIDResolvable('invalid')).toBe(false);
    });
  });

  describe('getSupportedDIDMethods', () => {
    it('should return list of supported methods', () => {
      const methods = getSupportedDIDMethods();
      expect(methods).toContain('web');
      expect(methods).toContain('key');
      expect(methods).toContain('indy');
    });
  });
});
