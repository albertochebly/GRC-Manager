#!/usr/bin/env tsx

import { config } from "dotenv";
config();

import { db } from "../server/db";
import { frameworks, controls, controlTemplates } from "../shared/schema";
import { eq, and } from "drizzle-orm";

const iso27001ControlsMapping = [
  // Mandatory Clauses
  { controlId: "4.3", title: "ISMS scope", category: "Mandatory Clauses" },
  { controlId: "5.2", title: "Information security policy", category: "Mandatory Clauses" },
  { controlId: "6.1", title: "Actions to address risks and opportunities", category: "Mandatory Clauses" },
  { controlId: "6.2", title: "Information security objectives and plans", category: "Mandatory Clauses" },
  { controlId: "7.2", title: "Competence", category: "Mandatory Clauses" },
  { controlId: "8.1", title: "Operational planning and control", category: "Mandatory Clauses" },
  { controlId: "8.2", title: "Information risk assessment", category: "Mandatory Clauses" },
  { controlId: "8.3", title: "Information security risk treatment", category: "Mandatory Clauses" },
  { controlId: "9.1", title: "Monitoring, measurement, analysis and evaluation", category: "Mandatory Clauses" },
  { controlId: "9.2", title: "Internal audit", category: "Mandatory Clauses" },
  { controlId: "9.3", title: "Management review", category: "Mandatory Clauses" },
  { controlId: "10.2", title: "Non-conformity and corrective action", category: "Mandatory Clauses" },
  { controlId: "6.2.1", title: "Terms and conditions of employment", category: "People Controls" },
  { controlId: "5.9", title: "Inventory of information and other associated assets", category: "Organizational Controls" },
  { controlId: "5.10", title: "Acceptable use of information and other associated assets", category: "Organizational Controls" },
  { controlId: "5.15", title: "Access control", category: "Organizational Controls" },
  { controlId: "5.37", title: "Documented operating procedure", category: "Organizational Controls" },
  { controlId: "6.6", title: "Confidentiality or non-disclosure agreement", category: "People Controls" },
  { controlId: "8.27", title: "Secure system architecture and engineering principles", category: "Technological Controls" },
  { controlId: "5.19", title: "Information security supplier relationships", category: "Organizational Controls" },
  { controlId: "5.26", title: "Response to information security incidents", category: "Organizational Controls" },
  { controlId: "5.29", title: "Information security during disruption", category: "Organizational Controls" },
  { controlId: "5.31", title: "Legal, statutory, regulatory and contractual requirements", category: "Organizational Controls" },
  { controlId: "7.4", title: "Communication", category: "Support" },
  { controlId: "7.5", title: "Documented information", category: "Support" },
  { controlId: "5.3", title: "Organizational roles, responsibilities, and authorities", category: "Organizational Controls" },
  { controlId: "5.1", title: "Leadership and commitment", category: "Leadership" },
  { controlId: "10", title: "Improvement", category: "Improvement" },
  { controlId: "A.6.7", title: "Remote working", category: "People Controls" },
  { controlId: "A.5.12", title: "Classification of information", category: "Organizational Controls" },
  { controlId: "A.5.18", title: "Access rights", category: "Organizational Controls" },
  { controlId: "A.7.10", title: "Storage media", category: "Physical Controls" },
  { controlId: "A.7.14", title: "Secure disposal or re-use of equipment", category: "Physical Controls" },
  { controlId: "A.7.6", title: "Working in secure areas", category: "Physical Controls" },
  { controlId: "A.7.7", title: "Clear desk and clear screen", category: "Physical Controls" },
  { controlId: "A.8.32", title: "Change management", category: "Technological Controls" },
  { controlId: "A.8.13", title: "Information backup", category: "Technological Controls" },
  { controlId: "A.5.14", title: "Information transfer", category: "Organizational Controls" },
  { controlId: "A.8.14", title: "Redundancy of information processing facilities", category: "Technological Controls" }
];

async function fixISO27001Controls() {
  try {
    console.log("🔧 Fixing ISO 27001 controls and templates...");

    // Find the ISO 27001 framework
    const iso27001Framework = await db
      .select()
      .from(frameworks)
      .where(
        and(
          eq(frameworks.name, "ISO 27001"),
          eq(frameworks.version, "2013"),
          eq(frameworks.isActive, true)
        )
      )
      .limit(1);

    if (iso27001Framework.length === 0) {
      throw new Error("ISO 27001 framework not found");
    }

    const frameworkId = iso27001Framework[0].id;
    console.log(`✅ Found ISO 27001 Framework: ${frameworkId}`);

    // Get all existing templates that need to be redistributed
    const existingTemplates = await db
      .select()
      .from(controlTemplates)
      .innerJoin(controls, eq(controlTemplates.controlId, controls.id))
      .where(eq(controls.frameworkId, frameworkId));

    console.log(`📋 Found ${existingTemplates.length} existing templates`);

    // Create a mapping from document title to template data
    const templatesByTitle = existingTemplates.reduce((acc, template) => {
      acc[template.control_templates.documentTitle] = template.control_templates;
      return acc;
    }, {} as Record<string, any>);

    // Delete all existing controls and templates for this framework
    // First get all control IDs for this framework
    const frameworkControls = await db
      .select({ id: controls.id })
      .from(controls)
      .where(eq(controls.frameworkId, frameworkId));

    const controlIds = frameworkControls.map(c => c.id);

    // Delete templates first
    for (const controlId of controlIds) {
      await db.delete(controlTemplates).where(eq(controlTemplates.controlId, controlId));
    }

    // Then delete controls
    await db.delete(controls).where(eq(controls.frameworkId, frameworkId));

    console.log("🗑️ Cleaned up existing controls and templates");

    // Create new controls for each mapping
    for (const control of iso27001ControlsMapping) {
      // Create the control
      const newControl = await db
        .insert(controls)
        .values({
          frameworkId,
          controlId: control.controlId,
          title: control.title,
          description: `ISO 27001 control ${control.controlId}: ${control.title}`,
          category: control.category,
        })
        .returning();

      const controlDbId = newControl[0].id;

      // Check if there's a template with matching title
      const matchingTemplate = templatesByTitle[control.title];
      if (matchingTemplate) {
        await db
          .insert(controlTemplates)
          .values({
            controlId: controlDbId,
            documentTitle: matchingTemplate.documentTitle,
            documentType: matchingTemplate.documentType,
            documentDescription: matchingTemplate.documentDescription,
            contentTemplate: matchingTemplate.contentTemplate,
          });

        console.log(`✅ Created control ${control.controlId} with template: ${control.title}`);
      } else {
        console.log(`ℹ️ Created control ${control.controlId} without template: ${control.title}`);
      }
    }

    console.log("🎉 Successfully fixed ISO 27001 controls and templates!");
    console.log(`✅ Created ${iso27001ControlsMapping.length} controls`);
    
  } catch (error) {
    console.error("❌ Error fixing ISO 27001 controls:", error);
    throw error;
  }
}

// Run the fix
fixISO27001Controls()
  .then(() => {
    console.log("✅ ISO 27001 controls fix completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ ISO 27001 controls fix failed:", error);
    process.exit(1);
  });
