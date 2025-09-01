import { Router } from "express";
import { db } from "../db";
import { risks, organizationUsers } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../auth";

const router = Router();

// GET /api/organizations/:organizationId/risks - Get all risks for an organization
router.get("/:organizationId/risks", isAuthenticated, async (req, res) => {
  try {
    console.log("GET risks request:", {
      organizationId: req.params.organizationId,
      userId: req.user?.id,
    });

    const { organizationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if user has access to this organization
    const userOrgAccess = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      )
      .limit(1);

    if (userOrgAccess.length === 0) {
      return res.status(403).json({ error: "Access denied to this organization" });
    }

    // Get all risks for the organization
    const orgRisks = await db
      .select({
        id: risks.id,
        riskId: risks.riskId,
        title: risks.title,
        description: risks.description,
        riskType: risks.riskType,
        assetCategory: risks.assetCategory,
        assetDescription: risks.assetDescription,
        confidentialityImpact: risks.confidentialityImpact,
        integrityImpact: risks.integrityImpact,
        availabilityImpact: risks.availabilityImpact,
        impact: risks.impact,
        likelihood: risks.likelihood,
        riskScore: risks.riskScore,
        mitigationPlan: risks.mitigationPlan,
        status: risks.status,
        statusComments: risks.statusComments,
        riskResponseStrategy: risks.riskResponseStrategy,
        newMeasuresAndControls: risks.newMeasuresAndControls,
        residualImpactLevel: risks.residualImpactLevel,
        residualImpactRating: risks.residualImpactRating,
        residualLikelihoodLevel: risks.residualLikelihoodLevel,
        residualLikelihoodRating: risks.residualLikelihoodRating,
        residualRiskLevel: risks.residualRiskLevel,
        residualRiskRating: risks.residualRiskRating,
        riskDueDate: risks.riskDueDate,
        riskCloseDate: risks.riskCloseDate,
        overdue: risks.overdue,
        nextReviewDate: risks.nextReviewDate,
        ownerId: risks.ownerId,
        createdBy: risks.createdBy,
        approvedBy: risks.approvedBy,
        approvedAt: risks.approvedAt,
        createdAt: risks.createdAt,
        updatedAt: risks.updatedAt,
      })
      .from(risks)
      .where(eq(risks.organizationId, organizationId))
      .orderBy(risks.createdAt);

    console.log(`Found ${orgRisks.length} risks for organization ${organizationId}`);

    res.json(orgRisks);
  } catch (error) {
    console.error("Error fetching risks:", error);
    res.status(500).json({ error: "Failed to fetch risks" });
  }
});

// POST /api/organizations/:organizationId/risks - Create a new risk
router.post("/:organizationId/risks", isAuthenticated, async (req, res) => {
  try {
    console.log("POST risk request:", {
      organizationId: req.params.organizationId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId } = req.params;
    const userId = req.user?.id;
    const { riskId, title, description, riskType, assetCategory, assetDescription, confidentialityImpact, integrityImpact, availabilityImpact, impact, likelihood, mitigationPlan } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!riskId || !title || !impact || !likelihood) {
      return res.status(400).json({ error: "Risk ID, title, impact, and likelihood are required" });
    }

    // Check if user has access to this organization
    const userOrgAccess = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      )
      .limit(1);

    if (userOrgAccess.length === 0) {
      return res.status(403).json({ error: "Access denied to this organization" });
    }

    // Calculate average impact from CIA values and risk score (impact * likelihood)
    const avgImpact = Math.round((parseInt(confidentialityImpact) + parseInt(integrityImpact) + parseInt(availabilityImpact)) / 3);
    const riskScore = (avgImpact * parseInt(likelihood)).toFixed(1);

    // Create the risk
    const newRisk = await db
      .insert(risks)
      .values({
        organizationId,
        riskId,
        title,
        description: description || "",
        riskType: riskType || "asset",
        assetCategory: assetCategory || null,
        assetDescription: assetDescription || null,
        confidentialityImpact: parseInt(confidentialityImpact),
        integrityImpact: parseInt(integrityImpact),
        availabilityImpact: parseInt(availabilityImpact),
        impact: avgImpact,
        likelihood: parseInt(likelihood),
        riskScore,
        mitigationPlan: mitigationPlan || "",
        status: "draft",
        ownerId: userId,
        createdBy: userId,
      })
      .returning();

    console.log("Created risk:", newRisk[0]);

    res.status(201).json(newRisk[0]);
  } catch (error) {
    console.error("Error creating risk:", error);
    res.status(500).json({ error: "Failed to create risk" });
  }
});

// PUT /api/organizations/:organizationId/risks/:riskId - Update a risk
router.put("/:organizationId/risks/:riskId", isAuthenticated, async (req, res) => {
  try {
    console.log("PUT risk request:", {
      organizationId: req.params.organizationId,
      riskId: req.params.riskId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId, riskId } = req.params;
    const userId = req.user?.id;
    const { 
      riskId: newRiskId, 
      title, 
      description, 
      riskType, 
      assetCategory, 
      assetDescription, 
      confidentialityImpact, 
      integrityImpact, 
      availabilityImpact, 
      impact, 
      likelihood, 
      mitigationPlan, 
      status,
      statusComments,
      riskResponseStrategy,
      newMeasuresAndControls,
      residualImpactLevel,
      residualImpactRating,
      residualLikelihoodLevel,
      residualLikelihoodRating,
      residualRiskLevel,
      residualRiskRating,
      riskDueDate,
      riskCloseDate,
      overdue,
      nextReviewDate
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if user has access to this organization
    const userOrgAccess = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      )
      .limit(1);

    if (userOrgAccess.length === 0) {
      return res.status(403).json({ error: "Access denied to this organization" });
    }

    // Check if risk exists and belongs to the organization
    const existingRisk = await db
      .select()
      .from(risks)
      .where(
        and(
          eq(risks.id, riskId),
          eq(risks.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingRisk.length === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }

    // Calculate new impact and risk score if CIA values or likelihood changed
    let newImpact = impact;
    let newLikelihood = likelihood !== undefined ? likelihood : existingRisk[0].likelihood;
    
    if (confidentialityImpact !== undefined || integrityImpact !== undefined || availabilityImpact !== undefined) {
      const newC = confidentialityImpact !== undefined ? confidentialityImpact : existingRisk[0].confidentialityImpact;
      const newI = integrityImpact !== undefined ? integrityImpact : existingRisk[0].integrityImpact;
      const newA = availabilityImpact !== undefined ? availabilityImpact : existingRisk[0].availabilityImpact;
      newImpact = Math.round((newC + newI + newA) / 3);
    } else if (impact !== undefined) {
      newImpact = impact;
    } else {
      newImpact = existingRisk[0].impact;
    }
    
    const riskScore = (newImpact * newLikelihood).toFixed(1);

    // Update the risk
    const updatedRisk = await db
      .update(risks)
      .set({
        riskId: newRiskId || existingRisk[0].riskId,
        title: title || existingRisk[0].title,
        description: description !== undefined ? description : existingRisk[0].description,
        riskType: riskType || existingRisk[0].riskType,
        assetCategory: assetCategory !== undefined ? assetCategory : existingRisk[0].assetCategory,
        assetDescription: assetDescription !== undefined ? assetDescription : existingRisk[0].assetDescription,
        confidentialityImpact: confidentialityImpact !== undefined ? confidentialityImpact : existingRisk[0].confidentialityImpact,
        integrityImpact: integrityImpact !== undefined ? integrityImpact : existingRisk[0].integrityImpact,
        availabilityImpact: availabilityImpact !== undefined ? availabilityImpact : existingRisk[0].availabilityImpact,
        impact: newImpact,
        likelihood: newLikelihood,
        riskScore,
        mitigationPlan: mitigationPlan !== undefined ? mitigationPlan : existingRisk[0].mitigationPlan,
        status: status || existingRisk[0].status,
        statusComments: statusComments !== undefined ? statusComments : existingRisk[0].statusComments,
        riskResponseStrategy: riskResponseStrategy !== undefined ? riskResponseStrategy : existingRisk[0].riskResponseStrategy,
        newMeasuresAndControls: newMeasuresAndControls !== undefined ? newMeasuresAndControls : existingRisk[0].newMeasuresAndControls,
        residualImpactLevel: residualImpactLevel !== undefined ? residualImpactLevel : existingRisk[0].residualImpactLevel,
        residualImpactRating: residualImpactRating !== undefined ? residualImpactRating : existingRisk[0].residualImpactRating,
        residualLikelihoodLevel: residualLikelihoodLevel !== undefined ? residualLikelihoodLevel : existingRisk[0].residualLikelihoodLevel,
        residualLikelihoodRating: residualLikelihoodRating !== undefined ? residualLikelihoodRating : existingRisk[0].residualLikelihoodRating,
        residualRiskLevel: residualRiskLevel !== undefined ? residualRiskLevel : existingRisk[0].residualRiskLevel,
        residualRiskRating: residualRiskRating !== undefined ? residualRiskRating : existingRisk[0].residualRiskRating,
        riskDueDate: riskDueDate !== undefined ? riskDueDate : existingRisk[0].riskDueDate,
        riskCloseDate: riskCloseDate !== undefined ? riskCloseDate : existingRisk[0].riskCloseDate,
        overdue: overdue !== undefined ? overdue : existingRisk[0].overdue,
        nextReviewDate: nextReviewDate !== undefined ? nextReviewDate : existingRisk[0].nextReviewDate,
        updatedAt: new Date(),
      })
      .where(eq(risks.id, riskId))
      .returning();

    console.log("Updated risk:", updatedRisk[0]);

    res.json(updatedRisk[0]);
  } catch (error) {
    console.error("Error updating risk:", error);
    res.status(500).json({ error: "Failed to update risk" });
  }
});

// DELETE /api/organizations/:organizationId/risks/:riskId - Delete a risk
router.delete("/:organizationId/risks/:riskId", isAuthenticated, async (req, res) => {
  try {
    console.log("DELETE risk request:", {
      organizationId: req.params.organizationId,
      riskId: req.params.riskId,
      userId: req.user?.id,
    });

    const { organizationId, riskId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if user has access to this organization
    const userOrgAccess = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      )
      .limit(1);

    if (userOrgAccess.length === 0) {
      return res.status(403).json({ error: "Access denied to this organization" });
    }

    // Check if risk exists and belongs to the organization
    const existingRisk = await db
      .select()
      .from(risks)
      .where(
        and(
          eq(risks.id, riskId),
          eq(risks.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingRisk.length === 0) {
      return res.status(404).json({ error: "Risk not found" });
    }

    // Delete the risk
    await db
      .delete(risks)
      .where(eq(risks.id, riskId));

    console.log("Deleted risk:", riskId);

    res.json({ message: "Risk deleted successfully" });
  } catch (error) {
    console.error("Error deleting risk:", error);
    res.status(500).json({ error: "Failed to delete risk" });
  }
});

export default router;
