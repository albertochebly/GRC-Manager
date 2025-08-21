import { db } from "../server/db.js";
import { frameworks, controls, controlTemplates } from "../shared/schema.js";
import { eq } from "drizzle-orm";

async function seedISO27001Templates() {
  console.log("🌱 Seeding ISO 27001 document templates...");

  try {
    // Find the ISO 27001 framework
    const isoFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.name, "ISO 27001"))
      .limit(1);

    if (isoFramework.length === 0) {
      console.log("❌ ISO 27001 framework not found. Please run seed-frameworks-templates.ts first.");
      return;
    }

    const frameworkId = isoFramework[0].id;
    console.log(`✅ Found ISO 27001 Framework: ${frameworkId}`);

    // Define the comprehensive list of ISO 27001 controls and templates
    const iso27001Templates = [
      // Main clauses (4-10)
      { clause: "4.3", title: "ISMS scope", type: "procedure" },
      { clause: "5.2", title: "Information security policy", type: "policy" },
      { clause: "6.1", title: "Actions to address risks and opportunities", type: "procedure" },
      { clause: "6.2", title: "Information security objectives and plans", type: "plan" },
      { clause: "7.2", title: "Competence", type: "procedure" },
      { clause: "8.1", title: "Operational planning and control", type: "procedure" },
      { clause: "8.2", title: "Information risk assessment", type: "procedure" },
      { clause: "8.3", title: "Information security risk treatment", type: "procedure" },
      { clause: "9.1", title: "Monitoring, measurement, analysis and evaluation", type: "procedure" },
      { clause: "9.2", title: "Internal audit", type: "procedure" },
      { clause: "9.3", title: "Management review", type: "procedure" },
      { clause: "10.2", title: "Non-conformity and corrective action", type: "procedure" },

      // Employment and people controls
      { clause: "6.2", title: "Terms and conditions of employment", type: "policy" },
      { clause: "A.6.7", title: "Remote working", type: "policy" },

      // Asset management
      { clause: "5.9", title: "Inventory of information and other associated assets", type: "procedure" },
      { clause: "5.10", title: "Acceptable use of information and other associated assets", type: "policy" },
      { clause: "A.5.12", title: "Classification of information", type: "procedure" },

      // Access control
      { clause: "5.15", title: "Access control", type: "policy" },
      { clause: "A.5.18", title: "Access rights", type: "procedure" },
      { clause: "6.6", title: "Confidentiality or non-disclosure agreement", type: "policy" },

      // Physical and environmental security
      { clause: "A.7.6", title: "Working in secure areas", type: "procedure" },
      { clause: "A.7.7", title: "Clear desk and clear screen", type: "policy" },
      { clause: "A.7.10", title: "Storage media", type: "procedure" },
      { clause: "A.7.14", title: "Secure disposal or re-use of equipment", type: "procedure" },

      // Operations security
      { clause: "5.37", title: "Documented operating procedure", type: "procedure" },
      { clause: "A.8.13", title: "Information backup", type: "procedure" },
      { clause: "A.8.14", title: "Redundancy of information processing facilities", type: "procedure" },
      { clause: "A.8.32", title: "Change management", type: "procedure" },

      // Systems acquisition and development
      { clause: "8.27", title: "Secure system architecture and engineering principles", type: "standard" },

      // Supplier relationships
      { clause: "5.19", title: "Information security supplier relationships", type: "policy" },

      // Incident management
      { clause: "5.26", title: "Response to information security incidents", type: "plan" },

      // Business continuity
      { clause: "5.29", title: "Information security during disruption", type: "plan" },

      // Compliance
      { clause: "5.31", title: "Legal, statutory, regulatory and contractual requirements", type: "policy" },

      // Communications and documentation
      { clause: "7.4", title: "Communication", type: "procedure" },
      { clause: "7.5", title: "Documented information", type: "procedure" },

      // Leadership and governance
      { clause: "5.3", title: "Organizational roles, responsibilities, and authorities", type: "policy" },
      { clause: "5.1", title: "Leadership and commitment", type: "policy" },
      { clause: "10", title: "Improvement", type: "procedure" },

      // Information transfer
      { clause: "5.14", title: "Information transfer", type: "procedure" },
    ];

    // First, create or find controls for each template
    const createdControls: any[] = [];
    
    for (const template of iso27001Templates) {
      // Check if control already exists
      const existingControl = await db
        .select()
        .from(controls)
        .where(eq(controls.controlId, template.clause))
        .where(eq(controls.frameworkId, frameworkId))
        .limit(1);

      if (existingControl.length > 0) {
        createdControls.push(existingControl[0]);
        console.log(`✅ Found existing control: ${template.clause} - ${template.title}`);
      } else {
        // Create new control
        const [newControl] = await db
          .insert(controls)
          .values({
            frameworkId,
            controlId: template.clause,
            title: template.title,
            description: `Implementation guidance for ${template.title} as per ISO 27001 clause ${template.clause}`,
            category: getCategory(template.clause),
          })
          .returning();
        
        createdControls.push(newControl);
        console.log(`➕ Created new control: ${template.clause} - ${template.title}`);
      }
    }

    // Now create control templates
    const templatesToCreate: any[] = [];
    
    for (let i = 0; i < iso27001Templates.length; i++) {
      const template = iso27001Templates[i];
      const control = createdControls[i];

      // Check if template already exists
      const existingTemplate = await db
        .select()
        .from(controlTemplates)
        .where(eq(controlTemplates.controlId, control.id))
        .where(eq(controlTemplates.documentTitle, template.title))
        .limit(1);

      if (existingTemplate.length === 0) {
        templatesToCreate.push({
          controlId: control.id,
          documentTitle: template.title,
          documentType: template.type,
          documentDescription: `${template.title} document as required by ISO 27001 clause ${template.clause}`,
          contentTemplate: generateContentTemplate(template.title, template.clause, template.type),
        });
      } else {
        console.log(`✅ Template already exists: ${template.title}`);
      }
    }

    if (templatesToCreate.length > 0) {
      await db
        .insert(controlTemplates)
        .values(templatesToCreate);

      console.log(`✅ Created ${templatesToCreate.length} new ISO 27001 document templates`);
    } else {
      console.log("✅ All templates already exist");
    }

    console.log("🎉 Successfully seeded ISO 27001 templates!");
    
  } catch (error) {
    console.error("❌ Error seeding ISO 27001 templates:", error);
    throw error;
  }
}

function getCategory(clause: string): string {
  if (clause.startsWith("4")) return "Context of the Organization";
  if (clause.startsWith("5.1") || clause.startsWith("5.2") || clause.startsWith("5.3")) return "Leadership";
  if (clause.startsWith("6")) return "Planning";
  if (clause.startsWith("7")) return "Support";
  if (clause.startsWith("8")) return "Operation";
  if (clause.startsWith("9")) return "Performance Evaluation";
  if (clause.startsWith("10")) return "Improvement";
  if (clause.startsWith("A.5")) return "Organizational Controls";
  if (clause.startsWith("A.6")) return "People Controls";
  if (clause.startsWith("A.7")) return "Physical and Environmental Security Controls";
  if (clause.startsWith("A.8")) return "Technological Controls";
  return "General Controls";
}

function generateContentTemplate(title: string, clause: string, type: string): string {
  const baseTemplate = `<h1>${title}</h1>
<h2>Purpose</h2>
<p>This document fulfills the requirements of ISO 27001 clause ${clause} - ${title}.</p>

<h2>Scope</h2>
<p>This ${type} applies to all areas within the organization's Information Security Management System (ISMS) scope.</p>

<h2>Responsibilities</h2>
<ul>
<li><strong>Information Security Manager:</strong> Overall responsibility for implementation and maintenance</li>
<li><strong>Department Heads:</strong> Ensure compliance within their respective departments</li>
<li><strong>All Personnel:</strong> Follow the requirements outlined in this ${type}</li>
</ul>`;

  // Add specific content based on document type and title
  if (type === "policy") {
    return baseTemplate + `

<h2>Policy Statements</h2>
<ul>
<li>The organization is committed to maintaining the highest standards of information security</li>
<li>All personnel must comply with this policy and supporting procedures</li>
<li>Regular reviews and updates will be conducted to ensure continued effectiveness</li>
<li>Non-compliance may result in disciplinary action</li>
</ul>

<h2>Implementation</h2>
<p>This policy is implemented through supporting procedures, standards, and guidelines.</p>

<h2>Review and Updates</h2>
<p>This policy will be reviewed annually or when significant changes occur to ensure its continued suitability and effectiveness.</p>`;
  } else if (type === "procedure") {
    return baseTemplate + `

<h2>Procedure Steps</h2>
<ol>
<li><strong>Planning:</strong> Define objectives and requirements</li>
<li><strong>Implementation:</strong> Execute the planned activities</li>
<li><strong>Monitoring:</strong> Track progress and effectiveness</li>
<li><strong>Review:</strong> Evaluate results and identify improvements</li>
<li><strong>Documentation:</strong> Record activities and outcomes</li>
</ol>

<h2>Controls and Measures</h2>
<p>Specific controls and measures will be defined based on the organization's risk assessment and business requirements.</p>

<h2>Monitoring and Measurement</h2>
<p>Regular monitoring will be conducted to ensure the effectiveness of this procedure.</p>`;
  } else if (type === "plan") {
    return baseTemplate + `

<h2>Objectives</h2>
<ul>
<li>Define clear goals and targets</li>
<li>Establish timelines and milestones</li>
<li>Assign resources and responsibilities</li>
<li>Implement monitoring and reporting mechanisms</li>
</ul>

<h2>Implementation Strategy</h2>
<p>The plan will be implemented in phases with regular review points to ensure progress toward objectives.</p>

<h2>Success Criteria</h2>
<p>Success will be measured against defined metrics and key performance indicators.</p>`;
  } else if (type === "standard") {
    return baseTemplate + `

<h2>Technical Requirements</h2>
<p>This standard defines the technical requirements and specifications for implementation.</p>

<h2>Implementation Guidelines</h2>
<ul>
<li>Follow industry best practices and standards</li>
<li>Ensure compatibility with existing systems</li>
<li>Implement appropriate security controls</li>
<li>Document all configurations and changes</li>
</ul>

<h2>Compliance and Testing</h2>
<p>Regular testing and validation will be conducted to ensure compliance with this standard.</p>`;
  }

  return baseTemplate;
}

// Run the seeding function
seedISO27001Templates()
  .then(() => {
    console.log("✅ ISO 27001 templates seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error in ISO 27001 templates seeding:", error);
    process.exit(1);
  });
