import { Router } from "express";
import { db } from "../db";
import { documents, organizationUsers } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import { isAuthenticated } from "../auth";

const router = Router();

// GET /api/organizations/:organizationId/documents - Get all documents for an organization
router.get("/:organizationId/documents", isAuthenticated, async (req, res) => {
  try {
    console.log("GET documents request:", {
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

    // Get all documents for the organization
    const orgDocuments = await db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        version: documents.version,
        status: documents.status,
        documentType: documents.documentType,
        ownerId: documents.ownerId,
        createdBy: documents.createdBy,
        approvedBy: documents.approvedBy,
        approvedAt: documents.approvedAt,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(eq(documents.organizationId, organizationId))
      .orderBy(documents.createdAt);

    console.log(`Found ${orgDocuments.length} documents for organization ${organizationId}`);

    res.json(orgDocuments);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// POST /api/organizations/:organizationId/documents - Create a new document
router.post("/:organizationId/documents", isAuthenticated, async (req, res) => {
  try {
    console.log("POST document request:", {
      organizationId: req.params.organizationId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId } = req.params;
    const userId = req.user?.id;
    const { title, content, documentType, version = "1.0", status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Check if user has access to this organization and get their role
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

    const userRole = userOrgAccess[0].role;

    // Check permissions - only contributors, approvers, and admins can create documents
    if (userRole === "read-only") {
      return res.status(403).json({ error: "Read-only users cannot create documents" });
    }

    console.log(`User ${userId} has role ${userRole}, creating document`);

    // Validate status for contributors - they can only create draft or pending documents
    let documentStatus = "draft"; // Default to draft
    if (status) {
      if (userRole === "contributor") {
        if (status !== "draft" && status !== "pending") {
          return res.status(403).json({ 
            error: "Contributors can only create documents with draft or pending status" 
          });
        }
        documentStatus = status;
      } else {
        // Approvers and admins can create with any valid status
        const validStatuses = ["draft", "pending", "published", "archived"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ 
            error: "Invalid status. Valid statuses are: draft, pending, published, archived" 
          });
        }
        documentStatus = status;
      }
    }

    // Create the document
    const newDocument = await db
      .insert(documents)
      .values({
        organizationId,
        title,
        content: content || "",
        version,
        documentType: documentType || "policy",
        status: documentStatus,
        ownerId: userId,
        createdBy: userId,
      })
      .returning();

    console.log("Created document:", newDocument[0]);

    res.status(201).json(newDocument[0]);
  } catch (error) {
    console.error("Error creating document:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
});

// PUT /api/organizations/:organizationId/documents/:documentId - Update a document
router.put("/:organizationId/documents/:documentId", isAuthenticated, async (req, res) => {
  try {
    console.log("PUT document request:", {
      organizationId: req.params.organizationId,
      documentId: req.params.documentId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId, documentId } = req.params;
    const userId = req.user?.id;
    const { title, content, documentType, version, status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if user has access to this organization and get their role
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

    const userRole = userOrgAccess[0].role;

    // Check if document exists and belongs to the organization
    const existingDocument = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingDocument.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const currentDocument = existingDocument[0];

    // Role-based permission checks
    if (userRole === "read-only") {
      return res.status(403).json({ error: "Read-only users cannot edit documents" });
    }

    // Check if status is being changed and validate permissions
    if (status && status !== currentDocument.status) {
      console.log(`Status change requested: ${currentDocument.status} -> ${status} by role: ${userRole}`);

      // Contributors can only change their own documents from draft to pending
      if (userRole === "contributor") {
        // Check if user owns the document
        if (currentDocument.ownerId !== userId) {
          return res.status(403).json({ 
            error: "Contributors can only edit their own documents" 
          });
        }
        
        // Contributors can only change from draft to pending, or keep it as draft
        if (currentDocument.status === "draft" && status === "pending") {
          // Allow this transition
        } else if (status === "draft") {
          // Allow keeping as draft
        } else {
          return res.status(403).json({ 
            error: "Contributors can only submit drafts for review (change to pending status)" 
          });
        }
      } else {
        // Only approvers and admins can make other status changes
        if (userRole !== "approver" && userRole !== "admin") {
          return res.status(403).json({ 
            error: "Only approvers and admins can change document status" 
          });
        }
      }

      // Validate status transitions
      const validStatuses = ["draft", "pending", "published", "archived"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status. Valid statuses are: draft, pending, published, archived" 
        });
      }
    }

    // Contributors can only edit documents they own and only if they're in draft or pending status
    if (userRole === "contributor") {
      if (currentDocument.ownerId !== userId) {
        return res.status(403).json({ 
          error: "Contributors can only edit documents they own" 
        });
      }
      if (currentDocument.status !== "draft" && currentDocument.status !== "pending") {
        return res.status(403).json({ 
          error: "Contributors can only edit draft or pending documents" 
        });
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (documentType !== undefined) updateData.documentType = documentType;
    if (version !== undefined) updateData.version = version;
    
    // Handle status changes with approval tracking
    if (status !== undefined && status !== currentDocument.status) {
      updateData.status = status;
      
      // If status is being set to published, record the approver
      if (status === "published" && (userRole === "approver" || userRole === "admin")) {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      }
    }

    console.log(`Updating document with role ${userRole}:`, updateData);

    // Update the document
    const updatedDocument = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId))
      .returning();

    console.log("Updated document:", updatedDocument[0]);

    res.json(updatedDocument[0]);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// DELETE /api/organizations/:organizationId/documents/:documentId - Delete a document
router.delete("/:organizationId/documents/:documentId", isAuthenticated, async (req, res) => {
  try {
    console.log("DELETE document request:", {
      organizationId: req.params.organizationId,
      documentId: req.params.documentId,
      userId: req.user?.id,
    });

    const { organizationId, documentId } = req.params;
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

    // Check if document exists and belongs to the organization
    const existingDocument = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingDocument.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete the document
    await db
      .delete(documents)
      .where(eq(documents.id, documentId));

    console.log("Deleted document:", documentId);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// PATCH /api/organizations/:organizationId/documents/:documentId/status - Change document status
router.patch("/:organizationId/documents/:documentId/status", isAuthenticated, async (req, res) => {
  try {
    console.log("PATCH document status request:", {
      organizationId: req.params.organizationId,
      documentId: req.params.documentId,
      userId: req.user?.id,
      body: req.body,
    });

    const { organizationId, documentId } = req.params;
    const userId = req.user?.id;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Check if user has access to this organization and get their role
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

    const userRole = userOrgAccess[0].role;

    // Check if document exists and belongs to the organization
    const existingDocument = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.id, documentId),
          eq(documents.organizationId, organizationId)
        )
      )
      .limit(1);

    if (existingDocument.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const currentDocument = existingDocument[0];

    // Role-based permission checks for status changes
    if (userRole === "read-only" || userRole === "contributor") {
      return res.status(403).json({ 
        error: "Only approvers and admins can change document status" 
      });
    }

    // Validate status transitions
    const validStatuses = ["draft", "pending", "published", "archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Invalid status. Valid statuses are: draft, pending, published, archived" 
      });
    }

    console.log(`Status change: ${currentDocument.status} -> ${status} by ${userRole} ${userId}`);

    // Prepare update data
    const updateData: any = {
      status: status,
      updatedAt: new Date(),
    };

    // If status is being set to published, record the approver
    if (status === "published" && (userRole === "approver" || userRole === "admin")) {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }

    // Update the document status
    const updatedDocument = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId))
      .returning();

    console.log("Updated document status:", updatedDocument[0]);

    res.json({
      message: `Document status changed to ${status}`,
      document: updatedDocument[0]
    });
  } catch (error) {
    console.error("Error updating document status:", error);
    res.status(500).json({ error: "Failed to update document status" });
  }
});

export default router;
