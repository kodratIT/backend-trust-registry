# Models

This directory contains data models and Prisma client interactions.

## Structure

Models represent database entities and provide methods for data access. They should:
- Define data structures
- Provide CRUD operations
- Handle data validation
- Manage relationships

## Example

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TrustFrameworkModel {
  static async findById(id: string) {
    return prisma.trustFramework.findUnique({
      where: { id },
    });
  }

  static async create(data: any) {
    return prisma.trustFramework.create({
      data,
    });
  }
}
```
