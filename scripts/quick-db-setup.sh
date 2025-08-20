#!/bin/bash

# Quick Database Setup Script
# Usage: DB_HOST=localhost DB_PORT=5432 DB_NAME=mydb DB_USER=myuser DB_PASSWORD=mypass ./scripts/quick-db-setup.sh

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Set defaults or use environment variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"grc_management"}
DB_USER=${DB_USER:-"grc_user"}
DB_PASSWORD=${DB_PASSWORD:-"grc_password"}

print_status "Setting up database with:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Create user and database
print_status "Creating database user and database..."
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
        CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    END IF;
END
\$\$;

-- Drop and create database
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Connect to database and set permissions
\c $DB_NAME

GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER SCHEMA public OWNER TO $DB_USER;
EOF

# Update .env file
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
print_status "Updating .env file..."

# Backup and update .env
cp .env .env.backup.$(date +%s) 2>/dev/null || true

# Update or add DATABASE_URL
if grep -q "^#\?DATABASE_URL=" .env 2>/dev/null; then
    sed -i "s|^#\?DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
else
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

# Set other required variables if not present
grep -q "^SESSION_SECRET=" .env || echo "SESSION_SECRET=\"$(openssl rand -base64 32)\"" >> .env
grep -q "^NODE_ENV=" .env || echo "NODE_ENV=development" >> .env
grep -q "^PORT=" .env || echo "PORT=5000" >> .env

print_success "Environment configured"

# Install dependencies and setup schema
print_status "Setting up database schema..."
npm install --silent
npm run db:push
npm run db:seed

print_success "🎉 Database setup complete!"
print_status "DATABASE_URL: $DATABASE_URL"
print_status "Start the app with: npm run dev"
