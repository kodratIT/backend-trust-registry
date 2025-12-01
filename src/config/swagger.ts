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
    openapi: '3.0.3',
    info: {
      title: 'ToIP Trust Registry v2 API',
      version: '1.0.0',
      description: `Trust Registry Query Protocol (TRQP) v2 implementation following [ToIP specification](https://github.com/trustoverip/tswg-trust-registry-protocol).

**Auth:** \`X-API-Key\` header | **TRQP endpoints:** Public (no auth required)`,
      contact: {
        name: 'GitHub',
        url: 'https://github.com/trustoverip/tswg-trust-registry-protocol',
      },
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0',
      },
    },
    externalDocs: {
      description: 'TRQP Specification',
      url: 'https://github.com/trustoverip/tswg-trust-registry-protocol',
    },
    servers: [
      {
        url: `http://${env.HOST}:${env.PORT}`,
        description: 'API Server',
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
        Recognition: {
          type: 'object',
          description: 'Inter-registry recognition relationship',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier',
            },
            authorityId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the authority registry',
            },
            entityId: {
              type: 'string',
              description: 'DID of the recognized entity',
            },
            action: {
              type: 'string',
              description: 'Action scope (govern, recognize)',
            },
            resource: {
              type: 'string',
              description: 'Resource scope',
            },
            recognized: {
              type: 'boolean',
              description: 'Recognition status',
            },
            validFrom: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Start of validity period',
            },
            validUntil: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'End of validity period',
            },
            metadata: {
              type: 'object',
              nullable: true,
              description: 'Additional metadata',
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
            authority: {
              type: 'object',
              description: 'Authority registry details',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                ecosystemDid: { type: 'string' },
              },
            },
          },
        },
        TRQPAuthorizationRequest: {
          type: 'object',
          description: 'TRQP Authorization Query Request',
          required: ['entity_id', 'authority_id', 'action', 'resource'],
          properties: {
            entity_id: {
              type: 'string',
              description: 'DID of the entity being queried',
              example: 'did:web:university.edu',
            },
            authority_id: {
              type: 'string',
              description: 'DID of the authority (ecosystem)',
              example: 'did:web:education-trust.org',
            },
            action: {
              type: 'string',
              description: 'Action to check (issue, verify)',
              example: 'issue',
            },
            resource: {
              type: 'string',
              description: 'Resource/credential type',
              example: 'UniversityDegree',
            },
            context: {
              type: 'object',
              properties: {
                time: {
                  type: 'string',
                  format: 'date-time',
                  description: 'Time for validity check (RFC3339)',
                },
              },
            },
          },
        },
        TRQPAuthorizationResponse: {
          type: 'object',
          description: 'TRQP Authorization Query Response',
          properties: {
            entity_id: { type: 'string' },
            authority_id: { type: 'string' },
            action: { type: 'string' },
            resource: { type: 'string' },
            authorized: { type: 'boolean' },
            time_requested: { type: 'string', format: 'date-time' },
            time_evaluated: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            context: { type: 'object' },
          },
        },
        TRQPRecognitionRequest: {
          type: 'object',
          description: 'TRQP Recognition Query Request',
          required: ['entity_id', 'authority_id', 'action', 'resource'],
          properties: {
            entity_id: {
              type: 'string',
              description: 'DID of the entity (another authority)',
              example: 'did:web:other-registry.org',
            },
            authority_id: {
              type: 'string',
              description: 'DID of the recognizing authority',
              example: 'did:web:our-registry.org',
            },
            action: {
              type: 'string',
              description: 'Action scope (recognize, govern)',
              example: 'govern',
            },
            resource: {
              type: 'string',
              description: 'Resource scope',
              example: 'professional-licenses',
            },
            context: {
              type: 'object',
              properties: {
                time: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
        TRQPRecognitionResponse: {
          type: 'object',
          description: 'TRQP Recognition Query Response',
          properties: {
            entity_id: { type: 'string' },
            authority_id: { type: 'string' },
            action: { type: 'string' },
            resource: { type: 'string' },
            recognized: { type: 'boolean' },
            time_requested: { type: 'string', format: 'date-time' },
            time_evaluated: { type: 'string', format: 'date-time' },
            message: { type: 'string' },
            context: { type: 'object' },
          },
        },
        TRQPMetadataResponse: {
          type: 'object',
          description: 'TRQP Registry Metadata Response',
          properties: {
            name: {
              type: 'string',
              description: 'Registry name',
              example: 'ToIP Trust Registry v2',
            },
            version: {
              type: 'string',
              description: 'Registry version (semver)',
              example: '2.0.0',
            },
            protocol: {
              type: 'string',
              description: 'Protocol name and version',
              example: 'ToIP Trust Registry Query Protocol v2',
            },
            specification: {
              type: 'string',
              format: 'uri',
              description: 'URL to TRQP specification',
              example: 'https://trustoverip.github.io/tswg-trust-registry-protocol/',
            },
            description: {
              type: 'string',
              description: 'Registry description',
              example: 'A verifiable credentials trust registry implementing TRQP v2 specification',
            },
            endpoints: {
              type: 'object',
              description: 'Available API endpoints',
              properties: {
                authorization: {
                  type: 'string',
                  description: 'Authorization query endpoint',
                  example: '/v2/authorization',
                },
                recognition: {
                  type: 'string',
                  description: 'Recognition query endpoint',
                  example: '/v2/recognition',
                },
                metadata: {
                  type: 'string',
                  description: 'Metadata endpoint',
                  example: '/v2/metadata',
                },
                public: {
                  type: 'object',
                  description: 'Public endpoints (no auth)',
                  properties: {
                    registries: { type: 'string', example: '/v2/public/registries' },
                    issuers: { type: 'string', example: '/v2/public/issuers' },
                    verifiers: { type: 'string', example: '/v2/public/verifiers' },
                    schemas: { type: 'string', example: '/v2/public/schemas' },
                    lookupIssuer: { type: 'string', example: '/v2/public/lookup/issuer/{did}' },
                    lookupVerifier: { type: 'string', example: '/v2/public/lookup/verifier/{did}' },
                  },
                },
                management: {
                  type: 'object',
                  description: 'Management endpoints (auth required)',
                  properties: {
                    trustFrameworks: { type: 'string', example: '/v2/trust-frameworks' },
                    registries: { type: 'string', example: '/v2/registries' },
                    schemas: { type: 'string', example: '/v2/schemas' },
                    issuers: { type: 'string', example: '/v2/issuers' },
                    verifiers: { type: 'string', example: '/v2/verifiers' },
                    recognitions: { type: 'string', example: '/v2/recognitions' },
                    auditLog: { type: 'string', example: '/v2/audit-log' },
                  },
                },
              },
            },
            supportedActions: {
              type: 'array',
              description: 'TRQP actions supported by this registry',
              items: {
                type: 'string',
                enum: ['issue', 'verify', 'recognize', 'govern', 'delegate'],
              },
              example: ['issue', 'verify', 'recognize', 'govern', 'delegate'],
            },
            supportedDIDMethods: {
              type: 'array',
              description: 'DID methods supported by this registry',
              items: {
                type: 'string',
              },
              example: ['web', 'key', 'indy', 'ion', 'ethr', 'sov'],
            },
            features: {
              type: 'object',
              description: 'Feature flags indicating registry capabilities',
              properties: {
                authorization: {
                  type: 'boolean',
                  description: 'Authorization queries supported',
                  example: true,
                },
                recognition: {
                  type: 'boolean',
                  description: 'Recognition queries supported',
                  example: true,
                },
                delegation: {
                  type: 'boolean',
                  description: 'Issuer delegation supported',
                  example: true,
                },
                federation: {
                  type: 'boolean',
                  description: 'Cross-registry federation supported',
                  example: true,
                },
                signedEntries: {
                  type: 'boolean',
                  description: 'Cryptographic signatures on entries',
                  example: true,
                },
                auditLog: {
                  type: 'boolean',
                  description: 'Audit logging enabled',
                  example: true,
                },
                publicTrustedList: {
                  type: 'boolean',
                  description: 'Public trusted list available',
                  example: true,
                },
                didResolution: {
                  type: 'boolean',
                  description: 'DID resolution service available',
                  example: true,
                },
                caching: {
                  type: 'boolean',
                  description: 'Response caching enabled',
                  example: true,
                },
                rateLimiting: {
                  type: 'boolean',
                  description: 'Rate limiting enabled',
                  example: true,
                },
              },
            },
            documentation: {
              type: 'string',
              format: 'uri',
              description: 'URL to API documentation',
              example: 'http://localhost:3000/api-docs',
            },
            contact: {
              type: 'object',
              description: 'Contact information',
              properties: {
                name: {
                  type: 'string',
                  example: 'Technical Team',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'support@trustregistry.example.com',
                },
              },
            },
            status: {
              type: 'string',
              description: 'Service operational status',
              enum: ['operational', 'maintenance', 'degraded'],
              example: 'operational',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current server timestamp (ISO 8601)',
              example: '2024-11-27T10:30:00Z',
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoints' },
      {
        name: 'TRQP',
        description: 'TRQP v2 Protocol - Authorization, Recognition & Metadata (Public)',
      },
      {
        name: 'Public - Trusted List',
        description: 'Public trusted list endpoints - EU EUTL style (No auth required)',
      },
      { name: 'Trust Frameworks', description: 'Governance framework management' },
      { name: 'Trust Registries', description: 'Registry management with ecosystem DID' },
      { name: 'Credential Schemas', description: 'Credential type definitions' },
      { name: 'Issuers', description: 'Issuer registration & management' },
      { name: 'Verifiers', description: 'Verifier registration & management' },
      { name: 'Delegations', description: 'Issuer delegation chains' },
      { name: 'Recognitions', description: 'Inter-registry recognition (Admin)' },
      { name: 'Query', description: 'Legacy query API' },
      { name: 'API Keys', description: 'API key management (Admin)' },
      { name: 'Audit', description: 'Audit logs (Admin)' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
