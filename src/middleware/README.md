# Middleware

This directory contains Express middleware functions.

## Structure

Middleware functions process requests before they reach controllers. They should:
- Authenticate requests
- Validate input data
- Handle errors
- Log requests
- Rate limit

## Example

```typescript
import { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key
  // ...
  
  next();
}
```
