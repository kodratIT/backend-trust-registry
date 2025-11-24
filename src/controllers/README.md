# Controllers

This directory contains request handlers for API endpoints.

## Structure

Controllers handle HTTP requests and responses. They should:
- Validate request data
- Call appropriate services
- Return formatted responses
- Handle errors appropriately

## Example

```typescript
import { Request, Response } from 'express';
import { TrustFrameworkService } from '../services/trustFrameworkService';

export class TrustFrameworkController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const result = await TrustFrameworkService.create(data);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```
