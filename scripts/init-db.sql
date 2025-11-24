-- Database Initialization Script
-- ToIP Trust Registry v2 Backend

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if not exists (handled by POSTGRES_DB env var)
-- This script runs after database creation

-- Set timezone
SET timezone = 'UTC';

-- Create custom types (will be used by Prisma migrations)
-- These are placeholders, actual schema will be created by Prisma

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Database initialized successfully';
  RAISE NOTICE 'Database: %', current_database();
  RAISE NOTICE 'Version: %', version();
  RAISE NOTICE 'Timezone: %', current_setting('TIMEZONE');
END $$;
