import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { frameworks, controls, controlTemplates } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:P@ssw0rd@localhost:5432/auditalign';
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema: { frameworks, controls, controlTemplates } });

const DOCUMENTED_INFO_CONTROLS = [
  // Explicitly required
  { clause: '4.3', title: 'ISMS scope' },
  { clause: '5.2', title: 'Information security policy' },
  { clause: '6.1', title: 'Actions to address risks and opportunities' },
  { clause: '6.2', title: 'Information security objectives and plans' },
  { clause: '7.2', title: 'Competence' },
  { clause: '8.1', title: 'Operational planning and control' },
  { clause: '8.2', title: 'Information risk assessment' },
  { clause: '8.3', title: 'Information security risk treatment' },
  { clause: '9.1', title: 'Monitoring, measurement, analysis and evaluation' },
  { clause: '9.2', title: 'Internal audit' },
  { clause: '9.3', title: 'Management review' },
  { clause: '10.2', title: 'Non-conformity and corrective action' },
  { clause: '6.2', title: 'Terms and conditions of employment' },
  { clause: '5.9', title: 'Inventory of information and other associated assets' },
  { clause: '5.10', title: 'Acceptable use of information and other associated assets' },
  { clause: '5.15', title: 'Access control' },
  { clause: '5.37', title: 'Documented operating procedure' },
  { clause: '6.6', title: 'Confidentiality or non-disclosure agreement' },
  { clause: '8.27', title: 'Secure system architecture and engineering principles' },
  { clause: '5.19', title: 'Information security supplier relationships' },
  { clause: '5.26', title: 'Response to information security incidents' },
  { clause: '5.29', title: 'Information security during disruption' },
  { clause: '5.31', title: 'Legal, statutory, regulatory and contractual requirements' },
  // Implicitly required
  { clause: '7.4', title: 'Communication' },
  { clause: '7.5', title: 'Documented information' },
  { clause: '5.3', title: 'Organizational roles, responsibilities, and authorities' },
  { clause: '5.1', title: 'Leadership and commitment' },
  { clause: '10', title: 'Improvement' },
  { clause: 'A.6.7', title: 'Remote working' },
  { clause: 'A.5.12', title: 'Classification of information' },
  { clause: 'A.5.18', title: 'Access rights' },
  { clause: 'A.7.10', title: 'Storage media' },
  { clause: 'A.7.14', title: 'Secure disposal or re-use of equipment' },
  { clause: 'A.7.6', title: 'Working in secure areas' },
  { clause: 'A.7.7', title: 'Clear desk and clear screen' },
  { clause: 'A.8.32', title: 'Change management' },
  { clause: 'A.8.13', title: 'Information backup' },
  { clause: 'A.5.14', title: 'Information transfer' },
  { clause: 'A.8.14', title: 'Redundancy of information processing facilities' },
];

// Helper to assign document type based on title
function getDocumentType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('policy')) return 'Policy';
  if (lower.includes('procedure') || lower.includes('audit') || lower.includes('non-conformity') || lower.includes('incident') || lower.includes('change management') || lower.includes('supplier') || lower.includes('storage media') || lower.includes('disposal') || lower.includes('re-use') || lower.includes('transfer') || lower.includes('operational planning and control') || lower === 'internal audit' || lower === 'documented operating procedure' || lower === 'response to information security incidents' || lower === 'information security supplier relationships' || lower === 'secure disposal or re-use of equipment' || lower === 'information transfer' || lower === 'storage media' || lower === 'change management') return 'Procedure';
  if (lower.includes('guideline') || lower.includes('guidance') || lower.includes('communication') || lower.includes('remote working') || lower.includes('secure areas') || lower.includes('clear desk') || lower.includes('clear screen') || lower === 'acceptable use of information and other associated assets' || lower === 'working in secure areas' || lower === 'clear desk and clear screen') return 'Guideline';
  if (lower.includes('standard') || lower.includes('control') || lower.includes('classification') || lower.includes('roles') || lower.includes('responsibilities') || lower.includes('scope') || lower.includes('legal') || lower.includes('statutory') || lower.includes('regulatory') || lower.includes('contractual') || lower === 'documented information' || lower === 'organizational roles, responsibilities, and authorities' || lower === 'leadership and commitment' || lower === 'legal, statutory, regulatory and contractual requirements' || lower === 'classification of information' || lower === 'access rights' || lower === 'access control' || lower === 'competence') return 'Standard';
  // Strict enforcement: never return 'Documented Information' or any other type
  return 'Standard';
}

async function seedDocumentedInfo() {
  try {
    console.log('Seeding ISO 27001 Documented Information controls and templates...');
    // Find or create the ISO 27001 framework
    let framework = await db.select().from(frameworks).where(eq(frameworks.name, 'ISO27001')).limit(1);
    if (framework.length === 0) {
      const [newFramework] = await db.insert(frameworks).values({
        name: 'ISO27001',
        version: '2024',
        description: 'ISO/IEC 27001:2022 Information Security Management System',
        isActive: true
      }).returning();
      framework = [newFramework];
      console.log('Created ISO 27001 framework.');
    }
    const frameworkId = framework[0].id;
    // Create controls
    // Sort controls by clause number (numeric and alphanumeric)
    const clauseOrder = [
      '4.3', '5.1', '5.2', '5.3', '5.9', '5.10', '5.15', '5.19', '5.26', '5.29', '5.31', '5.37',
      '6.1', '6.2', '6.6', '7.2', '7.4', '7.5', '8.1', '8.2', '8.3', '8.27', '9.1', '9.2', '9.3',
      '10', '10.2',
      'A.5.12', 'A.5.14', 'A.5.18', 'A.6.7', 'A.7.6', 'A.7.7', 'A.7.10', 'A.7.14', 'A.8.13', 'A.8.14', 'A.8.32'
    ];
    const sortedControls = [...DOCUMENTED_INFO_CONTROLS].sort((a, b) => {
      const idxA = clauseOrder.indexOf(a.clause);
      const idxB = clauseOrder.indexOf(b.clause);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.clause.localeCompare(b.clause);
    });
    const controlsToCreate = sortedControls.map(info => ({
      frameworkId,
      controlId: info.clause,
      title: info.title,
      description: `Documented information required by ISO/IEC 27001 clause ${info.clause}: ${info.title}`,
      category: 'Documented Information'
    }));
    // Remove all existing controls/templates for this framework to avoid duplicates
    await db.delete(controls).where(eq(controls.frameworkId, frameworkId));
    await db.delete(controlTemplates).where(eq(controlTemplates.controlId, frameworkId));
    const createdControls = await db.insert(controls).values(controlsToCreate).returning();
    console.log(`Created ${createdControls.length} controls.`);
    // Create templates for each control using only the provided titles
    const templatesToCreate = createdControls.map((control) => ({
      controlId: control.id,
      documentTitle: control.title,
      documentType: getDocumentType(control.title),
      documentDescription: control.description,
      contentTemplate: `# ${control.title}\n\n## Clause\n${control.controlId}\n\n## Overview\nThis ${getDocumentType(control.title).toLowerCase()} is required for ISO/IEC 27001 compliance.\n\n## Purpose\nTo fulfill the requirements of clause ${control.controlId} for documented information.\n\n## Scope\nApplicable to all relevant stakeholders.\n\n## Content\n[Insert content specific to ${control.title}]\n\n## Review and Approval\n- Document Owner: [To be assigned]\n- Review Frequency: Annual\n- Next Review Date: [To be scheduled]\n- Approved by: [To be assigned]\n\n---\n*This template is part of the ISO 27001:2022 compliance framework implementation.*`
    }));
    await db.insert(controlTemplates).values(templatesToCreate);
    console.log(`Created ${templatesToCreate.length} templates.`);
  } catch (error) {
    console.error('Error seeding documented information:', error);
  } finally {
    await pool.end();
  }
}

seedDocumentedInfo();
