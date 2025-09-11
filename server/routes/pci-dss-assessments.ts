import { Router } from "express";
import { z } from "zod";
import { db } from "../db.js";
import { pciDssAssessments, organizations, organizationUsers } from "@shared/schema";
import { isAuthenticated } from "../auth.js";
import { eq, and } from "drizzle-orm";

const router = Router();

// Schema for PCI DSS assessment
const pciDssAssessmentSchema = z.object({
  requirement: z.string(),
  subRequirement: z.string().optional(),
  description: z.string(),
  status: z.enum(["completed", "in-progress", "not-applied"]),
  owner: z.string().optional(),
  task: z.string().optional(),
  completionDate: z.string().optional(),
  comments: z.string().optional(),
});

// Get all PCI DSS assessments for an organization
router.get("/:organizationId/pci-dss-assessments", isAuthenticated, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization
    const userOrg = await db
      .select({
        role: organizationUsers.role
      })
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .limit(1);

    if (userOrg.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessments = await db
      .select()
      .from(pciDssAssessments)
      .where(eq(pciDssAssessments.organizationId, organizationId))
      .orderBy(pciDssAssessments.requirement);

    res.json(assessments);
  } catch (error) {
    console.error("Error fetching PCI DSS assessments:", error);
    res.status(500).json({ message: "Failed to fetch PCI DSS assessments" });
  }
});

// Create or update PCI DSS assessments for an organization
router.post("/:organizationId/pci-dss-assessments", isAuthenticated, async (req, res) => {
  try {
    const { organizationId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization and get role
    const userOrg = await db
      .select({
        role: organizationUsers.role
      })
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .limit(1);

    if (userOrg.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has write permissions (not read-only)
    if (userOrg[0].role === 'read-only') {
      return res.status(403).json({ message: "Read-only users cannot modify assessments" });
    }

    const { assessments } = req.body;
    const validatedAssessments = z.array(pciDssAssessmentSchema).parse(assessments);

    // Delete existing assessments for this organization
    await db.delete(pciDssAssessments).where(eq(pciDssAssessments.organizationId, organizationId));

    // Insert new assessments
    const assessmentsToInsert = validatedAssessments.map((assessment, index) => ({
      id: undefined, // Let database generate UUID
      organizationId,
      requirement: assessment.requirement,
      subRequirement: assessment.subRequirement || null,
      description: assessment.description,
      status: assessment.status,
      owner: assessment.owner || null,
      task: assessment.task || null,
      completionDate: assessment.completionDate || null,
      comments: assessment.comments || null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.insert(pciDssAssessments).values(assessmentsToInsert);

    res.json({ message: "PCI DSS assessments saved successfully" });
  } catch (error) {
    console.error("Error saving PCI DSS assessments:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid assessment data", errors: error.issues });
    }
    res.status(500).json({ message: "Failed to save PCI DSS assessments" });
  }
});

// Get a specific PCI DSS assessment
router.get("/:organizationId/pci-dss-assessments/:assessmentId", isAuthenticated, async (req, res) => {
  try {
    const { organizationId, assessmentId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to this organization
    const userOrg = await db
      .select({
        role: organizationUsers.role
      })
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.userId, userId),
          eq(organizationUsers.organizationId, organizationId)
        )
      )
      .limit(1);

    if (userOrg.length === 0) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessment = await db
      .select()
      .from(pciDssAssessments)
      .where(
        and(
          eq(pciDssAssessments.id, assessmentId),
          eq(pciDssAssessments.organizationId, organizationId)
        )
      )
      .limit(1);

    if (assessment.length === 0) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.json(assessment[0]);
  } catch (error) {
    console.error("Error fetching PCI DSS assessment:", error);
    res.status(500).json({ message: "Failed to fetch PCI DSS assessment" });
  }
});

export default router;
