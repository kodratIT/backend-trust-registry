# Services

This directory contains business logic and service layer.

## Structure

Services contain business logic and orchestrate operations. They should:
- Implement business rules
- Coordinate between models
- Handle complex operations
- Manage transactions

## Example

```typescript
import { TrustFrameworkModel } from '../models/trustFrameworkModel';
import { AuditService } from './auditService';

export class TrustFrameworkService {
  static async create(data: any) {
    // Validate business rules
    if (!data.name || !data.version) {
      throw new Error('Name and version are required');
    }
    
    // Create trust framework
    const framework = await TrustFrameworkModel.create(data);
    
    // Log audit event
    await AuditService.log({
      action: 'trust_framework_created',
      resourceId: framework.id,
    });
    
    return framework;
  }
}
```
