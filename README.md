# ToIP Trust Registry v2 - Backend

Backend API for ToIP Trust Registry v2 System - A verifiable credentials trust registry implementation.

## 🚀 Quick Start

### Option 1: Docker (Recommended)

**Prerequisites**:
- Docker Engine 20.10+
- Docker Compose 2.0+

**Steps**:
```bash
# Copy environment variables
cp .env.example .env

# Start all services (PostgreSQL + Redis + API)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# API will be available at http://localhost:3000
```

See [DOCKER.md](./DOCKER.md) for detailed Docker setup guide.

### Option 2: Local Development

**Prerequisites**:
- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL 15+
- Redis 7+

**Steps**:
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Database migrations
├── tests/               # Test files
├── docs/                # Documentation
└── package.json
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations

## 🏗️ Technology Stack

- **Runtime**: Node.js 20 LTS
- **Language**: TypeScript 5.x
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15 + Prisma 5
- **Cache**: Redis 7+
- **Testing**: Jest
- **Linting**: ESLint + Prettier

## 🐳 Docker

This project includes Docker support for easy development and deployment:

- **Development**: `docker-compose.dev.yml` - Hot reload, debug logging
- **Production**: `docker-compose.yml` - Optimized build, security hardened

See [DOCKER.md](./DOCKER.md) for complete Docker setup guide.

## 🔐 Authentication

This API uses **API Key authentication** with **Role-Based Access Control (RBAC)**.

**Quick Start**:
```bash
# Generate test API keys
npx prisma db seed

# Use API key in requests
curl -H "X-API-Key: your-key-here" http://localhost:3000/v2/api-keys
```

**Roles**:
- `admin` - Full system access
- `registry_owner` - Registry-specific access
- `public` - Read-only access

See [Authentication Guide](./docs/AUTHENTICATION.md) for complete documentation.

## 📚 Documentation

- [API Guide - Flow & Usage](./docs/API-GUIDE.md) ⭐ **Start Here**
- [Endpoint Reference](./docs/ENDPOINTS.md) - Detail semua endpoints
- [TRQP Protocol](./docs/TRQP-API.md) - Authorization & Recognition queries
- [Authentication & Authorization](./docs/AUTHENTICATION.md)
- [Credential Schema API](./docs/CREDENTIAL-SCHEMA-API.md)
- [Trust Registry API](./docs/TRUST-REGISTRY-API.md)
- [Testing Guide](./docs/TESTING.md)
- [Docker Setup Guide](./DOCKER.md)

### Swagger UI

API documentation tersedia di:
```
http://localhost:3000/api-docs
```

Download OpenAPI spec:
```
http://localhost:3000/api-docs/swagger.json
```

## 🔐 Environment Variables

See `.env.example` for all available environment variables.

## 📝 License

MIT

## 👥 Team

Technical Team - ToIP Trust Registry v2 Project
