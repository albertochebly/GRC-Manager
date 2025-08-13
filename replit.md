# Overview

This is a multi-tenant GRC (Governance, Risk, and Compliance) management web application inspired by Eramba. It enables GRC consultants to manage cybersecurity compliance for multiple client companies through a secure, role-based system with approval workflows, risk registers, and framework mapping capabilities.

The application features strict data isolation between organizations, comprehensive document management with approval workflows, risk assessment tools, and integration with standard cybersecurity frameworks like NIST, ISO 27001, and SOC 2.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React 18** with TypeScript for type safety and modern component development
- **Vite** as the build tool for fast development and optimized production builds
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management, caching, and API synchronization
- **Tailwind CSS** with shadcn/ui components for consistent, accessible design system
- **React Hook Form** with Zod validation for type-safe form handling

## Backend Architecture
- **Express.js** server with TypeScript for API endpoints and middleware
- **Multi-tenant data isolation** ensuring complete separation between client organizations
- **Role-based access control (RBAC)** with four distinct roles: Admin, Contributor, Approver, and Read-Only
- **RESTful API design** with structured endpoints for organizations, documents, risks, and approvals
- **Session-based authentication** using express-session with PostgreSQL storage

## Database Design
- **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations
- **Neon serverless** for database hosting and connection pooling
- **Multi-tenant schema** with organization-scoped data isolation
- **Approval workflow tables** linking documents/risks to approval processes
- **Framework and control mapping** for cybersecurity compliance tracking
- **Version control** for document history and audit trails

## Authentication & Authorization
- **Replit Auth integration** using OpenID Connect for secure user authentication
- **Organization-scoped permissions** ensuring users only access their organization's data
- **Session management** with PostgreSQL-backed session storage
- **Middleware-based authorization** checking user permissions on each API request

## Key Features
- **Document Management**: Rich text editor for policy creation with approval workflows
- **Risk Register**: Comprehensive risk assessment with impact/likelihood scoring
- **Framework Integration**: Pre-loaded cybersecurity frameworks (NIST, ISO 27001, SOC 2)
- **CSV Import/Export**: Bulk data operations for frameworks and risk entries
- **Approval Workflows**: Multi-step approval process for document and risk submissions
- **Dashboard Analytics**: Real-time compliance metrics and pending approval tracking

# External Dependencies

## Database & Storage
- **@neondatabase/serverless**: Serverless PostgreSQL connection and query execution
- **drizzle-orm**: Type-safe database ORM with schema validation
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication
- **openid-client**: OpenID Connect integration for Replit Auth
- **passport**: Authentication middleware for Express
- **express-session**: Session management with secure cookie handling

## UI Components
- **@radix-ui/***: Accessible, unstyled UI primitives for complex components
- **@tanstack/react-query**: Server state management and data synchronization
- **class-variance-authority**: Type-safe CSS class variants for component styling
- **tailwindcss**: Utility-first CSS framework for responsive design

## Development Tools
- **tsx**: TypeScript execution for Node.js development
- **vite**: Fast build tool with HMR and optimized production builds
- **@replit/vite-plugin-***: Replit-specific development integrations
- **esbuild**: Fast JavaScript bundling for production builds

## Validation & Forms
- **zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: React Hook Form integration with Zod validation
- **drizzle-zod**: Database schema to Zod schema generation