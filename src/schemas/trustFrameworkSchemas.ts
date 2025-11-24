/**
 * Trust Framework JSON Schemas
 * ToIP Trust Registry v2 Backend
 *
 * Validation schemas for trust framework operations
 */

import { JSONSchemaType } from 'ajv';

/**
 * Create Trust Framework Request Body
 */
export interface CreateTrustFrameworkBody {
  name: string;
  version: string;
  description?: string;
  governanceFrameworkUrl?: string;
  legalAgreements?: string[];
  jurisdictions?: string[];
  contexts?: string[];
  status?: string;
}

export const createTrustFrameworkSchema: JSONSchemaType<CreateTrustFrameworkBody> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
    },
    version: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
    },
    description: {
      type: 'string',
      nullable: true,
    },
    governanceFrameworkUrl: {
      type: 'string',
      format: 'uri',
      nullable: true,
    },
    legalAgreements: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
      },
      nullable: true,
    },
    jurisdictions: {
      type: 'array',
      items: {
        type: 'string',
      },
      nullable: true,
    },
    contexts: {
      type: 'array',
      items: {
        type: 'string',
      },
      nullable: true,
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'deprecated'],
      nullable: true,
    },
  },
  required: ['name', 'version'],
  additionalProperties: false,
};

/**
 * Update Trust Framework Request Body
 */
export interface UpdateTrustFrameworkBody {
  name?: string;
  version?: string;
  description?: string | null;
  governanceFrameworkUrl?: string | null;
  legalAgreements?: string[] | null;
  jurisdictions?: string[] | null;
  contexts?: string[] | null;
  status?: string;
}

export const updateTrustFrameworkSchema: JSONSchemaType<UpdateTrustFrameworkBody> = {
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
      nullable: true,
    },
    description: {
      type: 'string',
      nullable: true,
    },
    governanceFrameworkUrl: {
      type: 'string',
      format: 'uri',
      nullable: true,
    },
    legalAgreements: {
      type: 'array',
      items: {
        type: 'string',
        format: 'uri',
      },
      nullable: true,
    },
    jurisdictions: {
      type: 'array',
      items: {
        type: 'string',
      },
      nullable: true,
    },
    contexts: {
      type: 'array',
      items: {
        type: 'string',
      },
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
