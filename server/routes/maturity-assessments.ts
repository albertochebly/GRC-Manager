import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { isAuthenticated } from "../auth.js";

const router = Router();

// Schema for maturity assessment
const maturityAssessmentSchema = z.object({
  category: z.string(),
  section: z.string(),
  standardRef: z.string(),
  question: z.string(),
  currentMaturityLevel: z.string(),
  currentMaturityScore: z.number(),
  currentComments: z.string().optional(),
  targetMaturityLevel: z.string(),
  targetMaturityScore: z.number(),
  targetComments: z.string().optional(),
});

// Get all maturity assessments for an organization
router.get("/api/organizations/:organizationId/maturity-assessments", isAuthenticated, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization
    const userOrg = await storage.getUserOrganization(userId, organizationId);
    if (!userOrg) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessments = await storage.getMaturityAssessments(organizationId);
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching maturity assessments:", error);
    res.status(500).json({ message: "Failed to fetch maturity assessments" });
  }
});

// Create or update maturity assessments for an organization
router.post("/api/organizations/:organizationId/maturity-assessments", isAuthenticated, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization
    const userOrg = await storage.getUserOrganization(userId, organizationId);
    if (!userOrg) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has write permissions (not read-only)
    if (userOrg.role === 'read-only') {
      return res.status(403).json({ message: "Read-only users cannot modify assessments" });
    }

    const assessments = z.array(maturityAssessmentSchema).parse(req.body);

    // Save assessments to database
    await storage.saveMaturityAssessments(organizationId, assessments, userId);

    res.json({ message: "Maturity assessments saved successfully" });
  } catch (error) {
    console.error("Error saving maturity assessments:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid assessment data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to save maturity assessments" });
  }
});

// Get a specific maturity assessment
router.get("/api/organizations/:organizationId/maturity-assessments/:assessmentId", isAuthenticated, async (req, res) => {
  try {
    const { organizationId, assessmentId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization
    const userOrg = await storage.getUserOrganization(userId, organizationId);
    if (!userOrg) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessment = await storage.getMaturityAssessment(organizationId, assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.json(assessment);
  } catch (error) {
    console.error("Error fetching maturity assessment:", error);
    res.status(500).json({ message: "Failed to fetch maturity assessment" });
  }
});

export default router;
