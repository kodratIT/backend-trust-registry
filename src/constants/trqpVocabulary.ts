/**
 * TRQP Vocabulary Constants
 * ToIP Trust Registry v2 Backend
 *
 * Standard action and resource vocabulary for TRQP v2 protocol
 */

// ============================================
// TRQP Actions
// ============================================

/**
 * Standard TRQP Actions
 */
export const TRQP_ACTIONS = {
  /** Authorize entity to issue credentials */
  ISSUE: 'issue',
  /** Authorize entity to verify credentials */
  VERIFY: 'verify',
  /** Recognize another authority */
  RECOGNIZE: 'recognize',
  /** Delegate authority to another entity */
  DELEGATE: 'delegate',
  /** Governance authority over a domain */
  GOVERN: 'govern',
} as const;

export type TRQPAction = (typeof TRQP_ACTIONS)[keyof typeof TRQP_ACTIONS];

/**
 * Action descriptions for documentation
 */
export const ACTION_DESCRIPTIONS: Record<TRQPAction, string> = {
  [TRQP_ACTIONS.ISSUE]: 'Authorize entity to issue credentials of a specific type',
  [TRQP_ACTIONS.VERIFY]: 'Authorize entity to verify credentials of a specific type',
  [TRQP_ACTIONS.RECOGNIZE]: 'Recognize another authority as a peer',
  [TRQP_ACTIONS.DELEGATE]: 'Delegate authority to another entity',
  [TRQP_ACTIONS.GOVERN]: 'Governance authority over a specific domain',
};

/**
 * Check if action is a valid TRQP action
 */
export function isValidTRQPAction(action: string): action is TRQPAction {
  return Object.values(TRQP_ACTIONS).includes(action as TRQPAction);
}

/**
 * Get all valid TRQP actions
 */
export function getAllTRQPActions(): TRQPAction[] {
  return Object.values(TRQP_ACTIONS);
}

// ============================================
// Entity Type Mapping
// ============================================

/**
 * Map TRQP action to internal entity type
 */
export function actionToEntityType(action: string): 'issuer' | 'verifier' | null {
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
 * Map internal entity type to TRQP action
 */
export function entityTypeToAction(entityType: string): TRQPAction | string {
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
// Recognition Actions
// ============================================

/**
 * Actions valid for recognition queries
 */
export const RECOGNITION_ACTIONS = [
  TRQP_ACTIONS.RECOGNIZE,
  TRQP_ACTIONS.GOVERN,
  TRQP_ACTIONS.DELEGATE,
] as const;

/**
 * Check if action is valid for recognition
 */
export function isRecognitionAction(action: string): boolean {
  return (RECOGNITION_ACTIONS as readonly string[]).includes(action);
}

// ============================================
// Authorization Actions
// ============================================

/**
 * Actions valid for authorization queries
 */
export const AUTHORIZATION_ACTIONS = [
  TRQP_ACTIONS.ISSUE,
  TRQP_ACTIONS.VERIFY,
] as const;

/**
 * Check if action is valid for authorization
 */
export function isAuthorizationAction(action: string): boolean {
  return (AUTHORIZATION_ACTIONS as readonly string[]).includes(action);
}
