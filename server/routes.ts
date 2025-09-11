import type { Express } from "express";
import { createServer, type Server } from "http";
import userRoutes from "./routes/users";
import organizationRoutes from "./routes/organizations";
import documentRoutes from "./routes/documents";
import riskRoutes from "./routes/risks";
import frameworkRoutes from "./routes/frameworks";
import maturityAssessmentRoutes from "./routes/maturity-assessments";
import pciDssAssessmentRoutes from "./routes/pci-dss-assessments";

console.log('Routes imported successfully:', {
  userRoutes: !!userRoutes,
  organizationRoutes: !!organizationRoutes,
  documentRoutes: !!documentRoutes,
  riskRoutes: !!riskRoutes,
  frameworkRoutes: !!frameworkRoutes,
  maturityAssessmentRoutes: !!maturityAssessmentRoutes,
  pciDssAssessmentRoutes: !!pciDssAssessmentRoutes
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
  
    // Mount routes
  app.use('/api/users', userRoutes);
  app.use('/api/organizations', organizationRoutes);
  app.use('/api/organizations', documentRoutes);
  app.use('/api/organizations', riskRoutes);
  app.use('/api/frameworks', frameworkRoutes);
  app.use('/api/organizations', maturityAssessmentRoutes);
  app.use('/api/organizations', pciDssAssessmentRoutes);

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
