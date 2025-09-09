#!/bin/bash

# Git Setup and Push Script for GRC Manager
# This script initializes git, connects to your GitHub repo, and pushes the code

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

# Repository configuration
REPO_URL="https://github.com/AbdoEddy/GRC-Manager.git"
REPO_NAME="GRC-Manager"

print_status "Setting up Git repository for GRC Manager..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the AuditAlign project root directory"
    exit 1
fi

# Check if git is installed
if ! command -v git >/dev/null 2>&1; then
    print_error "Git is not installed. Please install Git first."
    print_status "Installation commands:"
    print_status "  Ubuntu/Debian: sudo apt-get install git"
    print_status "  macOS: brew install git"
    print_status "  CentOS/RHEL: sudo yum install git"
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
else
    print_status "Git repository already exists"
fi

# Configure git user (you may want to customize these)
print_status "Configuring Git user..."
echo "Please enter your Git configuration:"
read -p "Enter your name: " GIT_NAME
read -p "Enter your email: " GIT_EMAIL

git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"
print_success "Git user configured"

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_status "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production
.env.backup*

# Build outputs
dist/
build/
*.tsbuildinfo

# Database
*.db
*.sqlite

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
.cache/

# Local development
.local/
EOF
    print_success ".gitignore created"
else
    print_status ".gitignore already exists"
fi

# Clean up sensitive files before committing
print_status "Cleaning up sensitive files..."

# Create a clean .env.example file
if [ -f ".env" ]; then
    print_status "Creating .env.example from current .env..."
    cat > .env.example << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Secret (CHANGE THIS FOR PRODUCTION!)
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Admin User Configuration (for initial setup)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-password"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="User"

# Optional: PostgreSQL connection details for manual setup
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="grc_management"
DB_USER="grc_user"
DB_PASSWORD="grc_password"
EOF
    print_success ".env.example created"
fi

# Add all files to git
print_status "Adding files to Git..."
git add .

# Check if there are any changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit the changes
    print_status "Committing changes..."
    git commit -m "Initial commit: GRC Management System

- Complete web application for GRC (Governance, Risk, and Compliance) management
- Features: Organizations, Documents, Risk Register, Frameworks, Users
- Built with: Express.js, React, TypeScript, PostgreSQL, Drizzle ORM
- Includes: Authentication, CIA risk scoring, document workflows
- Database setup scripts and admin user creation tools included"

    print_success "Changes committed"
fi

# Add remote repository
print_status "Adding remote repository..."
if git remote get-url origin >/dev/null 2>&1; then
    print_status "Remote origin already exists, updating URL..."
    git remote set-url origin "$REPO_URL"
else
    git remote add origin "$REPO_URL"
fi
print_success "Remote repository added: $REPO_URL"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
    git checkout -b main
fi

print_status "Current branch: $CURRENT_BRANCH"

# Push to GitHub
print_status "Pushing to GitHub repository..."
print_warning "You may be prompted for your GitHub credentials"
print_status "If you have 2FA enabled, use a Personal Access Token instead of password"

if git push -u origin "$CURRENT_BRANCH"; then
    print_success "Successfully pushed to GitHub!"
    echo ""
    print_status "🎉 Your GRC Manager project is now available at:"
    echo "   $REPO_URL"
    echo ""
    print_status "📋 Next steps:"
    echo "   1. Visit your GitHub repository"
    echo "   2. Add a detailed README.md if needed"
    echo "   3. Set up GitHub Actions for CI/CD (optional)"
    echo "   4. Configure branch protection rules (optional)"
    echo ""
    print_status "🔧 Local development:"
    echo "   - Make changes to your code"
    echo "   - git add ."
    echo "   - git commit -m 'Your commit message'"
    echo "   - git push"
else
    print_error "Failed to push to GitHub"
    echo ""
    print_status "📝 Possible solutions:"
    echo "   1. Check your internet connection"
    echo "   2. Verify your GitHub credentials"
    echo "   3. If you have 2FA, use a Personal Access Token:"
    echo "      - Go to GitHub Settings > Developer settings > Personal access tokens"
    echo "      - Generate a new token with 'repo' permissions"
    echo "      - Use the token as your password when prompted"
    echo ""
    print_status "🔄 You can retry pushing with:"
    echo "   git push -u origin $CURRENT_BRANCH"
    exit 1
fi
