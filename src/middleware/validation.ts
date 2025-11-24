/**
 * Validation Middleware
 * ToIP Trust Registry v2 Backend
 *
 * JSON Schema validation using Ajv
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Request, Response, NextFunction } from 'express';
import Ajv, { JSONSchemaType, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a JSON schema
 */
export function validate<T>(
  schema: JSONSchemaType<T>
): (req: Request, res: Response, next: NextFunction) => void {
  const validateFn = ajv.compile(schema);

  return (req: Request, res: Response, next: NextFunction): void => {
    const valid = validateFn(req.body);

    if (!valid) {
      const errors = formatValidationErrors(validateFn.errors || []);
      res.status(400).json({
        error: 'Validation Error',
        message: 'Request body validation failed',
        details: errors,
      });
      return;
    }

    next();
  };
}

/**
 * Format Ajv validation errors into a more readable format
 */
function formatValidationErrors(errors: ErrorObject[]): Array<{
  field: string;
  message: string;
}> {
  return errors.map((error) => ({
    field: error.instancePath || error.params.missingProperty || 'unknown',
    message: error.message || 'Validation failed',
  }));
}
