
#!/bin/bash

# Database reset script - WARNING: This will delete all data!

echo "⚠️  WARNING: This will completely reset the database and delete all data!"
read -p "Are you sure you want to continue? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo "🗑️  Dropping and recreating database..."

# Drop and recreate database
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS grc_management;
CREATE DATABASE grc_management;
GRANT ALL PRIVILEGES ON DATABASE grc_management TO grc_user;
EOF

echo "🔄 Pushing schema to database..."
npm run db:push

echo "🌱 Seeding initial data..."
npm run db:seed

echo "✅ Database reset completed!"
