/**
 * Swagger Configuration
 * ToIP Trust Registry v2 Backend
 *
 * OpenAPI 3.0 specification for API documentation
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ToIP Trust Registry v2 API',
      version: '1.0.0',
      description:
        'REST API for ToIP Trust Registry v2 - A verifiable credentials trust registry implementation',
      contact: {
        name: 'ToIP Trust Registry Team',
        email: 'support@trustregistry.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: 'Development Server (Local)',
        variables: {
          host: {
            default: env.HOST,
            description: 'Server host',
          },
          port: {
            default: env.PORT.toString(),
            description: 'Server port',
          },
        },
      },
      {
        url: 'http://localhost:3000',
        description: 'Local Development',
      },
      {
        url: 'https://api.trustregistry.example.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type',
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            details: {
              type: 'object',
              description: 'Additional error details',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Validation Error',
            },
            message: {
              type: 'string',
              example: 'Request body validation failed',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        ProblemDetails: {
          type: 'object',
          description: 'RFC 7807 Problem Details',
          properties: {
            type: {
              type: 'string',
              format: 'uri',
              description: 'URI reference identifying the problem type',
            },
            title: {
              type: 'string',
              description: 'Short human-readable summary',
            },
            status: {
              type: 'integer',
              description: 'HTTP status code',
            },
            detail: {
              type: 'string',
              description: 'Human-readable explanation',
            },
            instance: {
              type: 'string',
              description: 'URI reference identifying the specific occurrence',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of records',
            },
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of records per page',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
          },
        },
        TrustFramework: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier',
            },
            name: {
              type: 'string',
              description: 'Trust framework name',
            },
            version: {
              type: 'string',
              description: 'Trust framework version',
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Trust framework description',
            },
            governanceFrameworkUrl: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'URL to governance framework document',
            },
            legalAgreements: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
              },
              nullable: true,
              description: 'Array of legal agreement URLs',
            },
            jurisdictions: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              description: 'Array of jurisdiction codes',
            },
            contexts: {
              type: 'array',
              items: {
                type: 'string',
              },
              nullable: true,
              description: 'Array of context strings',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'deprecated'],
              description: 'Trust framework status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        APIKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier',
            },
            name: {
              type: 'string',
              description: 'API key name',
            },
            role: {
              type: 'string',
              enum: ['admin', 'registry_owner', 'public'],
              description: 'API key role',
            },
            registryId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Associated registry ID (for registry_owner role)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Expiration timestamp',
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last usage timestamp',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'API Keys',
        description: 'API key management endpoints',
      },
      {
        name: 'Trust Frameworks',
        description: 'Trust framework CRUD operations',
      },
      {
        name: 'Trust Registries',
        description: 'Trust registry CRUD operations',
      },
      {
        name: 'Credential Schemas',
        description: 'Credential schema management with JSON Schema validation',
      },
      {
        name: 'Issuers',
        description: 'Issuer registration and management',
      },
      {
        name: 'Verifiers',
        description: 'Verifier registration and management',
      },
      {
        name: 'Delegations',
        description: 'Issuer delegation chain management',
      },
      {
        name: 'Audit',
        description: 'Audit log queries (admin only)',
      },
      {
        name: 'Query',
        description: 'Trust resolution query API',
      },
      {
        name: 'TRQP',
        description: 'TRQP v2 Protocol endpoints (Authorization & Recognition queries)',
      },
      {
        name: 'Recognitions',
        description: 'Registry recognition management (admin only)',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
