import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { isAuthenticated } from '../auth';
import { eq, and, sql } from 'drizzle-orm';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  console.log('Test organizations route hit!');
  res.json({ message: 'Organization routes working!' });
});

// Schema for creating organization
const insertOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  createdBy: z.string(),
});

// Get all organizations for current user with their roles
router.get('/', isAuthenticated, async (req, res) => {
  console.log('=== Organizations GET route hit! ===');
  console.log('Request headers:', req.headers);
  console.log('Session:', req.session);
  console.log('User:', req.user);
  console.log('User ID:', req.user?.id);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log('❌ No user ID found');
      return res.status(401).json({ message: "Unauthorized" });
    }

    console.log('✅ Querying organizations for user:', userId);

    // Query organizations through organization_users table to get user's memberships
    const userOrgs = await db.select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      description: schema.organizations.description,
      createdAt: schema.organizations.createdAt,
      updatedAt: schema.organizations.updatedAt,
      role: schema.organizationUsers.role,
      createdBy: schema.organizations.createdBy,
    })
      .from(schema.organizationUsers)
      .innerJoin(schema.organizations, eq(schema.organizationUsers.organizationId, schema.organizations.id))
      .where(eq(schema.organizationUsers.userId, userId));

    console.log('Found organizations through memberships:', userOrgs);

    // Format the results
    const formattedOrgs = userOrgs.map(org => ({
      id: org.id,
      name: org.name,
      description: org.description || '',
      role: org.role,
      createdAt: org.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: org.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    console.log('Formatted organizations:', formattedOrgs);
    res.json(formattedOrgs);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    res.status(500).json({ 
      message: "Failed to fetch organizations",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Create organization
router.post('/', isAuthenticated, async (req, res) => {
  console.log('=== Create organization route hit! ===');
  console.log('Request body:', req.body);
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has admin privileges in any organization or if this is the first organization
    const totalOrganizations = await db.select().from(schema.organizations);
    const isFirstOrganization = totalOrganizations.length === 0;
    
    if (!isFirstOrganization) {
      // Check if user is an admin of any organization
      const [adminAccess] = await db.select()
        .from(schema.organizationUsers)
        .where(
          and(
            eq(schema.organizationUsers.userId, userId),
            eq(schema.organizationUsers.role, 'admin')
          )
        )
        .limit(1);

      if (!adminAccess) {
        console.log('❌ User is not an admin of any organization');
        return res.status(403).json({ message: "Only organization admins can create new organizations" });
      }
      
      console.log('✅ User has admin privileges in organization:', adminAccess.organizationId);
    } else {
      console.log('✅ First organization - allowing creation');
    }

    // Validate the input
    const { name, description } = req.body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    console.log('Creating organization:', { name, description, createdBy: userId });

    // Insert the new organization
    const [newOrg] = await db.insert(schema.organizations)
      .values({
        name: name.trim(),
        description: description || '',
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    console.log('Organization created:', newOrg);

    // Add the creator as an admin to the organization_users table
    await db.insert(schema.organizationUsers)
      .values({
        organizationId: newOrg.id,
        userId: userId,
        role: 'admin',
        invitedBy: userId, // Creator invites themselves
      });

    console.log('Creator added to organization_users as admin');

    // Format the response
    const formattedOrg = {
      id: newOrg.id,
      name: newOrg.name,
      description: newOrg.description || '',
      role: 'admin', // Creator is admin
      createdAt: newOrg.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: newOrg.updatedAt?.toISOString() || new Date().toISOString(),
    };

    res.status(201).json(formattedOrg);
  } catch (error) {
    console.error("Error creating organization:", error);
    res.status(500).json({ 
      message: "Failed to create organization",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Delete organization
router.delete('/:id', isAuthenticated, async (req, res) => {
  console.log('=== Delete organization route hit! ===');
  console.log('Organization ID:', req.params.id);
  console.log('User ID:', req.user?.id);
  
  try {
    const userId = req.user?.id;
    const orgId = req.params.id;
    
    if (!userId) {
      console.log('❌ No user ID found');
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!orgId) {
      console.log('❌ No organization ID provided');
      return res.status(400).json({ message: "Organization ID is required" });
    }

    console.log('✅ Attempting to delete organization:', orgId, 'for user:', userId);

    // Check if the user has admin access to the organization
    const [adminAccess] = await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.organizationId, orgId),
        eq(schema.organizationUsers.userId, userId),
        eq(schema.organizationUsers.role, 'admin')
      ))
      .limit(1);

    if (!adminAccess) {
      console.log('❌ User is not an admin of this organization');
      return res.status(403).json({ message: "Only organization admins can delete organizations" });
    }

    // Delete the organization (cascade will handle organization_users)
    const result = await db.delete(schema.organizations)
      .where(eq(schema.organizations.id, orgId));

    console.log('✅ Organization deleted successfully');
    res.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    res.status(500).json({ 
      message: "Failed to delete organization",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get dashboard stats for organization
router.get('/:orgId/stats', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orgId = req.params.orgId;

    // Check if user has access to this organization
    const membership = await db.select()
      .from(schema.organizationUsers)
      .where(and(
        eq(schema.organizationUsers.organizationId, orgId),
        eq(schema.organizationUsers.userId, userId)
      ));

    if (membership.length === 0) {
      return res.status(403).json({ message: "Access denied to this organization" });
    }

    // Get comprehensive dashboard stats
    const [
      frameworksCount,
      documentsCount,
      risksCount,
      usersCount,
      highRisksCount,
      activeFrameworksCount,
      pendingApprovalsCount
    ] = await Promise.all([
      // Total frameworks
      db.select({ count: sql<number>`count(*)` })
        .from(schema.organizationFrameworks)
        .where(eq(schema.organizationFrameworks.organizationId, orgId))
        .then(result => result[0]?.count || 0),
      
      // Total documents
      db.select({ count: sql<number>`count(*)` })
        .from(schema.documents)
        .where(eq(schema.documents.organizationId, orgId))
        .then(result => result[0]?.count || 0),
      
      // Total risks
      db.select({ count: sql<number>`count(*)` })
        .from(schema.risks)
        .where(eq(schema.risks.organizationId, orgId))
        .then(result => result[0]?.count || 0),
      
      // Total users
      db.select({ count: sql<number>`count(*)` })
        .from(schema.organizationUsers)
        .where(eq(schema.organizationUsers.organizationId, orgId))
        .then(result => result[0]?.count || 0),
      
      // High risks (score >= 15)
      db.select({ count: sql<number>`count(*)` })
        .from(schema.risks)
        .where(and(
          eq(schema.risks.organizationId, orgId),
          sql`(${schema.risks.impact} * ${schema.risks.likelihood}) >= 15`
        ))
        .then(result => result[0]?.count || 0),
      
      // Active frameworks
      db.select({ count: sql<number>`count(*)` })
        .from(schema.organizationFrameworks)
        .where(and(
          eq(schema.organizationFrameworks.organizationId, orgId),
          eq(schema.organizationFrameworks.isActive, true)
        ))
        .then(result => result[0]?.count || 0),
      
      // Pending approvals (documents with status "pending")
      db.select({ count: sql<number>`count(*)` })
        .from(schema.documents)
        .where(and(
          eq(schema.documents.organizationId, orgId),
          eq(schema.documents.status, 'pending')
        ))
        .then(result => result[0]?.count || 0)
    ]);

    const stats = {
      frameworks: {
        total: Number(frameworksCount),
        active: Number(activeFrameworksCount),
        inactive: Number(frameworksCount) - Number(activeFrameworksCount)
      },
      documents: {
        total: Number(documentsCount),
        pendingApproval: Number(pendingApprovalsCount)
      },
      risks: {
        total: Number(risksCount),
        high: Number(highRisksCount),
        low: Number(risksCount) - Number(highRisksCount)
      },
      users: {
        total: Number(usersCount)
      },
      overview: {
        totalFrameworks: Number(frameworksCount),
        totalDocuments: Number(documentsCount),
        totalRisks: Number(risksCount),
        totalUsers: Number(usersCount)
      }
    };

    console.log(`Dashboard stats for org ${orgId}:`, stats);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ 
      message: "Failed to fetch dashboard stats",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;
