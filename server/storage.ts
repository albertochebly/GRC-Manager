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
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Organization operations
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getOrganizations(userId: string): Promise<Organization[]>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]>;

  // Organization user operations
  addUserToOrganization(organizationId: string, userId: string, role: string): Promise<OrganizationUser>;
  getUserRole(organizationId: string, userId: string): Promise<string | undefined>;
  getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]>;

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

  // Framework operations
  getFrameworks(): Promise<Framework[]>;
  getFramework(id: string): Promise<Framework | undefined>;
  getOrganizationFrameworks(organizationId: string): Promise<Framework[]>;
  activateFramework(organizationId: string, frameworkId: string): Promise<void>;
  getFrameworkControls(frameworkId: string): Promise<Control[]>;

  // Approval operations
  createApproval(approval: InsertApproval): Promise<Approval>;
  getApprovals(organizationId: string): Promise<(Approval & { submittedByUser: User })[]>;
  getPendingApprovals(organizationId: string): Promise<(Approval & { submittedByUser: User })[]>;
  updateApprovalStatus(id: string, status: string, reviewedBy: string, comments?: string): Promise<Approval>;

  // Dashboard stats
  getDashboardStats(organizationId: string): Promise<{
    documentCount: number;
    pendingApprovals: number;
    riskCount: number;
    highRiskCount: number;
  }>;

  // Initialize frameworks
  initializeFrameworks(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Organization operations
  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(organization).returning();
    
    // Add the creator as an admin
    await this.addUserToOrganization(created.id, organization.createdBy, "admin");
    
    return created;
  }

  async getOrganizations(userId: string): Promise<Organization[]> {
    return await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        createdBy: organizations.createdBy,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.createdBy, userId))
      .orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<(Organization & { role: string })[]> {
    return await db
      .select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        createdBy: organizations.createdBy,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
        role: organizationUsers.role,
      })
      .from(organizations)
      .innerJoin(organizationUsers, eq(organizations.id, organizationUsers.organizationId))
      .where(eq(organizationUsers.userId, userId))
      .orderBy(desc(organizations.createdAt));
  }

  // Organization user operations
  async addUserToOrganization(organizationId: string, userId: string, role: string): Promise<OrganizationUser> {
    const [orgUser] = await db
      .insert(organizationUsers)
      .values({ organizationId, userId, role })
      .returning();
    return orgUser;
  }

  async getUserRole(organizationId: string, userId: string): Promise<string | undefined> {
    const [orgUser] = await db
      .select({ role: organizationUsers.role })
      .from(organizationUsers)
      .where(
        and(
          eq(organizationUsers.organizationId, organizationId),
          eq(organizationUsers.userId, userId)
        )
      );
    return orgUser?.role;
  }

  async getOrganizationUsers(organizationId: string): Promise<(OrganizationUser & { user: User })[]> {
    return await db
      .select({
        id: organizationUsers.id,
        organizationId: organizationUsers.organizationId,
        userId: organizationUsers.userId,
        role: organizationUsers.role,
        createdAt: organizationUsers.createdAt,
        user: users,
      })
      .from(organizationUsers)
      .innerJoin(users, eq(organizationUsers.userId, users.id))
      .where(eq(organizationUsers.organizationId, organizationId));
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [created] = await db.insert(documents).values(document).returning();
    return created;
  }

  async getDocuments(organizationId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.organizationId, organizationId))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(id: string, organizationId: string): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)));
    return document;
  }

  async updateDocument(id: string, organizationId: string, data: Partial<InsertDocument>): Promise<Document> {
    const [updated] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteDocument(id: string, organizationId: string): Promise<void> {
    await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.organizationId, organizationId)));
  }

  // Risk operations
  async createRisk(risk: InsertRisk): Promise<Risk> {
    // Calculate risk score
    const riskScore = risk.impact * risk.likelihood;
    const [created] = await db
      .insert(risks)
      .values({ ...risk, riskScore: riskScore.toString() })
      .returning();
    return created;
  }

  async getRisks(organizationId: string): Promise<Risk[]> {
    return await db
      .select()
      .from(risks)
      .where(eq(risks.organizationId, organizationId))
      .orderBy(desc(risks.updatedAt));
  }

  async getRisk(id: string, organizationId: string): Promise<Risk | undefined> {
    const [risk] = await db
      .select()
      .from(risks)
      .where(and(eq(risks.id, id), eq(risks.organizationId, organizationId)));
    return risk;
  }

  async updateRisk(id: string, organizationId: string, data: Partial<InsertRisk>): Promise<Risk> {
    // Recalculate risk score if impact or likelihood changed
    let updateData = { ...data, updatedAt: new Date() };
    if (data.impact !== undefined || data.likelihood !== undefined) {
      const current = await this.getRisk(id, organizationId);
      if (current) {
        const impact = data.impact ?? current.impact;
        const likelihood = data.likelihood ?? current.likelihood;
        updateData.riskScore = (impact * likelihood).toString();
      }
    }

    const [updated] = await db
      .update(risks)
      .set(updateData)
      .where(and(eq(risks.id, id), eq(risks.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async deleteRisk(id: string, organizationId: string): Promise<void> {
    await db
      .delete(risks)
      .where(and(eq(risks.id, id), eq(risks.organizationId, organizationId)));
  }

  // Framework operations
  async getFrameworks(): Promise<Framework[]> {
    return await db.select().from(frameworks).where(eq(frameworks.isActive, true));
  }

  async getFramework(id: string): Promise<Framework | undefined> {
    const [framework] = await db.select().from(frameworks).where(eq(frameworks.id, id));
    return framework;
  }

  async getOrganizationFrameworks(organizationId: string): Promise<Framework[]> {
    return await db
      .select({
        id: frameworks.id,
        name: frameworks.name,
        version: frameworks.version,
        description: frameworks.description,
        isActive: frameworks.isActive,
        createdAt: frameworks.createdAt,
      })
      .from(frameworks)
      .innerJoin(organizationFrameworks, eq(frameworks.id, organizationFrameworks.frameworkId))
      .where(
        and(
          eq(organizationFrameworks.organizationId, organizationId),
          eq(organizationFrameworks.isActive, true)
        )
      );
  }

  async activateFramework(organizationId: string, frameworkId: string): Promise<void> {
    await db
      .insert(organizationFrameworks)
      .values({ organizationId, frameworkId, isActive: true })
      .onConflictDoUpdate({
        target: [organizationFrameworks.organizationId, organizationFrameworks.frameworkId],
        set: { isActive: true },
      });
  }

  async getFrameworkControls(frameworkId: string): Promise<Control[]> {
    return await db
      .select()
      .from(controls)
      .where(eq(controls.frameworkId, frameworkId))
      .orderBy(controls.controlId);
  }

  // Approval operations
  async createApproval(approval: InsertApproval): Promise<Approval> {
    const [created] = await db.insert(approvals).values(approval).returning();
    return created;
  }

  async getApprovals(organizationId: string): Promise<(Approval & { submittedByUser: User })[]> {
    return await db
      .select({
        id: approvals.id,
        organizationId: approvals.organizationId,
        itemType: approvals.itemType,
        itemId: approvals.itemId,
        status: approvals.status,
        comments: approvals.comments,
        submittedBy: approvals.submittedBy,
        reviewedBy: approvals.reviewedBy,
        submittedAt: approvals.submittedAt,
        reviewedAt: approvals.reviewedAt,
        createdAt: approvals.createdAt,
        submittedByUser: users,
      })
      .from(approvals)
      .innerJoin(users, eq(approvals.submittedBy, users.id))
      .where(eq(approvals.organizationId, organizationId))
      .orderBy(desc(approvals.submittedAt));
  }

  async getPendingApprovals(organizationId: string): Promise<(Approval & { submittedByUser: User })[]> {
    return await db
      .select({
        id: approvals.id,
        organizationId: approvals.organizationId,
        itemType: approvals.itemType,
        itemId: approvals.itemId,
        status: approvals.status,
        comments: approvals.comments,
        submittedBy: approvals.submittedBy,
        reviewedBy: approvals.reviewedBy,
        submittedAt: approvals.submittedAt,
        reviewedAt: approvals.reviewedAt,
        createdAt: approvals.createdAt,
        submittedByUser: users,
      })
      .from(approvals)
      .innerJoin(users, eq(approvals.submittedBy, users.id))
      .where(
        and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.status, "pending")
        )
      )
      .orderBy(desc(approvals.submittedAt));
  }

  async updateApprovalStatus(
    id: string,
    status: string,
    reviewedBy: string,
    comments?: string
  ): Promise<Approval> {
    const [updated] = await db
      .update(approvals)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        comments: comments || null,
      })
      .where(eq(approvals.id, id))
      .returning();
    return updated;
  }

  // Dashboard stats
  async getDashboardStats(organizationId: string): Promise<{
    documentCount: number;
    pendingApprovals: number;
    riskCount: number;
    highRiskCount: number;
  }> {
    const [documentCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.organizationId, organizationId));

    const [pendingApprovals] = await db
      .select({ count: sql<number>`count(*)` })
      .from(approvals)
      .where(
        and(
          eq(approvals.organizationId, organizationId),
          eq(approvals.status, "pending")
        )
      );

    const [riskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(risks)
      .where(eq(risks.organizationId, organizationId));

    const [highRiskCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(risks)
      .where(
        and(
          eq(risks.organizationId, organizationId),
          sql`CAST(${risks.riskScore} AS DECIMAL) >= 15`
        )
      );

    return {
      documentCount: documentCount.count,
      pendingApprovals: pendingApprovals.count,
      riskCount: riskCount.count,
      highRiskCount: highRiskCount.count,
    };
  }

  // Initialize frameworks with sample data
  async initializeFrameworks(): Promise<void> {
    const existingFrameworks = await this.getFrameworks();
    if (existingFrameworks.length > 0) return;

    const frameworksData = [
      {
        name: "NIST Cybersecurity Framework (CSF) 2.0",
        version: "2.0",
        description: "NIST framework for improving critical infrastructure cybersecurity",
      },
      {
        name: "ISO/IEC 27001:2022",
        version: "2022",
        description: "International standard for information security management systems",
      },
      {
        name: "SOC 2",
        version: "2017",
        description: "Service Organization Control 2 - Trust Services Criteria",
      },
      {
        name: "PCI DSS",
        version: "4.0",
        description: "Payment Card Industry Data Security Standard",
      },
      {
        name: "CIS Critical Security Controls",
        version: "v8",
        description: "Center for Internet Security Critical Security Controls",
      },
      {
        name: "GDPR",
        version: "2018",
        description: "General Data Protection Regulation",
      },
      {
        name: "HIPAA Security Rule",
        version: "2013",
        description: "Health Insurance Portability and Accountability Act Security Rule",
      },
    ];

    for (const framework of frameworksData) {
      const [created] = await db.insert(frameworks).values(framework).returning();
      
      // Add sample controls
      const sampleControls = this.getSampleControlsForFramework(framework.name);
      for (const control of sampleControls) {
        await db.insert(controls).values({
          frameworkId: created.id,
          ...control,
        });
      }
    }
  }

  private getSampleControlsForFramework(frameworkName: string): Omit<Control, "id" | "frameworkId" | "createdAt">[] {
    switch (frameworkName) {
      case "NIST Cybersecurity Framework (CSF) 2.0":
        return [
          { controlId: "ID.AM-1", title: "Asset Management", description: "Physical devices and systems within the organization are inventoried", category: "Identify" },
          { controlId: "ID.AM-2", title: "Software Management", description: "Software platforms and applications within the organization are inventoried", category: "Identify" },
          { controlId: "PR.AC-1", title: "Access Control", description: "Identities and credentials are issued, managed, verified, revoked, and audited", category: "Protect" },
          { controlId: "DE.AE-1", title: "Anomaly Detection", description: "A baseline of network operations and expected data flows is established", category: "Detect" },
          { controlId: "RS.RP-1", title: "Response Planning", description: "Response plan is executed during or after an incident", category: "Respond" },
        ];
      case "ISO/IEC 27001:2022":
        return [
          { controlId: "A.5.1", title: "Information Security Policies", description: "Information security policy and topic-specific policies", category: "Organizational Controls" },
          { controlId: "A.6.1", title: "Screening", description: "Background verification checks on all candidates for employment", category: "People Controls" },
          { controlId: "A.8.1", title: "User Endpoint Devices", description: "Information stored on, processed by or accessible via user endpoint devices", category: "Technological Controls" },
        ];
      case "SOC 2":
        return [
          { controlId: "CC1.1", title: "Control Environment", description: "The entity demonstrates a commitment to integrity and ethical values", category: "Common Criteria" },
          { controlId: "CC2.1", title: "Communication and Information", description: "The entity obtains or generates and uses relevant, quality information", category: "Common Criteria" },
          { controlId: "A1.1", title: "Availability", description: "The entity maintains the availability and functionality of its systems", category: "Availability" },
        ];
      default:
        return [
          { controlId: "CTRL-001", title: "Sample Control 1", description: "Sample control description", category: "General" },
          { controlId: "CTRL-002", title: "Sample Control 2", description: "Sample control description", category: "General" },
        ];
    }
  }
}

export const storage = new DatabaseStorage();
