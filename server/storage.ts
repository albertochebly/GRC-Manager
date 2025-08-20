import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  organizations,
  organizationUsers,
  frameworks,
  controls,
  documents,
  risks,
  approvals,
  organizationFrameworks,
  documentControls,
  riskControls,
  // Types
  type User,
  type UpsertUser,
  type Organization,
  type InsertOrganization,
  type Document,
  type InsertDocument,
  type Risk,
  type InsertRisk,
  type Framework,
  type Control,
  type Approval,
  type InsertApproval,
  type OrganizationUser,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: { username: string; email: string; passwordHash: string; firstName?: string; lastName?: string }): Promise<User>;
  updateUserRole(orgId: string, userId: string, role: string): Promise<void>;
  getOrganizationAdmins(orgId: string): Promise<User[]>;
  removeUserFromOrganization(orgId: string, userId: string): Promise<void>;

  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganizations(userId: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]>;
  deleteOrganization(id: string): Promise<void>;

  // Organization user operations
  addUserToOrganization(data: { userId: string; organizationId: string; role: string; invitedBy: string }): Promise<OrganizationUser>;
  getUserRole(organizationId: string, userId: string): Promise<string | undefined>;
  getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]>;

  // Framework operations
  initializeFrameworks(): Promise<void>;
  getFrameworks(): Promise<Framework[]>;
  getOrganizationFrameworks(organizationId: string): Promise<Framework[]>;
  
  // Statistics operations
  getDashboardStats(organizationId: string): Promise<{
    frameworks: number;
    documents: number;
    risks: number;
    pendingApprovals: number;
  }>;
  
  // Approval operations
  getPendingApprovals(organizationId: string): Promise<Approval[]>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocuments(organizationId: string): Promise<Document[]>;
  getDocument(id: string, organizationId: string): Promise<Document | undefined>;
  updateDocument(id: string, organizationId: string, data: Partial<InsertDocument>): Promise<Document>;
  deleteDocument(id: string, organizationId: string): Promise<void>;

  // Risk operations
  createRisk(risk: InsertRisk): Promise<Risk>;
  getRisks(organizationId: string): Promise<Risk[]>;
  getRisk(id: string, organizationId: string): Promise<Risk | undefined>;
  updateRisk(id: string, organizationId: string, data: Partial<InsertRisk>): Promise<Risk>;
  deleteRisk(id: string, organizationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const result = await db.insert(users).values(user)
      .onConflictDoUpdate({
        target: users.id,
        set: user
      })
      .returning();
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async createUser(user: { username: string; email: string; passwordHash: string; firstName?: string; lastName?: string }): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserRole(organizationId: string, userId: string): Promise<string | undefined> {
    const result = await db
      .select()
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      )
      .limit(1);
    return result[0]?.role;
  }

  async getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]> {
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        createdBy: organizations.createdBy,
        role: organizationUsers.role,
      })
      .from(organizations)
      .innerJoin(organizationUsers, eq(organizations.id, organizationUsers.organizationId))
      .where(eq(organizationUsers.userId, userId));

    return result as (Organization & { role: string })[];
  }

  async getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]> {
    const result = await db
      .select({
        organizationUser: organizationUsers,
        user: users,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.userId, users.id))
      .where(eq(organizationUsers.organizationId, organizationId));
    
    return result.map((r) => ({
      ...r.organizationUser,
      user: r.user
    }));
  }

  async addUserToOrganization(data: { userId: string; organizationId: string; role: string; invitedBy: string }): Promise<OrganizationUser> {
    const result = await db.insert(organizationUsers).values(data).returning();
    return result[0];
  }

  async updateUserRole(orgId: string, userId: string, role: string): Promise<void> {
    await db.update(organizationUsers)
      .set({ role })
      .where(
        and(
          eq(organizationUsers.organizationId, orgId),
          eq(organizationUsers.userId, userId)
        )
      );
  }

  async getOrganizationAdmins(orgId: string): Promise<User[]> {
    const result = await db
      .select({
        user: users
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.userId, users.id))
      .where(
        and(
          eq(organizationUsers.organizationId, orgId),
          eq(organizationUsers.role, "admin")
        )
      );
    
    return result.map(r => r.user);
  }

  async removeUserFromOrganization(orgId: string, userId: string): Promise<void> {
    await db.delete(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, orgId),
          eq(organizationUsers.userId, userId)
        )
      );
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const result = await db.insert(organizations).values(organization).returning();
    const newOrg = result[0];

    // Add creator as admin
    await db.insert(organizationUsers).values({
      organizationId: newOrg.id,
      userId: organization.createdBy,
      role: "admin",
      invitedBy: organization.createdBy,
    }).returning();

    return newOrg;
  }

  async getOrganizations(userId: string): Promise<Organization[]> {
    const result = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        createdBy: organizations.createdBy,
      })
      .from(organizations)
      .innerJoin(organizationUsers, eq(organizations.id, organizationUsers.organizationId))
      .where(eq(organizationUsers.userId, userId));
    return result;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const result = await db.select().from(organizations).where(eq(organizations.id, id));
    return result[0];
  }

  async deleteOrganization(id: string): Promise<void> {
    // Thanks to onDelete: "cascade" in our schema, this will automatically delete:
    // - organization_users
    // - organization_frameworks
    // - documents
    // - risks
    // - approvals
    // and any other tables with foreign key relationships to organizations
    await db.delete(organizations).where(eq(organizations.id, id));
  }

  async createDocument(documentData: InsertDocument): Promise<Document> {
    console.log('Storage: Creating document:', documentData);
    try {
      // Ensure organizationId exists
      const org = await this.getOrganization(documentData.organizationId);
      if (!org) {
        throw new Error(`Organization ${documentData.organizationId} not found`);
      }

      // Ensure user exists
      const user = await this.getUser(documentData.createdBy);
      if (!user) {
        throw new Error(`User ${documentData.createdBy} not found`);
      }

      const now = new Date();
      const result = await db
        .insert(documents)
        .values({
          ...documentData,
          createdAt: now,
          updatedAt: now
        })
        .returning();

      console.log('Storage: Created document result:', result);
      return result[0];
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  async getDocuments(organizationId: string): Promise<Document[]> {
    console.log('Storage: Getting documents for org:', organizationId);
    try {
      const result = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          version: documents.version,
          status: documents.status,
          documentType: documents.documentType,
          organizationId: documents.organizationId,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt
        })
        .from(documents)
        .where(eq(documents.organizationId, organizationId))
        .orderBy(desc(documents.createdAt));

      console.log('Storage: Found documents:', result);
      return result;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  async getDocument(id: string, organizationId: string): Promise<Document | undefined> {
    const result = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)));
    return result[0];
  }

  async updateDocument(
    id: string,
    organizationId: string,
    data: Partial<InsertDocument>
  ): Promise<Document> {
    const result = await db
      .update(documents)
      .set(data)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string, organizationId: string): Promise<void> {
    await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const result = await db.insert(risks).values(risk).returning();
    return result[0];
  }

  async getRisks(organizationId: string): Promise<Risk[]> {
    return await db.select().from(risks).where(eq(risks.organizationId, organizationId));
  }

  async getRisk(id: string, organizationId: string): Promise<Risk | undefined> {
    const result = await db
      .select()
      .from(risks)
      .where(and(eq(risks.id, id), eq(risks.organizationId, organizationId)));
    return result[0];
  }

  async updateRisk(
    id: string,
    organizationId: string,
    data: Partial<InsertRisk>
  ): Promise<Risk> {
    const result = await db
      .update(risks)
      .set(data)
      .where(and(eq(risks.id, id), eq(risks.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async deleteRisk(id: string, organizationId: string): Promise<void> {
    // First, delete any risk controls associated with this risk
    await db
      .delete(riskControls)
      .where(eq(riskControls.riskId, id));
    
    // Then delete any approvals associated with this risk
    await db
      .delete(approvals)
      .where(and(
        eq(approvals.itemId, id),
        eq(approvals.itemType, 'risk')
      ));
    
    // Finally delete the risk itself
    await db
      .delete(risks)
      .where(and(
        eq(risks.id, id), 
        eq(risks.organizationId, organizationId)
      ));
  }

  async getFrameworks(): Promise<Framework[]> {
    return await db.select().from(frameworks);
  }

  async initializeFrameworks(): Promise<void> {
    // No-op for now, implement if needed
  }

  async getOrganizationFrameworks(organizationId: string): Promise<Framework[]> {
    return await db
      .select({
        framework: frameworks,
      })
      .from(organizationFrameworks)
      .innerJoin(frameworks, eq(frameworks.id, organizationFrameworks.frameworkId))
      .where(eq(organizationFrameworks.organizationId, organizationId))
      .then(results => results.map(r => r.framework));
  }

  async getDashboardStats(organizationId: string): Promise<any> {
    const [
      frameworksCount,
      documentsCount,
      risksCount,
      pendingApprovalsCount
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(organizationFrameworks)
        .where(eq(organizationFrameworks.organizationId, organizationId))
        .then(result => result[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(documents)
        .where(eq(documents.organizationId, organizationId))
        .then(result => result[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(risks)
        .where(eq(risks.organizationId, organizationId))
        .then(result => result[0]?.count || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(approvals)
        .where(and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.status, 'pending')
        ))
        .then(result => result[0]?.count || 0)
    ]);

    return {
      frameworks: frameworksCount,
      documents: documentsCount,
      risks: risksCount,
      pendingApprovals: pendingApprovalsCount
    };
  }

  async getPendingApprovals(organizationId: string): Promise<Approval[]> {
    return await db
      .select()
      .from(approvals)
      .where(and(
        eq(approvals.organizationId, organizationId),
        eq(approvals.status, 'pending')
      ))
      .orderBy(desc(approvals.createdAt));
  }
}

export const storage = new DatabaseStorage();
