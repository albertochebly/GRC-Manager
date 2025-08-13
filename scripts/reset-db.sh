
#!/bin/bash

# Database reset script - WARNING: This will delete all data!

echo "⚠️  WARNING: This will completely reset the database and delete all data!"
read -p "Are you sure you want to continue? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo "🗑️  Dropping and recreating database..."

# Drop and recreate database with proper permissions
sudo -u postgres psql << 'EOF'
DROP DATABASE IF EXISTS grc_management;
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

echo "🔄 Pushing schema to database..."
npm run db:push

echo "🌱 Seeding initial data..."
npm run db:seed

echo "✅ Database reset completed!"
