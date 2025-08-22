import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
  index,
  uuid,
  unique,
} from "drizzle-orm/pg-core";
// import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User creation schema
export const createUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["admin", "contributor", "approver", "read-only"]),
});

export type CreateUser = z.infer<typeof createUserSchema>;

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique(),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organizations (client companies)
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization users and their roles
export const organizationUsers = pgTable("organization_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { length: 50 }).notNull().default("read-only"), // admin, contributor, approver, read-only
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cybersecurity frameworks
export const frameworks = pgTable("frameworks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 50 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Framework controls
export const controls = pgTable("controls", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameworkId: uuid("framework_id").notNull().references(() => frameworks.id, { onDelete: "cascade" }),
  controlId: varchar("control_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Framework control templates - defines what documents should be created for each control
export const controlTemplates = pgTable("control_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  controlId: uuid("control_id").notNull().references(() => controls.id, { onDelete: "cascade" }),
  documentTitle: varchar("document_title", { length: 500 }).notNull(),
  documentType: varchar("document_type", { length: 100 }).notNull(), // policy, standard, procedure, guideline, plan
  documentDescription: text("document_description"),
  contentTemplate: text("content_template"), // Optional template content
  createdAt: timestamp("created_at").defaultNow(),
});

// Organization framework activations
export const organizationFrameworks = pgTable("organization_frameworks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  frameworkId: uuid("framework_id").notNull().references(() => frameworks.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueOrgFramework: unique().on(table.organizationId, table.frameworkId),
}));

// GRC documents
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  version: varchar("version", { length: 50 }).default("1.0"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, pending, published, archived
  documentType: varchar("document_type", { length: 100 }), // policy, standard, procedure
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document versions for history
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Document control mappings
export const documentControls = pgTable("document_controls", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  controlId: uuid("control_id").notNull().references(() => controls.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Risk register
export const risks = pgTable("risks", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  riskId: varchar("risk_id", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  riskType: varchar("risk_type", { length: 50 }).default("asset"), // asset, scenario
  assetCategory: varchar("asset_category", { length: 100 }), // only for asset-based risks
  assetDescription: text("asset_description"), // only for asset-based risks
  confidentialityImpact: integer("confidentiality_impact").notNull(), // 1-5 scale
  integrityImpact: integer("integrity_impact").notNull(), // 1-5 scale
  availabilityImpact: integer("availability_impact").notNull(), // 1-5 scale
  impact: integer("impact").notNull(), // 1-5 scale (calculated average of CIA)
  likelihood: integer("likelihood").notNull(), // 1-5 scale
  riskScore: decimal("risk_score", { precision: 3, scale: 1 }), // calculated: impact * likelihood
  mitigationPlan: text("mitigation_plan"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, pending, published, archived
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Risk control mappings
export const riskControls = pgTable("risk_controls", {
  id: uuid("id").defaultRandom().primaryKey(),
  riskId: uuid("risk_id").notNull().references(() => risks.id, { onDelete: "cascade" }),
  controlId: uuid("control_id").notNull().references(() => controls.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Approval workflows
export const approvals = pgTable("approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // document, risk
  itemId: uuid("item_id").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected
  comments: text("comments"),
  submittedBy: varchar("submitted_by").notNull().references(() => users.id),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Maturity assessments
export const maturityAssessments = pgTable("maturity_assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  section: varchar("section", { length: 100 }).notNull(),
  standardRef: varchar("standard_ref", { length: 50 }).notNull(),
  question: text("question").notNull(),
  currentMaturityLevel: varchar("current_maturity_level", { length: 10 }).notNull(),
  currentMaturityScore: integer("current_maturity_score").notNull().default(0),
  currentComments: text("current_comments"),
  targetMaturityLevel: varchar("target_maturity_level", { length: 10 }).notNull(),
  targetMaturityScore: integer("target_maturity_score").notNull().default(0),
  targetComments: text("target_comments"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  updatedBy: varchar("updated_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  unique().on(table.organizationId, table.standardRef)
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizationUsers: many(organizationUsers),
  createdOrganizations: many(organizations),
  ownedDocuments: many(documents),
  createdDocuments: many(documents),
  ownedRisks: many(risks),
  createdRisks: many(risks),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [organizations.createdBy],
    references: [users.id],
  }),
  organizationUsers: many(organizationUsers),
  organizationFrameworks: many(organizationFrameworks),
  documents: many(documents),
  risks: many(risks),
  approvals: many(approvals),
}));

export const organizationUsersRelations = relations(organizationUsers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationUsers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationUsers.userId],
    references: [users.id],
  }),
}));

export const frameworksRelations = relations(frameworks, ({ many }) => ({
  controls: many(controls),
  organizationFrameworks: many(organizationFrameworks),
}));

export const controlsRelations = relations(controls, ({ one, many }) => ({
  framework: one(frameworks, {
    fields: [controls.frameworkId],
    references: [frameworks.id],
  }),
  documentControls: many(documentControls),
  riskControls: many(riskControls),
  controlTemplates: many(controlTemplates),
}));

export const controlTemplatesRelations = relations(controlTemplates, ({ one }) => ({
  control: one(controls, {
    fields: [controlTemplates.controlId],
    references: [controls.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [documents.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  documentVersions: many(documentVersions),
  documentControls: many(documentControls),
}));

export const risksRelations = relations(risks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [risks.organizationId],
    references: [organizations.id],
  }),
  owner: one(users, {
    fields: [risks.ownerId],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [risks.createdBy],
    references: [users.id],
  }),
  riskControls: many(riskControls),
}));

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertOrganization = typeof organizations.$inferInsert;
export type Organization = typeof organizations.$inferSelect;

export type InsertOrganizationUser = typeof organizationUsers.$inferInsert;
export type OrganizationUser = typeof organizationUsers.$inferSelect;

export type InsertFramework = typeof frameworks.$inferInsert;
export type Framework = typeof frameworks.$inferSelect;

export type InsertControl = typeof controls.$inferInsert;
export type Control = typeof controls.$inferSelect;

export type InsertControlTemplate = typeof controlTemplates.$inferInsert;
export type ControlTemplate = typeof controlTemplates.$inferSelect;

export type InsertDocument = typeof documents.$inferInsert;
export type Document = typeof documents.$inferSelect;

export type InsertRisk = typeof risks.$inferInsert;
export type Risk = typeof risks.$inferSelect;

export type InsertApproval = typeof approvals.$inferInsert;
export type Approval = typeof approvals.$inferSelect;

export type InsertMaturityAssessment = typeof maturityAssessments.$inferInsert;
export type MaturityAssessment = typeof maturityAssessments.$inferSelect;

// Zod schemas
// Temporarily disabled due to TypeScript errors
/*
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertRiskSchema = createInsertSchema(risks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
  riskScore: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});
*/
