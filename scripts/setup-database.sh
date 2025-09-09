#!/bin/bash

# Database Setup Script for GRC Management System
# This script reads configuration from .env file and sets up the complete database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f ".env" ]; then
    print_error "Please run this script from the AuditAlign project root directory"
    exit 1
fi

print_status "Setting up GRC Management System Database..."

# Source .env file to get configuration
if [ -f .env ]; then
    print_status "Loading configuration from .env file..."
    
    # Extract database configuration from .env file (handle commented and uncommented lines)
    DB_HOST=$(grep -E "^#?\s*DB_HOST=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_PORT=$(grep -E "^#?\s*DB_PORT=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_NAME=$(grep -E "^#?\s*DB_NAME=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_USER=$(grep -E "^#?\s*DB_USER=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_PASSWORD=$(grep -E "^#?\s*DB_PASSWORD=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    
    # Set defaults if not found in .env
    DB_HOST=${DB_HOST:-"localhost"}
    DB_PORT=${DB_PORT:-"5432"}
    DB_NAME=${DB_NAME:-"grc_management"}
    DB_USER=${DB_USER:-"grc_user"}
    DB_PASSWORD=${DB_PASSWORD:-"grc_password"}
    
    print_status "Database configuration:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo "  Password: [HIDDEN]"
else
    print_error ".env file not found!"
    exit 1
fi

# Check if PostgreSQL is installed and running
if ! command_exists psql; then
    print_error "PostgreSQL client (psql) not found. Please install PostgreSQL."
    print_status "Installation commands:"
    print_status "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    print_status "  macOS: brew install postgresql"
    print_status "  CentOS/RHEL: sudo yum install postgresql postgresql-server"
    exit 1
fi

# Check if PostgreSQL server is running
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
    print_error "PostgreSQL server is not running on $DB_HOST:$DB_PORT"
    print_status "Please start PostgreSQL service:"
    print_status "  Ubuntu/Debian: sudo systemctl start postgresql"
    print_status "  macOS: brew services start postgresql"
    print_status "  CentOS/RHEL: sudo systemctl start postgresql"
    exit 1
fi

print_success "PostgreSQL server is running"

# Check if database user exists
print_status "Checking if database user '$DB_USER' exists..."
if sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -t -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
    print_warning "Database user '$DB_USER' already exists"
else
    print_status "Creating database user '$DB_USER'..."
    sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    print_success "Database user '$DB_USER' created"
fi

# Check if database exists
print_status "Checking if database '$DB_NAME' exists..."
if sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
    print_warning "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate the database? This will delete all data! (y/N): " confirm
    if [[ $confirm == [yY] ]]; then
        print_status "Dropping existing database '$DB_NAME'..."
        sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        print_status "Creating database '$DB_NAME'..."
        sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
        print_success "Database '$DB_NAME' recreated"
    else
        print_status "Using existing database '$DB_NAME'"
    fi
else
    print_status "Creating database '$DB_NAME'..."
    sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    print_success "Database '$DB_NAME' created"
fi

# Set up database permissions
print_status "Setting up database permissions..."
sudo -u postgres psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" << EOF
-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT USAGE ON SCHEMA public TO $DB_USER;

-- Grant privileges on existing objects
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;

-- Make user the owner of the public schema
ALTER SCHEMA public OWNER TO $DB_USER;
EOF

print_success "Database permissions configured"

# Update .env file with proper DATABASE_URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
print_status "Updating .env file with DATABASE_URL..."

# Create a temporary .env file with updated DATABASE_URL
cp .env .env.backup
sed -i.tmp "s|^#\?\s*DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|g" .env

# If DATABASE_URL line doesn't exist, add it
if ! grep -q "DATABASE_URL=" .env; then
    echo "" >> .env
    echo "# Database Configuration" >> .env
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

print_success ".env file updated with DATABASE_URL"

# Push database schema using Drizzle
print_status "Installing dependencies..."
npm install --silent

print_status "Pushing database schema using Drizzle ORM..."
npm run db:push

print_success "Database schema created successfully"

# Seed initial data
print_status "Seeding initial data..."
npm run db:seed

print_success "Initial data seeded successfully"

# Seed framework data
if [ -f "scripts/seed-frameworks.ts" ]; then
    print_status "Seeding framework data..."
    npx tsx scripts/seed-frameworks.ts
    print_success "Framework data seeded successfully"
fi

# Seed framework templates
if [ -f "scripts/seed-frameworks-templates.ts" ]; then
    print_status "Seeding framework templates..."
    npx tsx scripts/seed-frameworks-templates.ts
    print_success "Framework templates seeded successfully"
fi

print_success "🎉 Database setup completed successfully!"
print_status "Database connection details:"
echo "  DATABASE_URL: $DATABASE_URL"
echo ""
print_status "You can now start the application with:"
echo "  npm run dev"
echo ""
print_status "Default admin login (if created by seed script):"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
print_warning "⚠️  Remember to change default passwords in production!"
