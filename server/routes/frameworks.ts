import { Router } from "express";
import { db } from "../db";
import { frameworks, organizationFrameworks, organizationUsers, controls, controlTemplates, documents } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../auth";

const router = Router();

// GET /api/frameworks - Get all available frameworks
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("GET frameworks request:", {
      userId: req.user?.id,
    });

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get all active frameworks
    const allFrameworks = await db
      .select({
        id: frameworks.id,
        name: frameworks.name,
        version: frameworks.version,
        description: frameworks.description,
        isActive: frameworks.isActive,
        createdAt: frameworks.createdAt,
      })
      .from(frameworks)
      .where(eq(frameworks.isActive, true))
      .orderBy(frameworks.name);

    console.log(`Found ${allFrameworks.length} frameworks`);

    res.json(allFrameworks);
  } catch (error) {
    console.error("Error fetching frameworks:", error);
    res.status(500).json({ error: "Failed to fetch frameworks" });
  }
});

// POST /api/frameworks - Create a new framework
router.post("/", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { name, version, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!name || !version) {
      return res.status(400).json({ error: "Framework name and version are required" });
    }

    // Check if framework with same name and version already exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(
        and(
          eq(frameworks.name, name),
          eq(frameworks.version, version)
        )
      )
      .limit(1);

    if (existingFramework.length > 0) {
      return res.status(409).json({ error: "A framework with this name and version already exists" });
    }

    // Create new framework
    const newFramework = await db
      .insert(frameworks)
      .values({
        name,
        version,
        description,
        isActive: true,
      })
      .returning();

    console.log("Created framework:", newFramework[0]);
    res.status(201).json(newFramework[0]);
  } catch (error) {
    console.error("Error creating framework:", error);
    res.status(500).json({ error: "Failed to create framework" });
  }
});

// PUT /api/frameworks/:frameworkId - Update an existing framework
router.put("/:frameworkId", isAuthenticated, async (req, res) => {
  try {
    const { frameworkId } = req.params;
    const userId = req.user?.id;
    const { name, version, description } = req.body;

    console.log("PUT /api/frameworks/:frameworkId request:", {
      frameworkId,
      userId,
      body: req.body,
      name,
      version,
      description,
      nameType: typeof name,
      versionType: typeof version,
      nameLength: name?.length,
      versionLength: version?.length
    });

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // More detailed validation
    if (!name || name.trim() === '') {
      console.log("Validation failed - missing or empty name:", { name });
      return res.status(400).json({ error: "Framework name is required" });
    }
    
    if (!version || version.trim() === '') {
      console.log("Validation failed - missing or empty version:", { version });
      return res.status(400).json({ error: "Framework version is required" });
    }

    // Check if framework exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.id, frameworkId))
      .limit(1);

    if (existingFramework.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    // Check if another framework with same name and version already exists (excluding current one)
    const duplicateFramework = await db
      .select()
      .from(frameworks)
      .where(
        and(
          eq(frameworks.name, name),
          eq(frameworks.version, version),
          eq(frameworks.isActive, true)
        )
      )
      .limit(1);

    if (duplicateFramework.length > 0 && duplicateFramework[0].id !== frameworkId) {
      return res.status(409).json({ error: "A framework with this name and version already exists" });
    }

    // Update framework
    const updatedFramework = await db
      .update(frameworks)
      .set({
        name,
        version,
        description,
      })
      .where(eq(frameworks.id, frameworkId))
      .returning();

    console.log("Updated framework:", updatedFramework[0]);
    res.json(updatedFramework[0]);
  } catch (error) {
    console.error("Error updating framework:", error);
    res.status(500).json({ error: "Failed to update framework" });
  }
});

// DELETE /api/frameworks/:frameworkId - Delete a framework (soft delete)
router.delete("/:frameworkId", isAuthenticated, async (req, res) => {
  try {
    const { frameworkId } = req.params;
    const userId = req.user?.id;

    console.log("DELETE /api/frameworks/:frameworkId request:", {
      frameworkId,
      userId
    });

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if framework exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.id, frameworkId))
      .limit(1);

    if (existingFramework.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    // Check if framework is currently activated by any organization
    const activeFrameworks = await db
      .select()
      .from(organizationFrameworks)
      .where(
        and(
          eq(organizationFrameworks.frameworkId, frameworkId),
          eq(organizationFrameworks.isActive, true)
        )
      )
      .limit(1);

    if (activeFrameworks.length > 0) {
      return res.status(409).json({ 
        error: "Cannot delete framework that is currently activated by organizations. Please deactivate it from all organizations first." 
      });
    }

    // Soft delete the framework
    await db
      .update(frameworks)
      .set({
        isActive: false,
      })
      .where(eq(frameworks.id, frameworkId));

    console.log("Deleted framework:", frameworkId);
    res.json({ message: "Framework deleted successfully" });
  } catch (error) {
    console.error("Error deleting framework:", error);
    res.status(500).json({ error: "Failed to delete framework" });
  }
});

// GET /api/frameworks/:frameworkId/controls - Get controls for a specific framework
router.get("/:frameworkId/controls", isAuthenticated, async (req, res) => {
  try {
    const { frameworkId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get all controls for this framework with their templates
    const frameworkControls = await db
      .select({
        id: controls.id,
        controlId: controls.controlId,
        title: controls.title,
        description: controls.description,
        category: controls.category,
        createdAt: controls.createdAt,
        templates: {
          id: controlTemplates.id,
          documentTitle: controlTemplates.documentTitle,
          documentType: controlTemplates.documentType,
          documentDescription: controlTemplates.documentDescription,
          contentTemplate: controlTemplates.contentTemplate,
        }
      })
      .from(controls)
      .leftJoin(controlTemplates, eq(controls.id, controlTemplates.controlId))
      .where(eq(controls.frameworkId, frameworkId))
      .orderBy(controls.controlId);

    // Group templates by control
    const groupedControls = frameworkControls.reduce((acc, row) => {
      const controlId = row.id;
      if (!acc[controlId]) {
        acc[controlId] = {
          id: row.id,
          controlId: row.controlId,
          title: row.title,
          description: row.description,
          category: row.category,
          createdAt: row.createdAt,
          templates: []
        };
      }
      
      if (row.templates && row.templates.id) {
        acc[controlId].templates.push(row.templates);
      }
      
      return acc;
    }, {} as Record<string, any>);

    res.json(Object.values(groupedControls));
  } catch (error) {
    console.error("Error fetching framework controls:", error);
    res.status(500).json({ error: "Failed to fetch framework controls" });
  }
});

// POST /api/frameworks/:frameworkId/controls/:controlId/templates - Add template to a control
router.post("/:frameworkId/controls/:controlId/templates", isAuthenticated, async (req, res) => {
  try {
    const { controlId } = req.params;
    const userId = req.user?.id;
    const { documentTitle, documentType, documentDescription, contentTemplate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!documentTitle || !documentType) {
      return res.status(400).json({ error: "Document title and type are required" });
    }

    // Check if control exists
    const control = await db
      .select()
      .from(controls)
      .where(eq(controls.id, controlId))
      .limit(1);

    if (control.length === 0) {
      return res.status(404).json({ error: "Control not found" });
    }

    // Create new control template
    const newTemplate = await db
      .insert(controlTemplates)
      .values({
        controlId,
        documentTitle,
        documentType,
        documentDescription,
        contentTemplate,
      })
      .returning();

    res.status(201).json(newTemplate[0]);
  } catch (error) {
    console.error("Error creating control template:", error);
    res.status(500).json({ error: "Failed to create control template" });
  }
});

// DELETE /api/frameworks/:frameworkId/controls/:controlId/templates/:templateId - Remove template from a control
router.delete("/:frameworkId/controls/:controlId/templates/:templateId", isAuthenticated, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Delete the template
    await db
      .delete(controlTemplates)
      .where(eq(controlTemplates.id, templateId));

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting control template:", error);
    res.status(500).json({ error: "Failed to delete control template" });
  }
});

// PUT /api/frameworks/:frameworkId/controls/:controlId/templates/:templateId - Update a template for a control
router.put("/:frameworkId/controls/:controlId/templates/:templateId", isAuthenticated, async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;
    const { documentTitle, documentType, documentDescription, contentTemplate } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!documentTitle || !documentType) {
      return res.status(400).json({ error: "Document title and type are required" });
    }

    // Update the template
    const [updatedTemplate] = await db
      .update(controlTemplates)
      .set({
        documentTitle,
        documentType,
        documentDescription: documentDescription || null,
        contentTemplate: contentTemplate || null,
      })
      .where(eq(controlTemplates.id, templateId))
      .returning();

    if (!updatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error updating control template:", error);
    res.status(500).json({ error: "Failed to update control template" });
  }
});

// POST /api/frameworks/:frameworkId/controls - Add a new control to a framework
router.post("/:frameworkId/controls", isAuthenticated, async (req, res) => {
  try {
    const { frameworkId } = req.params;
    const userId = req.user?.id;
    const { controlId, title, description, category } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!controlId || !title) {
      return res.status(400).json({ error: "Control ID and title are required" });
    }

    // Check if framework exists
    const framework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.id, frameworkId))
      .limit(1);

    if (framework.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    // Check if control ID already exists in this framework
    const existingControl = await db
      .select()
      .from(controls)
      .where(
        and(
          eq(controls.frameworkId, frameworkId),
          eq(controls.controlId, controlId)
        )
      )
      .limit(1);

    if (existingControl.length > 0) {
      return res.status(409).json({ error: "A control with this ID already exists in this framework" });
    }

    // Create new control
    const newControl = await db
      .insert(controls)
      .values({
        frameworkId,
        controlId,
        title,
        description,
        category,
      })
      .returning();

    res.status(201).json(newControl[0]);
  } catch (error) {
    console.error("Error creating control:", error);
    res.status(500).json({ error: "Failed to create control" });
  }
});

// PUT /api/frameworks/:frameworkId/controls/:controlId - Update an existing control
router.put("/:frameworkId/controls/:controlId", isAuthenticated, async (req, res) => {
  try {
    const { frameworkId, controlId } = req.params;
    const userId = req.user?.id;
    const { controlId: newControlId, title, description, category } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!newControlId || !title) {
      return res.status(400).json({ error: "Control ID and title are required" });
    }

    // Check if control exists
    const existingControl = await db
      .select()
      .from(controls)
      .where(eq(controls.id, controlId))
      .limit(1);

    if (existingControl.length === 0) {
      return res.status(404).json({ error: "Control not found" });
    }

    // If controlId is being changed, check if new controlId already exists
    if (newControlId !== existingControl[0].controlId) {
      const duplicateControl = await db
        .select()
        .from(controls)
        .where(
          and(
            eq(controls.frameworkId, frameworkId),
            eq(controls.controlId, newControlId)
          )
        )
        .limit(1);

      if (duplicateControl.length > 0) {
        return res.status(409).json({ error: "A control with this ID already exists in this framework" });
      }
    }

    // Update control
    const updatedControl = await db
      .update(controls)
      .set({
        controlId: newControlId,
        title,
        description,
        category,
      })
      .where(eq(controls.id, controlId))
      .returning();

    res.json(updatedControl[0]);
  } catch (error) {
    console.error("Error updating control:", error);
    res.status(500).json({ error: "Failed to update control" });
  }
});

// DELETE /api/frameworks/:frameworkId/controls/:controlId - Delete a control from a framework
router.delete("/:frameworkId/controls/:controlId", isAuthenticated, async (req, res) => {
  try {
    const { controlId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if control exists
    const existingControl = await db
      .select()
      .from(controls)
      .where(eq(controls.id, controlId))
      .limit(1);

    if (existingControl.length === 0) {
      return res.status(404).json({ error: "Control not found" });
    }

    // Delete the control (templates will be cascade deleted)
    await db
      .delete(controls)
      .where(eq(controls.id, controlId));

    res.json({ message: "Control deleted successfully" });
  } catch (error) {
    console.error("Error deleting control:", error);
    res.status(500).json({ error: "Failed to delete control" });
  }
});

// GET /api/organizations/:organizationId/frameworks - Get frameworks activated for an organization
router.get("/:organizationId/frameworks", isAuthenticated, async (req, res) => {
  try {
    console.log("GET organization frameworks request:", {
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

    // Get all frameworks activated for this organization
    const orgFrameworks = await db
      .select({
        id: frameworks.id,
        name: frameworks.name,
        version: frameworks.version,
        description: frameworks.description,
        isActive: organizationFrameworks.isActive,
        createdAt: frameworks.createdAt,
        activatedAt: organizationFrameworks.createdAt,
      })
      .from(organizationFrameworks)
      .innerJoin(frameworks, eq(organizationFrameworks.frameworkId, frameworks.id))
      .where(
        and(
          eq(organizationFrameworks.organizationId, organizationId),
          eq(organizationFrameworks.isActive, true)
        )
      )
      .orderBy(frameworks.name);

    console.log(`Found ${orgFrameworks.length} activated frameworks for organization ${organizationId}`);

    res.json(orgFrameworks);
  } catch (error) {
    console.error("Error fetching organization frameworks:", error);
    res.status(500).json({ error: "Failed to fetch organization frameworks" });
  }
});

// POST /api/organizations/:organizationId/frameworks - Activate a framework for an organization
router.post("/:organizationId/frameworks", isAuthenticated, async (req, res) => {
  try {
    console.log("POST organization framework request:", {
      organizationId: req.params.organizationId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId } = req.params;
    const userId = req.user?.id;
    const { frameworkId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!frameworkId) {
      return res.status(400).json({ error: "Framework ID is required" });
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

    // Check if framework exists
    const framework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.id, frameworkId))
      .limit(1);

    if (framework.length === 0) {
      return res.status(404).json({ error: "Framework not found" });
    }

    // Check if framework is already activated for this organization
    const existingActivation = await db
      .select()
      .from(organizationFrameworks)
      .where(
        and(
          eq(organizationFrameworks.organizationId, organizationId),
          eq(organizationFrameworks.frameworkId, frameworkId)
        )
      )
      .limit(1);

    let isReactivation = false;
    if (existingActivation.length > 0) {
      // If it exists but is inactive, reactivate it
      if (!existingActivation[0].isActive) {
        const updatedActivation = await db
          .update(organizationFrameworks)
          .set({
            isActive: true,
            createdAt: new Date(),
          })
          .where(eq(organizationFrameworks.id, existingActivation[0].id))
          .returning();

        console.log("Reactivated framework:", updatedActivation[0]);
        isReactivation = true;
        // Continue to check for missing documents below
      } else {
        return res.status(409).json({ error: "Framework is already activated for this organization" });
      }
    }

    // Create new framework activation only if it's not a reactivation
    if (!isReactivation) {
      const newActivation = await db
        .insert(organizationFrameworks)
        .values({
          organizationId,
          frameworkId,
          isActive: true,
        })
        .returning();

      console.log("Created framework activation:", newActivation[0]);
    }

    // Get all control templates for this framework
    const controlTemplatesForFramework = await db
      .select({
        controlId: controls.id,
        controlTitle: controls.title,
        templateId: controlTemplates.id,
        documentTitle: controlTemplates.documentTitle,
        documentType: controlTemplates.documentType,
        documentDescription: controlTemplates.documentDescription,
        contentTemplate: controlTemplates.contentTemplate,
      })
      .from(controls)
      .innerJoin(controlTemplates, eq(controls.id, controlTemplates.controlId))
      .where(eq(controls.frameworkId, frameworkId));

    console.log(`Found ${controlTemplatesForFramework.length} control templates to check/create documents for`);

    // Check which documents already exist for this organization and framework
    const existingDocuments = await db
      .select({
        title: documents.title,
        documentType: documents.documentType,
        id: documents.id,
      })
      .from(documents)
      .where(eq(documents.organizationId, organizationId));

    console.log(`Found ${existingDocuments.length} existing documents in organization`);

    // Create a map of existing documents by title and type for quick lookup
    const existingDocMap = new Map();
    existingDocuments.forEach(doc => {
      const key = `${doc.title}-${doc.documentType}`;
      existingDocMap.set(key, doc);
    });

    // Filter templates to only create documents that don't already exist
    const missingTemplates = controlTemplatesForFramework.filter(template => {
      const key = `${template.documentTitle}-${template.documentType}`;
      return !existingDocMap.has(key);
    });

    console.log(`${missingTemplates.length} documents need to be created (${controlTemplatesForFramework.length - missingTemplates.length} already exist)`);

    // Create document drafts for missing control templates only
    const createdDocuments = [];
    for (const template of missingTemplates) {
      try {
        const newDocument = await db
          .insert(documents)
          .values({
            organizationId,
            title: template.documentTitle,
            content: template.contentTemplate || `<h1>${template.documentTitle}</h1><p>${template.documentDescription || 'Please provide content for this document.'}</p>`,
            version: "1.0",
            status: "draft",
            documentType: template.documentType,
            ownerId: userId,
            createdBy: userId,
          })
          .returning();

        createdDocuments.push(newDocument[0]);
        console.log(`Created document draft: ${template.documentTitle}`);
      } catch (docError) {
        console.error(`Failed to create document for template ${template.templateId}:`, docError);
        // Continue with other documents even if one fails
      }
    }

    const existingCount = controlTemplatesForFramework.length - missingTemplates.length;
    console.log(`Successfully created ${createdDocuments.length} new document drafts, ${existingCount} documents already existed`);

    res.status(isReactivation ? 200 : 201).json({
      activation: existingActivation.length > 0 ? existingActivation[0] : null,
      documentsCreated: createdDocuments.length,
      documentsExisted: existingCount,
      totalTemplates: controlTemplatesForFramework.length,
      isReactivation,
      documents: createdDocuments
    });
  } catch (error) {
    console.error("Error activating framework:", error);
    res.status(500).json({ error: "Failed to activate framework" });
  }
});

// DELETE /api/organizations/:organizationId/frameworks/:frameworkId - Deactivate a framework for an organization
router.delete("/:organizationId/frameworks/:frameworkId", isAuthenticated, async (req, res) => {
  try {
    console.log("DELETE organization framework request:", {
      organizationId: req.params.organizationId,
      frameworkId: req.params.frameworkId,
      userId: req.user?.id,
    });

    const { organizationId, frameworkId } = req.params;
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

    // Check if framework activation exists
    const existingActivation = await db
      .select()
      .from(organizationFrameworks)
      .where(
        and(
          eq(organizationFrameworks.organizationId, organizationId),
          eq(organizationFrameworks.frameworkId, frameworkId)
        )
      )
      .limit(1);

    if (existingActivation.length === 0) {
      return res.status(404).json({ error: "Framework activation not found" });
    }

    // Deactivate the framework (soft delete)
    await db
      .update(organizationFrameworks)
      .set({
        isActive: false,
      })
      .where(eq(organizationFrameworks.id, existingActivation[0].id));

    console.log("Deactivated framework:", frameworkId);

    res.json({ message: "Framework deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating framework:", error);
    res.status(500).json({ error: "Failed to deactivate framework" });
  }
});

export default router;
