
-- Database initialization script for GRC Management System
-- This script creates the database and user for local development

-- Create database
CREATE DATABASE grc_management;

-- Create user with password (change password for production)
CREATE USER grc_user WITH PASSWORD 'grc_password';

-- Connect to the new database to set permissions
\c grc_management

-- Grant database privileges
GRANT ALL PRIVILEGES ON DATABASE grc_management TO grc_user;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO grc_user;
GRANT CREATE ON SCHEMA public TO grc_user;
GRANT USAGE ON SCHEMA public TO grc_user;

-- Grant privileges on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO grc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO grc_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO grc_user;

-- Ensure future tables have correct privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO grc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO grc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO grc_user;

-- Make grc_user the owner of the public schema
ALTER SCHEMA public OWNER TO grc_user;
