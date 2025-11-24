/**
 * Common type definitions for ToIP Trust Registry v2
 */

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
  version: string;
}

// Environment variables
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  API_VERSION: string;
  API_BASE_PATH: string;
  API_KEY_SALT_ROUNDS: number;
  JWT_SECRET: string;
  LOG_LEVEL: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}
