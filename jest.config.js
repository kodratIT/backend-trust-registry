/**
 * Jest Configuration
 * ToIP Trust Registry v2 Backend
 */

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Test environment
  testEnvironment: 'node',

  // Root directory
  roots: ['<rootDir>/src'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$$': 'ts-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Transform ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@noble)/)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Verbose output
  verbose: true,

  // Detect open handles
  detectOpenHandles: true,

  // Force exit after tests complete
  forceExit: true,

  // Timeout for tests (10 seconds)
  testTimeout: 10000,
};
