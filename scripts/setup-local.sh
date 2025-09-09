
#!/bin/bash

# Local development setup script for GRC Management System

echo "🚀 Setting up GRC Management System for local development..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Start PostgreSQL service if not running
if ! pg_isready -q; then
    echo "📦 Starting PostgreSQL service..."
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v brew &> /dev/null; then
        brew services start postgresql
    else
        echo "⚠️  Please start PostgreSQL service manually"
    fi
fi

# Drop existing database if it exists and recreate with proper permissions
echo "🗄️  Setting up database..."
sudo -u postgres psql << 'EOF'
-- Drop database if it exists
DROP DATABASE IF EXISTS grc_management;
DROP USER IF EXISTS grc_user;

-- Create user first
CREATE USER grc_user WITH PASSWORD 'grc_password' CREATEDB;

-- Create database with grc_user as owner
CREATE DATABASE grc_management OWNER grc_user;

-- Connect to the database and set up permissions
\c grc_management

-- Grant all privileges on public schema
GRANT ALL PRIVILEGES ON SCHEMA public TO grc_user;
GRANT CREATE ON SCHEMA public TO grc_user;
GRANT USAGE ON SCHEMA public TO grc_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO grc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO grc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO grc_user;

-- Make grc_user the owner of the public schema
ALTER SCHEMA public OWNER TO grc_user;
EOF

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOL
# Database Configuration
DATABASE_URL="postgresql://grc_user:grc_password@localhost:5432/grc_management"

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Secret (change for production)
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Auth Configuration (if using external auth)
# OAUTH_CLIENT_ID=your_oauth_client_id
# OAUTH_CLIENT_SECRET=your_oauth_client_secret
EOL
    echo "✅ Created .env file with default configuration"
else
    echo "⚠️  .env file already exists, skipping creation"
fi

# Push database schema
echo "🔄 Pushing database schema..."
npm run db:push

# Seed initial data
echo "🌱 Seeding initial data..."
npm run db:seed

echo ""
echo "🎉 Setup complete! To start the application:"
echo "   npm run dev"
echo ""
echo "The application will be available at: http://localhost:5000"
echo ""
echo "📝 Database credentials:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: grc_management"
echo "   Username: grc_user"
echo "   Password: grc_password"
