#!/bin/bash

# Simple Admin User Creation Script for GRC Management System
# This script creates an admin user and organization directly in the database

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_status() {
    echo -e "${BLUE}🔄 $1${NC}"
}

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the AuditAlign project root directory"
    exit 1
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
    print_status "Loading database configuration from .env file..."
    
    # Extract database configuration
    DB_HOST=$(grep -E "^#?\s*DB_HOST=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_PORT=$(grep -E "^#?\s*DB_PORT=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_NAME=$(grep -E "^#?\s*DB_NAME=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_USER=$(grep -E "^#?\s*DB_USER=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    DB_PASSWORD=$(grep -E "^#?\s*DB_PASSWORD=" .env | tail -1 | sed 's/^#\s*//' | cut -d'=' -f2 | tr -d '"' | tr -d ' ')
    
    # Try to extract from DATABASE_URL if individual vars not found
    if [ -z "$DB_HOST" ]; then
        DATABASE_URL=$(grep -E "^DATABASE_URL=" .env | cut -d'=' -f2 | tr -d '"')
        if [ ! -z "$DATABASE_URL" ]; then
            # Parse DATABASE_URL: postgresql://user:pass@host:port/dbname
            DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
            DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
            DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:]*\):.*|\1|p')
            DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
            DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')
        fi
    fi
fi

# Set defaults if not found
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"grc_management"}
DB_USER=${DB_USER:-"grc_user"}
DB_PASSWORD=${DB_PASSWORD:-"grc_password"}

# Admin user configuration
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="User"
ADMIN_USERNAME="admin"
ORG_NAME="Default Organization"
ORG_DESCRIPTION="Default organization for admin user"

print_status "Creating admin user with the following details:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: $ADMIN_PASSWORD"
echo "  Name: $ADMIN_FIRST_NAME $ADMIN_LAST_NAME"
echo "  Organization: $ORG_NAME"
echo ""

# Check if required tools are available
if ! command -v psql >/dev/null 2>&1; then
    print_error "psql not found. Please install PostgreSQL client."
    exit 1
fi

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
    print_error "Python not found. Required for password hashing."
    exit 1
fi

# Hash the password
print_status "Hashing password..."
if command -v python3 >/dev/null 2>&1; then
    PASSWORD_HASH=$(python3 -c "
import bcrypt
password = '$ADMIN_PASSWORD'.encode('utf-8')
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode('utf-8'))
")
else
    PASSWORD_HASH=$(python -c "
import bcrypt
password = '$ADMIN_PASSWORD'.encode('utf-8')
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode('utf-8'))
")
fi

print_status "Creating admin user and organization in database..."

# Execute SQL to create admin user and organization
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
-- Create admin user and organization
DO \$\$
DECLARE
    admin_user_id VARCHAR;
    admin_org_id UUID;
BEGIN
    -- Insert or update admin user
    INSERT INTO users (email, password_hash, first_name, last_name, username, created_at, updated_at)
    VALUES ('$ADMIN_EMAIL', '$PASSWORD_HASH', '$ADMIN_FIRST_NAME', '$ADMIN_LAST_NAME', '$ADMIN_USERNAME', NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        username = EXCLUDED.username,
        updated_at = NOW();

    -- Get the user ID
    SELECT id INTO admin_user_id FROM users WHERE email = '$ADMIN_EMAIL';

    -- Check if user already has an organization
    SELECT id INTO admin_org_id FROM organizations WHERE created_by = admin_user_id LIMIT 1;
    
    IF admin_org_id IS NULL THEN
        -- Create new organization
        INSERT INTO organizations (name, description, created_by, created_at, updated_at)
        VALUES ('$ORG_NAME', '$ORG_DESCRIPTION', admin_user_id, NOW(), NOW())
        RETURNING id INTO admin_org_id;
    ELSE
        -- Update existing organization
        UPDATE organizations 
        SET name = '$ORG_NAME', 
            description = '$ORG_DESCRIPTION', 
            updated_at = NOW()
        WHERE id = admin_org_id;
    END IF;

    -- Insert or update organization user relationship
    -- Check if relationship already exists
    IF EXISTS (SELECT 1 FROM organization_users WHERE user_id = admin_user_id AND organization_id = admin_org_id) THEN
        -- Update existing relationship
        UPDATE organization_users 
        SET role = 'admin', 
            invited_by = admin_user_id
        WHERE user_id = admin_user_id AND organization_id = admin_org_id;
    ELSE
        -- Insert new relationship
        INSERT INTO organization_users (organization_id, user_id, role, invited_by, created_at)
        VALUES (admin_org_id, admin_user_id, 'admin', admin_user_id, NOW());
    END IF;
END
\$\$;

-- Verify the setup
SELECT 
    'SUCCESS: Admin user and organization created!' as status,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    o.name as organization_name,
    ou.role
FROM users u
JOIN organization_users ou ON u.id = ou.user_id
JOIN organizations o ON ou.organization_id = o.id
WHERE u.email = '$ADMIN_EMAIL';
EOF

if [ $? -eq 0 ]; then
    print_success "Admin user and organization created successfully!"
    echo ""
    print_status "📋 Login Details:"
    echo "   Email: $ADMIN_EMAIL"
    echo "   Password: $ADMIN_PASSWORD"
    echo "   Organization: $ORG_NAME"
    echo ""
    print_warning "IMPORTANT: Change the default password after first login!"
    echo ""
    print_status "You can now start the application with: npm run dev"
else
    print_error "Failed to create admin user. Check your database connection and credentials."
    exit 1
fi
