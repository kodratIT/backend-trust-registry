# Routes

This directory contains API route definitions.

## Structure

Routes define API endpoints and map them to controllers. They should:
- Define HTTP methods and paths
- Apply middleware (auth, validation)
- Map to controller methods
- Group related endpoints

## Example

```typescript
import { Router } from 'express';
import { TrustFrameworkController } from '../controllers/trustFrameworkController';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new TrustFrameworkController();

router.post('/trust-frameworks', authenticate, controller.create);
router.get('/trust-frameworks', controller.list);
router.get('/trust-frameworks/:id', controller.getById);

export default router;
```
