import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertOrganizationSchema,
  insertDocumentSchema,
  insertRiskSchema,
  insertApprovalSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize frameworks on startup
  await storage.initializeFrameworks();

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Organization routes
  app.get("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const organizations = await storage.getUserOrganizations(userId);
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Failed to fetch organizations" });
    }
  });

  app.post("/api/organizations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertOrganizationSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const organization = await storage.createOrganization(data);
      res.json(organization);
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(400).json({ message: "Failed to create organization" });
    }
  });

  app.get("/api/organizations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const organization = await storage.getOrganization(id);
      if (!organization) {
        return res.status(404).json({ message: "Organization not found" });
      }
      res.json(organization);
    } catch (error) {
      console.error("Error fetching organization:", error);
      res.status(500).json({ message: "Failed to fetch organization" });
    }
  });

  // Document routes
  app.get("/api/organizations/:orgId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      // Check user has access to organization
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getDocuments(orgId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/organizations/:orgId/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || !["admin", "contributor"].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const data = insertDocumentSchema.parse({
        ...req.body,
        organizationId: orgId,
        createdBy: userId,
        ownerId: userId,
      });
      
      const document = await storage.createDocument(data);
      res.json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ message: "Failed to create document" });
    }
  });

  app.get("/api/organizations/:orgId/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const document = await storage.getDocument(id, orgId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.put("/api/organizations/:orgId/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, id } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || !["admin", "contributor"].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const data = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(id, orgId, data);
      res.json(document);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ message: "Failed to update document" });
    }
  });

  // Risk routes
  app.get("/api/organizations/:orgId/risks", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const risks = await storage.getRisks(orgId);
      res.json(risks);
    } catch (error) {
      console.error("Error fetching risks:", error);
      res.status(500).json({ message: "Failed to fetch risks" });
    }
  });

  app.post("/api/organizations/:orgId/risks", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || !["admin", "contributor"].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const data = insertRiskSchema.parse({
        ...req.body,
        organizationId: orgId,
        createdBy: userId,
        ownerId: userId,
      });
      
      const risk = await storage.createRisk(data);
      res.json(risk);
    } catch (error) {
      console.error("Error creating risk:", error);
      res.status(400).json({ message: "Failed to create risk" });
    }
  });

  // Framework routes
  app.get("/api/frameworks", isAuthenticated, async (req, res) => {
    try {
      const frameworks = await storage.getFrameworks();
      res.json(frameworks);
    } catch (error) {
      console.error("Error fetching frameworks:", error);
      res.status(500).json({ message: "Failed to fetch frameworks" });
    }
  });

  app.get("/api/organizations/:orgId/frameworks", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const frameworks = await storage.getOrganizationFrameworks(orgId);
      res.json(frameworks);
    } catch (error) {
      console.error("Error fetching organization frameworks:", error);
      res.status(500).json({ message: "Failed to fetch frameworks" });
    }
  });

  app.post("/api/organizations/:orgId/frameworks/:frameworkId/activate", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId, frameworkId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.activateFramework(orgId, frameworkId);
      res.json({ message: "Framework activated successfully" });
    } catch (error) {
      console.error("Error activating framework:", error);
      res.status(500).json({ message: "Failed to activate framework" });
    }
  });

  app.get("/api/frameworks/:id/controls", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const controls = await storage.getFrameworkControls(id);
      res.json(controls);
    } catch (error) {
      console.error("Error fetching controls:", error);
      res.status(500).json({ message: "Failed to fetch controls" });
    }
  });

  // Approval routes
  app.get("/api/organizations/:orgId/approvals", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const approvals = await storage.getApprovals(orgId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  app.get("/api/organizations/:orgId/approvals/pending", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || !["admin", "approver"].includes(role)) {
        return res.status(403).json({ message: "Approver access required" });
      }
      
      const approvals = await storage.getPendingApprovals(orgId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/organizations/:orgId/approvals", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || !["admin", "contributor"].includes(role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const data = insertApprovalSchema.parse({
        ...req.body,
        organizationId: orgId,
        submittedBy: userId,
      });
      
      const approval = await storage.createApproval(data);
      res.json(approval);
    } catch (error) {
      console.error("Error creating approval:", error);
      res.status(400).json({ message: "Failed to create approval" });
    }
  });

  app.put("/api/approvals/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const userId = req.user.claims.sub;
      
      const approval = await storage.updateApprovalStatus(id, status, userId, comments);
      res.json(approval);
    } catch (error) {
      console.error("Error updating approval status:", error);
      res.status(400).json({ message: "Failed to update approval status" });
    }
  });

  // Dashboard stats
  app.get("/api/organizations/:orgId/stats", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const stats = await storage.getDashboardStats(orgId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Organization users
  app.get("/api/organizations/:orgId/users", isAuthenticated, async (req: any, res) => {
    try {
      const { orgId } = req.params;
      const userId = req.user.claims.sub;
      
      const role = await storage.getUserRole(orgId, userId);
      if (!role || role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const users = await storage.getOrganizationUsers(orgId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching organization users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
