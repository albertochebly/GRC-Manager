
# Local Development Setup

This guide will help you set up the GRC Management System on your local machine.

## Prerequisites

1. **PostgreSQL 12+** - Database server
2. **Node.js 18+** - JavaScript runtime
3. **npm** - Package manager (comes with Node.js)

## Quick Setup

1. **Clone and navigate to the project:**
   ```bash
   cd your-project-directory
   ```

2. **Run the setup script:**
   ```bash
   chmod +x scripts/setup-local.sh
   ./scripts/setup-local.sh
   ```

3. **Start the application:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5000`

## Manual Setup (if script doesn't work)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup PostgreSQL

**Install PostgreSQL:**
- Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
- macOS: `brew install postgresql`
- Windows: Download from https://www.postgresql.org/download/

**Start PostgreSQL service:**
- Ubuntu/Debian: `sudo systemctl start postgresql`
- macOS: `brew services start postgresql`
- Windows: Use Services app or pgAdmin

### 3. Create Database and User
```bash
sudo -u postgres psql -f scripts/init-db.sql
```

### 4. Configure Environment
Copy `.env.example` to `.env` and update if needed:
```bash
cp .env.example .env
```

### 5. Setup Database Schema
```bash
npm run db:push
```

### 6. Seed Initial Data
```bash
npm run db:seed
```

### 7. Start Development Server
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database (WARNING: deletes all data)
- `npm run check` - Run TypeScript type checking

## Database Information

- **Host:** localhost
- **Port:** 5432
- **Database:** grc_management
- **Username:** grc_user
- **Password:** grc_password

## Troubleshooting

### PostgreSQL Connection Issues
1. Ensure PostgreSQL is running: `pg_isready`
2. Check if user exists: `sudo -u postgres psql -c "\du"`
3. Verify database exists: `sudo -u postgres psql -c "\l"`

### Port Already in Use
If port 5000 is occupied, change the PORT in `.env` file:
```
PORT=3000
```

### Permission Issues
Make sure the database user has proper permissions:
```bash
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE grc_management TO grc_user;"
```

### Reset Everything
If you need to start fresh:
```bash
npm run db:reset
```

## Development Workflow

1. Make code changes
2. The server will automatically restart (thanks to tsx)
3. Frontend changes will hot-reload (thanks to Vite)
4. Database schema changes: run `npm run db:push`
5. Need sample data: run `npm run db:seed`

## Features Available Locally

- ✅ User authentication (mock auth for local development)
- ✅ Multi-tenant organization management
- ✅ Document management with approval workflows
- ✅ Risk register with control mapping
- ✅ Cybersecurity framework compliance tracking
- ✅ Role-based access control
- ✅ Dashboard with analytics

Happy coding! 🚀
