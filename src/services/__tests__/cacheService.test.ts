/**
 * Cache Service Tests
 */

import {
  get,
  set,
  del,
  delPattern,
  clear,
  getStats,
  queryKey,
  entityKey,
  invalidateEntity,
  invalidateQueries,
  CACHE_TTL,
} from '../cacheService';

describe('Cache Service', () => {
  beforeEach(() => {
    clear();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      set('test-key', { data: 'test' });
      const result = get<{ data: string }>('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent keys', () => {
      const result = get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire values after TTL', async () => {
      set('short-lived', 'value', 50); // 50ms TTL

      expect(get('short-lived')).toBe('value');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(get('short-lived')).toBeNull();
    });

    it('should use default TTL', () => {
      set('default-ttl', 'value');
      expect(get('default-ttl')).toBe('value');
    });
  });

  describe('del', () => {
    it('should delete existing key', () => {
      set('to-delete', 'value');
      expect(del('to-delete')).toBe(true);
      expect(get('to-delete')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      expect(del('non-existent')).toBe(false);
    });
  });

  describe('delPattern', () => {
    it('should delete keys matching pattern', () => {
      set('query:issuer:1', 'value1');
      set('query:issuer:2', 'value2');
      set('query:verifier:1', 'value3');
      set('entity:issuer:1', 'value4');

      const count = delPattern('query:issuer:*');

      expect(count).toBe(2);
      expect(get('query:issuer:1')).toBeNull();
      expect(get('query:issuer:2')).toBeNull();
      expect(get('query:verifier:1')).toBe('value3');
      expect(get('entity:issuer:1')).toBe('value4');
    });
  });

  describe('clear', () => {
    it('should clear all cache', () => {
      set('key1', 'value1');
      set('key2', 'value2');

      clear();

      expect(get('key1')).toBeNull();
      expect(get('key2')).toBeNull();
      expect(getStats().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      set('key1', 'value1');
      set('key2', 'value2');

      const stats = getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should clean expired entries', async () => {
      set('short', 'value', 50);
      set('long', 'value', 10000);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = getStats();
      expect(stats.size).toBe(1);
      expect(stats.keys).toContain('long');
    });
  });

  describe('queryKey', () => {
    it('should generate consistent keys', () => {
      const key1 = queryKey({ entityType: 'issuer', did: 'did:web:example.com' });
      const key2 = queryKey({ did: 'did:web:example.com', entityType: 'issuer' });

      expect(key1).toBe(key2);
    });

    it('should ignore null/undefined values', () => {
      const key1 = queryKey({ entityType: 'issuer', did: undefined });
      const key2 = queryKey({ entityType: 'issuer' });

      expect(key1).toBe(key2);
    });
  });

  describe('entityKey', () => {
    it('should generate entity key', () => {
      const key = entityKey('issuer', '123');
      expect(key).toBe('entity:issuer:123');
    });
  });

  describe('invalidateEntity', () => {
    it('should invalidate entity and related queries', () => {
      set(entityKey('issuer', '123'), { data: 'issuer' });
      set(queryKey({ entityType: 'issuer', id: '123' }), { results: [] });
      set(queryKey({ entityType: 'verifier' }), { results: [] });

      invalidateEntity('issuer', '123');

      expect(get(entityKey('issuer', '123'))).toBeNull();
      // Query cache with issuer should be invalidated
      expect(get(queryKey({ entityType: 'issuer', id: '123' }))).toBeNull();
      // Unrelated query should remain
      expect(get(queryKey({ entityType: 'verifier' }))).not.toBeNull();
    });
  });

  describe('invalidateQueries', () => {
    it('should invalidate all query caches', () => {
      set('query:1', 'value1');
      set('query:2', 'value2');
      set('entity:1', 'value3');

      invalidateQueries();

      expect(get('query:1')).toBeNull();
      expect(get('query:2')).toBeNull();
      expect(get('entity:1')).toBe('value3');
    });
  });

  describe('CACHE_TTL', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.QUERY_RESULT).toBe(5 * 60 * 1000);
      expect(CACHE_TTL.DID_DOCUMENT).toBe(60 * 60 * 1000);
      expect(CACHE_TTL.REGISTRY_DATA).toBe(10 * 60 * 1000);
      expect(CACHE_TTL.SHORT).toBe(60 * 1000);
    });
  });
});
