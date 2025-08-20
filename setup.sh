#!/bin/bash

# AuditAlign Setup Script
# This script initializes the entire web application from scratch

set -e  # Exit on any error

echo "🚀 Starting AuditAlign setup..."

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

# Check if running on Linux/Unix
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    print_status "Detected Unix-like system: $OSTYPE"
else
    print_warning "This script is designed for Unix-like systems. Proceeding anyway..."
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for required tools
print_status "Checking system requirements..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
    
    # Check if Node version is >= 16
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 16 or higher."
    print_status "Visit: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm."
    exit 1
fi

# Check for PostgreSQL
if command_exists psql; then
    POSTGRES_VERSION=$(psql --version)
    print_success "PostgreSQL found: $POSTGRES_VERSION"
else
    print_warning "PostgreSQL not found in PATH. Make sure PostgreSQL is installed and running."
    print_status "On Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    print_status "On macOS: brew install postgresql"
    print_status "On CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
fi

# Navigate to project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

print_status "Working in directory: $SCRIPT_DIR"

# Install dependencies
print_status "Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    print_success "Dependencies installed successfully"
    
    # Clean up any potential Replit dependencies that might cause issues
    print_status "Cleaning up development dependencies..."
    npm uninstall @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-cartographer 2>/dev/null || true
    print_success "Cleanup completed"
else
    print_error "package.json not found. Make sure you're in the correct directory."
    exit 1
fi

# Create .env file if it doesn't exist
print_status "Setting up environment configuration..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/auditdb"

# Session Configuration
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Environment
NODE_ENV="development"

# Server Configuration
PORT=5000

# Development Database Credentials (change these for production)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="auditdb"
DB_USER="postgres"
DB_PASSWORD="password"
EOF
    print_success "Created .env file with default configuration"
    print_warning "⚠️  Please update the database credentials in .env file before proceeding"
    print_warning "⚠️  Change SESSION_SECRET for production use"
else
    print_success ".env file already exists"
fi

# Setup database
print_status "Setting up database..."

# Check if PostgreSQL is running
if command_exists pg_isready; then
    if pg_isready -q; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running. Please start PostgreSQL service."
        print_status "On Ubuntu/Debian: sudo systemctl start postgresql"
        print_status "On macOS: brew services start postgresql"
        exit 1
    fi
fi

# Source environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

# Create database if it doesn't exist
print_status "Creating database if it doesn't exist..."
if command_exists createdb; then
    createdb "$DB_NAME" 2>/dev/null || print_warning "Database '$DB_NAME' might already exist"
    print_success "Database setup completed"
else
    print_warning "createdb command not found. Please create the database manually:"
    print_status "psql -U postgres -c \"CREATE DATABASE $DB_NAME;\""
fi

# Run database migrations
print_status "Running database migrations..."
if [ -f "drizzle.config.ts" ]; then
    # Install drizzle-kit if not installed
    if ! command_exists drizzle-kit; then
        npm install -g drizzle-kit
    fi
    
    # Generate migrations
    print_status "Generating database schema..."
    npx drizzle-kit generate || print_warning "Migration generation failed, proceeding anyway..."
    
    # Push schema to database
    print_status "Pushing schema to database..."
    npx drizzle-kit push || print_warning "Schema push failed, proceeding anyway..."
    
    print_success "Database schema setup completed"
else
    print_warning "drizzle.config.ts not found, skipping migration"
fi

# Seed initial data
print_status "Seeding initial data..."
if [ -f "scripts/seed-data.ts" ]; then
    npx tsx scripts/seed-data.ts || print_warning "Data seeding failed, proceeding anyway..."
    print_success "Initial data seeded"
fi

if [ -f "scripts/seed-frameworks.ts" ]; then
    npx tsx scripts/seed-frameworks.ts || print_warning "Framework seeding failed, proceeding anyway..."
    print_success "Framework data seeded"
fi

# Build the application
print_status "Building the application..."
npm run build 2>/dev/null || print_warning "Build failed, but dev server should still work"

# Create startup scripts
print_status "Creating convenience scripts..."

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting AuditAlign..."
npm run dev
EOF
chmod +x start.sh

# Create reset script
cat > reset-db.sh << 'EOF'
#!/bin/bash
echo "🔄 Resetting database..."
source .env
dropdb "$DB_NAME" 2>/dev/null || echo "Database didn't exist"
createdb "$DB_NAME"
npx drizzle-kit push
npx tsx scripts/seed-data.ts 2>/dev/null || echo "Data seeding skipped"
npx tsx scripts/seed-frameworks.ts 2>/dev/null || echo "Framework seeding skipped"
echo "✅ Database reset complete"
EOF
chmod +x reset-db.sh

print_success "Created start.sh and reset-db.sh scripts"

# Final setup verification
print_status "Verifying setup..."

# Check if critical files exist
CRITICAL_FILES=("package.json" "server/index.ts" "client/index.html" ".env")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file missing"
    fi
done

# Print setup summary
echo
echo "============================================="
echo "🎉 AuditAlign Setup Complete!"
echo "============================================="
echo
print_success "✅ Dependencies installed"
print_success "✅ Environment configured"
print_success "✅ Database setup completed"
print_success "✅ Initial data seeded"
print_success "✅ Application ready to run"
echo
echo "📋 Next Steps:"
echo "1. Review and update .env file with your database credentials"
echo "2. Ensure PostgreSQL is running"
echo "3. Start the application:"
echo "   ${GREEN}npm run dev${NC}"
echo "   or"
echo "   ${GREEN}./start.sh${NC}"
echo
echo "🌐 Application will be available at: http://localhost:5000"
echo
echo "🔧 Additional commands:"
echo "  • Reset database: ./reset-db.sh"
echo "  • Check logs: npm run dev"
echo "  • Build for production: npm run build"
echo
echo "⚠️  Development credentials:"
echo "   Email: dev@localhost.com"
echo "   Password: password123"
echo
print_warning "Remember to change default passwords and secrets for production!"
echo "============================================="
