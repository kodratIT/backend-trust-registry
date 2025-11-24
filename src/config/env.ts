/**
 * Environment configuration and validation
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable schema
 */
interface EnvConfig {
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

/**
 * Validate required environment variables
 */
function validateEnv(): EnvConfig {
  const requiredVars = [
    'NODE_ENV',
    'PORT',
    'HOST',
    'DATABASE_URL',
    'REDIS_URL',
    'API_VERSION',
    'API_BASE_PATH',
    'API_KEY_SALT_ROUNDS',
    'JWT_SECRET',
    'LOG_LEVEL',
    'CORS_ORIGIN',
    'RATE_LIMIT_WINDOW_MS',
    'RATE_LIMIT_MAX_REQUESTS',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env file against .env.example`
    );
  }

  // Parse and validate types
  const config: EnvConfig = {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: parseInt(process.env.PORT as string, 10),
    HOST: process.env.HOST as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    REDIS_URL: process.env.REDIS_URL as string,
    API_VERSION: process.env.API_VERSION as string,
    API_BASE_PATH: process.env.API_BASE_PATH as string,
    API_KEY_SALT_ROUNDS: parseInt(process.env.API_KEY_SALT_ROUNDS as string, 10),
    JWT_SECRET: process.env.JWT_SECRET as string,
    LOG_LEVEL: process.env.LOG_LEVEL as string,
    CORS_ORIGIN: process.env.CORS_ORIGIN as string,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS as string, 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS as string, 10),
  };

  // Validate PORT
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(config.NODE_ENV)) {
    throw new Error(`NODE_ENV must be one of: ${validEnvs.join(', ')}`);
  }

  // Validate API_KEY_SALT_ROUNDS
  if (isNaN(config.API_KEY_SALT_ROUNDS) || config.API_KEY_SALT_ROUNDS < 10) {
    throw new Error('API_KEY_SALT_ROUNDS must be a number >= 10');
  }

  // Validate JWT_SECRET length
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  return config;
}

/**
 * Validated environment configuration
 */
export const env = validateEnv();

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test';
