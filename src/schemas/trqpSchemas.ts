/**
 * TRQP Schemas
 * ToIP Trust Registry v2 Backend
 *
 * JSON Schema definitions and TypeScript types for TRQP v2 protocol
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Import JSON schemas
import authorizationRequestSchema from './trqp/authorization_request.json';
import authorizationResponseSchema from './trqp/authorization_response.json';
import recognitionRequestSchema from './trqp/recognition_request.json';
import recognitionResponseSchema from './trqp/recognition_response.json';

// Initialize AJV with formats
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Compile validators
export const validateAuthorizationRequest = ajv.compile(authorizationRequestSchema);
export const validateAuthorizationResponse = ajv.compile(authorizationResponseSchema);
export const validateRecognitionRequest = ajv.compile(recognitionRequestSchema);
export const validateRecognitionResponse = ajv.compile(recognitionResponseSchema);

// ============================================
// TypeScript Interfaces
// ============================================

/**
 * TRQP Context object
 */
export interface TRQPContext {
  time?: string;
  locator?: string;
  [key: string]: string | undefined;
}

/**
 * TRQP Authorization Request
 */
export interface TRQPAuthorizationRequest {
  entity_id: string;
  authority_id: string;
  action: string;
  resource: string;
  context?: TRQPContext;
}

/**
 * TRQP Authorization Response
 */
export interface TRQPAuthorizationResponse {
  entity_id: string;
  authority_id: string;
  action: string;
  resource: string;
  authorized: boolean;
  time_requested?: string;
  time_evaluated: string;
  message?: string;
  context?: TRQPContext;
}


/**
 * TRQP Recognition Request
 */
export interface TRQPRecognitionRequest {
  entity_id: string;
  authority_id: string;
  action: string;
  resource: string;
  context?: TRQPContext;
}

/**
 * TRQP Recognition Response
 */
export interface TRQPRecognitionResponse {
  entity_id: string;
  authority_id: string;
  action: string;
  resource: string;
  recognized: boolean;
  time_requested?: string;
  time_evaluated: string;
  message?: string;
  context?: TRQPContext;
}

// ============================================
// TRQP Action Constants
// ============================================

export const TRQP_ACTIONS = {
  ISSUE: 'issue',
  VERIFY: 'verify',
  RECOGNIZE: 'recognize',
  DELEGATE: 'delegate',
  GOVERN: 'govern',
} as const;

export type TRQPAction = (typeof TRQP_ACTIONS)[keyof typeof TRQP_ACTIONS];

/**
 * Check if action is valid TRQP action
 */
export function isValidAction(action: string): boolean {
  return Object.values(TRQP_ACTIONS).includes(action as TRQPAction);
}

/**
 * Map TRQP action to entity type
 */
export function mapActionToEntityType(action: string): 'issuer' | 'verifier' | null {
  switch (action.toLowerCase()) {
    case TRQP_ACTIONS.ISSUE:
      return 'issuer';
    case TRQP_ACTIONS.VERIFY:
      return 'verifier';
    default:
      return null;
  }
}

/**
 * Map entity type to TRQP action
 */
export function mapEntityTypeToAction(entityType: string): string {
  switch (entityType.toLowerCase()) {
    case 'issuer':
      return TRQP_ACTIONS.ISSUE;
    case 'verifier':
      return TRQP_ACTIONS.VERIFY;
    default:
      return entityType;
  }
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Format AJV validation errors to readable string
 */
export function formatValidationErrors(
  errors: typeof validateAuthorizationRequest.errors
): string {
  if (!errors || errors.length === 0) {
    return 'Unknown validation error';
  }

  return errors
    .map((err) => {
      const field = err.instancePath
        ? err.instancePath.replace('/', '')
        : (err.params as { missingProperty?: string } | undefined)?.missingProperty;
      return `${field || 'request'}: ${err.message}`;
    })
    .join(', ');
}

// Export schemas for reference
export const schemas = {
  authorizationRequest: authorizationRequestSchema,
  authorizationResponse: authorizationResponseSchema,
  recognitionRequest: recognitionRequestSchema,
  recognitionResponse: recognitionResponseSchema,
};
