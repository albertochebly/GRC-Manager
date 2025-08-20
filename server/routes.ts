import type { Express } from "express";
import { createServer, type Server } from "http";
import userRoutes from "./routes/users";
import organizationRoutes from "./routes/organizations";
import documentRoutes from "./routes/documents";
import riskRoutes from "./routes/risks";
import frameworkRoutes from "./routes/frameworks";

console.log('Routes imported successfully:', {
  userRoutes: !!userRoutes,
  organizationRoutes: !!organizationRoutes,
  documentRoutes: !!documentRoutes,
  riskRoutes: !!riskRoutes,
  frameworkRoutes: !!frameworkRoutes
});

// Extend Express Request type to include user
declare module "express" {
  interface Request {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      username?: string;
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('Registering routes...');
  
  // Mount standalone framework routes
  app.use("/api/frameworks", frameworkRoutes);
  console.log('Framework routes mounted at /api/frameworks');
  
  // Mount the routes
  app.use("/api/organizations", organizationRoutes);
  console.log('Organization routes mounted at /api/organizations');
  
  // Mount document routes under /api/organizations
  app.use("/api/organizations", documentRoutes);
  console.log('Document routes mounted at /api/organizations');
  
  // Mount risk routes under /api/organizations
  app.use("/api/organizations", riskRoutes);
  console.log('Risk routes mounted at /api/organizations');
  
  // Mount framework routes under /api/organizations
  app.use("/api/organizations", frameworkRoutes);
  console.log('Organization framework routes mounted at /api/organizations');
  
  // Mount user routes under /api/organizations/:orgId/users
  app.use("/api/organizations", userRoutes);
  console.log('User routes mounted at /api/organizations');

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
