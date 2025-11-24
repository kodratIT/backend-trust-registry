# Utils

This directory contains utility functions and helpers.

## Structure

Utilities provide reusable helper functions. They should:
- Be pure functions when possible
- Have single responsibility
- Be well-tested
- Be framework-agnostic

## Example

```typescript
/**
 * Generate a random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a string using bcrypt
 */
export async function hashString(str: string): Promise<string> {
  return bcrypt.hash(str, 12);
}

/**
 * Validate DID format
 */
export function isValidDID(did: string): boolean {
  return /^did:[a-z]+:[a-zA-Z0-9._-]+$/.test(did);
}
```
