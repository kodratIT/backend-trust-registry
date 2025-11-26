/**
 * Credential Schema JSON Schemas
 * ToIP Trust Registry v2 Backend
 *
 * Validation schemas for credential schema operations
 */

import { JSONSchemaType } from 'ajv';

/**
 * Create Credential Schema Request Body
 */
export interface CreateCredentialSchemaBody {
  registryId: string;
  trustFrameworkId?: string;
  name: string;
  version: string;
  type: string;
  jsonSchema: object;
  contexts?: string[];
  jurisdictions?: string[];
  issuerMode: string;
  verifierMode: string;
}

export const createCredentialSchemaSchema: JSONSchemaType<CreateCredentialSchemaBody> = {
  type: 'object',
  properties: {
    registryId: {
      type: 'string',
      format: 'uuid',
    },
    trustFrameworkId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    version: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$',
    },
    type: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
    },
    jsonSchema: {
      type: 'object',
      additionalProperties: true,
    },
    contexts: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    jurisdictions: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    issuerMode: {
      type: 'string',
      enum: ['OPEN', 'ECOSYSTEM', 'GRANTOR'],
    },
    verifierMode: {
      type: 'string',
      enum: ['OPEN', 'ECOSYSTEM', 'GRANTOR'],
    },
  },
  required: ['registryId', 'name', 'version', 'type', 'jsonSchema', 'issuerMode', 'verifierMode'],
  additionalProperties: false,
};

/**
 * Update Credential Schema Request Body
 */
export interface UpdateCredentialSchemaBody {
  name?: string;
  version?: string;
  type?: string;
  jsonSchema?: object;
  contexts?: string[] | null;
  jurisdictions?: string[] | null;
  issuerMode?: string;
  verifierMode?: string;
  trustFrameworkId?: string | null;
}

export const updateCredentialSchemaSchema: JSONSchemaType<UpdateCredentialSchemaBody> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      nullable: true,
    },
    version: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$',
      nullable: true,
    },
    type: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
      nullable: true,
    },
    jsonSchema: {
      type: 'object',
      additionalProperties: true,
      nullable: true,
    },
    contexts: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    jurisdictions: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    issuerMode: {
      type: 'string',
      enum: ['OPEN', 'ECOSYSTEM', 'GRANTOR'],
      nullable: true,
    },
    verifierMode: {
      type: 'string',
      enum: ['OPEN', 'ECOSYSTEM', 'GRANTOR'],
      nullable: true,
    },
    trustFrameworkId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
    },
  },
  required: [],
  additionalProperties: false,
};
