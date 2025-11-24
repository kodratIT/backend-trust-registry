# Testing Guide
## ToIP Trust Registry v2 Backend

This guide explains how to run and write tests for the ToIP Trust Registry v2 backend.

---

## 🧪 Test Setup

### Prerequisites

1. **Test Database**: PostgreSQL database for testing
2. **Node.js**: Version 20 or higher
3. **Dependencies**: All npm packages installed

### Test Database Setup

#### Option 1: Docker (Recommended)

```bash
# Start test database with Docker
docker run -d \
  --name trust-registry-test-db \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=test_db \
  -p 5433:5432 \
  postgres:15
```

#### Option 2: Local PostgreSQL

Create a test database:

```sql
CREATE DATABASE test_db;
CREATE USER test WITH PASSWORD 'test';
GRANT ALL PRIVILEGES ON DATABASE test_db TO test;
```

### Environment Configuration

Create `.env.test` file:

```env
NODE_ENV=test
PORT=3001
HOST=localhost
DATABASE_URL=postgresql://test:test@localhost:5433/test_db
```

### Run Migrations

```bash
# Run migrations on test database
DATABASE_URL=postgresql://test:test@localhost:5433/test_db npx prisma migrate deploy
```

---

## 🚀 Running Tests

### All Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### With Coverage

```bash
npm run test:coverage
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

---

## 📝 Writing Tests

### Unit Tests

Unit tests are located in `__tests__` folders next to the code they test.

**Example**: `src/controllers/__tests__/apiKeyController.test.ts`

```typescript
import { createAPIKey } from '../apiKeyController';

describe('API Key Controller', () => {
  describe('createAPIKey', () => {
    it('should create an API key', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests

Integration tests are located in `src/test/integration/`.

**Example**: `src/test/integration/apiKeys.test.ts`

```typescript
import { createTestRequest, createTestAPIKey } from '../helpers';

describe('API Keys Integration Tests', () => {
  it('should create an API key via API', async () => {
    const adminKey = await createTestAPIKey({
      name: 'Admin Key',
      role: 'admin',
    });

    const response = await createTestRequest()
      .post('/v2/api-keys')
      .set('X-API-Key', adminKey.key)
      .send({
        name: 'Test Key',
        role: 'public',
      });

    expect(response.status).toBe(201);
  });
});
```

---

## 🛠️ Test Helpers

### Available Helpers

Located in `src/test/helpers.ts`:

- `createTestRequest()` - Create unauthenticated request
- `createAuthenticatedRequest(apiKey)` - Create authenticated request
- `cleanupDatabase()` - Clean all test data
- `closeDatabaseConnection()` - Close Prisma connection
- `createTestAPIKey(data)` - Create test API key
- `createTestTrustFramework(data)` - Create test trust framework
- `createTestTrustRegistry(data)` - Create test trust registry
- `wait(ms)` - Wait for async operations
- `randomString(length)` - Generate random string
- `randomEmail()` - Generate random email

### Usage Example

```typescript
import {
  createTestRequest,
  createTestAPIKey,
  cleanupDatabase,
} from '../helpers';

describe('My Tests', () => {
  afterEach(async () => {
    await cleanupDatabase();
  });

  it('should test something', async () => {
    const apiKey = await createTestAPIKey({
      name: 'Test Key',
      role: 'admin',
    });

    const response = await createTestRequest()
      .get('/v2/api-keys')
      .set('X-API-Key', apiKey.key);

    expect(response.status).toBe(200);
  });
});
```

---

## 📊 Coverage

### Coverage Thresholds

Minimum coverage requirements:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### View Coverage Report

After running `npm run test:coverage`, open:

```
coverage/lcov-report/index.html
```

---

## 🎯 Best Practices

### 1. Test Isolation

Each test should be independent:

```typescript
afterEach(async () => {
  await cleanupDatabase();
});
```

### 2. Descriptive Test Names

```typescript
it('should return 401 when API key is missing', async () => {
  // Test implementation
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should create a trust framework', async () => {
  // Arrange
  const data = { name: 'Test', version: '1.0' };

  // Act
  const result = await createTrustFramework(data);

  // Assert
  expect(result).toHaveProperty('id');
  expect(result.name).toBe('Test');
});
```

### 4. Mock External Dependencies

```typescript
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    trustFramework: {
      create: jest.fn(),
    },
  })),
}));
```

### 5. Test Error Cases

```typescript
it('should return 400 for invalid input', async () => {
  const response = await createTestRequest()
    .post('/v2/trust-frameworks')
    .send({ invalid: 'data' });

  expect(response.status).toBe(400);
});
```

---

## 🐛 Debugging Tests

### Run Single Test File

```bash
npm test -- src/controllers/__tests__/apiKeyController.test.ts
```

### Run Single Test

```bash
npm test -- -t "should create an API key"
```

### Verbose Output

```bash
npm test -- --verbose
```

### Debug with Node Inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🔧 Troubleshooting

### Database Connection Errors

**Problem**: `Authentication failed against database server`

**Solution**:
1. Ensure test database is running
2. Check DATABASE_URL in `.env.test`
3. Run migrations on test database

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9
```

### Tests Hanging

**Problem**: Tests don't complete

**Solution**:
1. Ensure `forceExit: true` in jest.config.js
2. Close database connections in afterAll hooks
3. Check for open handles with `--detectOpenHandles`

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Last Updated**: November 24, 2024  
**Version**: 1.0
