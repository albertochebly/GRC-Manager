# GRC Manager

A comprehensive web application for **Governance, Risk, and Compliance (GRC)** management, designed for cybersecurity consultants and organizations to manage compliance frameworks, risk assessments, and documentation workflows.

## 🚀 Features

### 📊 **Dashboard**
- Real-time metrics and KPIs
- Compliance scoring based on document status
- Pending approvals overview
- Active frameworks display

### 🏢 **Organization Management**
- Multi-tenant architecture
- User roles and permissions (Admin, Contributor, Approver, Read-only)
- Organization-specific settings and configurations

### 📋 **Document Management**
- Document creation with rich text editor
- Approval workflows (Draft → Review → Published → Archived)
- Version control and document history
- Template-based document creation

### ⚠️ **Risk Register**
- Asset-based and scenario-based risk assessment
- **CIA (Confidentiality, Integrity, Availability) impact scoring**
- Automated risk score calculation (Impact × Likelihood)
- Risk mitigation planning and tracking

### 🛡️ **Cybersecurity Frameworks**
- Support for multiple frameworks (ISO 27001, NIST, SOC2, etc.)
- Framework controls management
- Control-to-document mapping
- Compliance gap analysis

### 👥 **User Management**
- Role-based access control
- User invitation system
- Organization membership management

### 📤 **Import/Export**
- Data export capabilities
- CSV import for bulk operations
- Framework templates import

## 🛠️ Technology Stack

### **Backend**
- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **bcrypt** for password hashing
- **Express sessions** for authentication

### **Frontend**
- **React** with **TypeScript**
- **TanStack Query** for state management
- **React Router** for navigation
- **shadcn/ui** components
- **Tailwind CSS** for styling
- **Lucide React** for icons

### **Development Tools**
- **Vite** for fast development
- **ESBuild** for production builds
- **Drizzle Kit** for database migrations

## 📦 Installation

### **Prerequisites**
- Node.js 16+ 
- PostgreSQL 12+
- Python 3+ (for password hashing in scripts)

### **Quick Setup**
1. **Clone the repository:**
   ```bash
   git clone https://github.com/AbdoEddy/GRC-Manager.git
   cd GRC-Manager
   ```

2. **Run the automated setup:**
   ```bash
   ./setup.sh
   ```

   This script will:
   - Install dependencies
   - Set up PostgreSQL database
   - Configure environment variables
   - Run database migrations
   - Seed initial data
   - Create admin user

### **Manual Setup**

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up database:**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database credentials
   nano .env
   
   # Set up database schema
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

3. **Create admin user:**
   ```bash
   ./scripts/create-admin.sh
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### **Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Application
NODE_ENV=development
PORT=5000
SESSION_SECRET="your-secret-key"

# Admin User (for setup scripts)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
ADMIN_FIRST_NAME="Admin"
ADMIN_LAST_NAME="User"
```

### **Database Setup**
The application uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `organizations` - Client organizations
- `organization_users` - User-organization relationships and roles
- `documents` - Document management with approval workflows
- `risks` - Risk register with CIA impact scoring
- `frameworks` - Cybersecurity frameworks and controls

## 🎯 Usage

### **Default Admin Login**
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **⚠️ Change the password after first login!**

### **Available Scripts**
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes
npm run db:seed      # Seed initial data
npm run db:reset     # Reset database (⚠️ destructive)

# Utilities
npm run check        # TypeScript type checking
npm run create-admin # Create admin user
```

### **Key Workflows**

1. **Document Approval Process:**
   - Draft → Submit for Review → Approve → Publish → Archive

2. **Risk Assessment:**
   - Create risk with CIA impact scores (1-5)
   - Set likelihood (1-5)
   - Automatic risk score calculation
   - Mitigation planning

3. **Framework Compliance:**
   - Map controls to documents
   - Track compliance percentage
   - Gap analysis and reporting

## 🔒 Security Features

- **Password hashing** with bcrypt
- **Session-based authentication**
- **Role-based access control**
- **SQL injection prevention** with parameterized queries
- **XSS protection** with input sanitization
- **CSRF protection** with session tokens

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/          # Utilities and helpers
├── server/                # Express.js backend
│   ├── routes/           # API route handlers
│   ├── auth.ts          # Authentication logic
│   ├── db.ts            # Database connection
│   └── storage.ts       # Data access layer
├── shared/               # Shared types and schemas
├── scripts/             # Setup and utility scripts
├── migrations/          # Database migrations
└── setup.sh            # Automated setup script
```

## 🚦 API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### **Organizations**
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id/stats` - Organization statistics

### **Documents**
- `GET /api/organizations/:orgId/documents` - List documents
- `POST /api/organizations/:orgId/documents` - Create document
- `PUT /api/organizations/:orgId/documents/:id` - Update document
- `POST /api/organizations/:orgId/documents/:id/submit` - Submit for review
- `POST /api/organizations/:orgId/documents/:id/approve` - Approve document

### **Risks**
- `GET /api/organizations/:orgId/risks` - List risks
- `POST /api/organizations/:orgId/risks` - Create risk
- `PUT /api/organizations/:orgId/risks/:id` - Update risk

### **Frameworks**
- `GET /api/frameworks` - List frameworks
- `GET /api/organizations/:orgId/frameworks` - Organization frameworks
- `POST /api/organizations/:orgId/frameworks` - Create framework mapping

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `/docs` folder
- Review the setup scripts in `/scripts`

## 🔄 Development Status

This is an active project with regular updates. Key areas of ongoing development:
- Enhanced reporting and analytics
- Additional framework templates
- API integrations
- Mobile responsiveness improvements
- Advanced workflow automation

---

**Built with ❤️ for the cybersecurity and compliance community**
