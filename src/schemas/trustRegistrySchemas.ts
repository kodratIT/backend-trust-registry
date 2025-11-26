/**
 * Trust Registry JSON Schemas
 * ToIP Trust Registry v2 Backend
 *
 * Validation schemas for trust registry operations
 */

import { JSONSchemaType } from 'ajv';

/**
 * Create Trust Registry Request Body
 */
export interface CreateTrustRegistryBody {
  name: string;
  description?: string;
  trustFrameworkId?: string;
  ecosystemDid: string;
  governanceAuthority?: string;
  status?: string;
}

export const createTrustRegistrySchema: JSONSchemaType<CreateTrustRegistryBody> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    description: {
      type: 'string',
      nullable: true,
    },
    trustFrameworkId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
    },
    ecosystemDid: {
      type: 'string',
      minLength: 1,
      maxLength: 500,
      pattern: '^did:[a-z0-9]+:.+$',
    },
    governanceAuthority: {
      type: 'string',
      maxLength: 500,
      nullable: true,
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'deprecated'],
      nullable: true,
    },
  },
  required: ['name', 'ecosystemDid'],
  additionalProperties: false,
};

/**
 * Update Trust Registry Request Body
 */
export interface UpdateTrustRegistryBody {
  name?: string;
  description?: string | null;
  trustFrameworkId?: string | null;
  governanceAuthority?: string | null;
  status?: string;
}

export const updateTrustRegistrySchema: JSONSchemaType<UpdateTrustRegistryBody> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      nullable: true,
    },
    description: {
      type: 'string',
      nullable: true,
    },
    trustFrameworkId: {
      type: 'string',
      format: 'uuid',
      nullable: true,
    },
    governanceAuthority: {
      type: 'string',
      maxLength: 500,
      nullable: true,
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'deprecated'],
      nullable: true,
    },
  },
  required: [],
  additionalProperties: false,
};
