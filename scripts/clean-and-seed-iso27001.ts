import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { frameworks, controls, controlTemplates } from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config();

// Database connection for auditalign database
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:P@ssw0rd@localhost:5432/auditalign';
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema: { frameworks, controls, controlTemplates } });

const ISO27001_TEMPLATES = [
  {
    name: "Information Security Policy",
    description: "Comprehensive policy document outlining the organization's commitment to information security",
    category: "Policy"
  },
  {
    name: "Information Security Procedures",
    description: "Detailed procedures for implementing information security controls",
    category: "Procedure"
  },
  {
    name: "Risk Assessment Methodology",
    description: "Framework for conducting systematic information security risk assessments",
    category: "Methodology"
  },
  {
    name: "Risk Treatment Plan",
    description: "Plan for addressing identified information security risks",
    category: "Plan"
  },
  {
    name: "Asset Inventory Register",
    description: "Comprehensive inventory of all information assets",
    category: "Register"
  },
  {
    name: "Asset Classification Guidelines",
    description: "Guidelines for classifying information assets based on sensitivity",
    category: "Guidelines"
  },
  {
    name: "Human Resources Security Policy",
    description: "Policy covering security aspects of human resources management",
    category: "Policy"
  },
  {
    name: "Security Awareness Training Program",
    description: "Comprehensive training program for information security awareness",
    category: "Program"
  },
  {
    name: "Physical Security Policy",
    description: "Policy for securing physical facilities and equipment",
    category: "Policy"
  },
  {
    name: "Access Control Procedures",
    description: "Procedures for managing user access to information systems",
    category: "Procedure"
  },
  {
    name: "Password Policy",
    description: "Policy defining password requirements and management",
    category: "Policy"
  },
  {
    name: "Network Security Policy",
    description: "Policy for securing network infrastructure and communications",
    category: "Policy"
  },
  {
    name: "Cryptographic Controls Standard",
    description: "Standard for implementing cryptographic controls",
    category: "Standard"
  },
  {
    name: "System Security Procedures",
    description: "Procedures for securing information systems",
    category: "Procedure"
  },
  {
    name: "Secure Development Guidelines",
    description: "Guidelines for secure application development",
    category: "Guidelines"
  },
  {
    name: "Vulnerability Management Procedure",
    description: "Procedure for identifying and managing security vulnerabilities",
    category: "Procedure"
  },
  {
    name: "Supplier Relationship Security Policy",
    description: "Policy for managing information security in supplier relationships",
    category: "Policy"
  },
  {
    name: "Information Security Incident Management Procedure",
    description: "Procedure for handling information security incidents",
    category: "Procedure"
  },
  {
    name: "Business Continuity Plan",
    description: "Plan for maintaining business operations during disruptions",
    category: "Plan"
  },
  {
    name: "Information Security Compliance Checklist",
    description: "Checklist for verifying compliance with information security requirements",
    category: "Checklist"
  },
  {
    name: "Security Monitoring and Logging Standard",
    description: "Standard for security event monitoring and logging",
    category: "Standard"
  },
  {
    name: "Data Backup and Recovery Procedure",
    description: "Procedure for backing up and recovering critical data",
    category: "Procedure"
  },
  {
    name: "Mobile Device Security Policy",
    description: "Policy for securing mobile devices and BYOD",
    category: "Policy"
  },
  {
    name: "Cloud Security Guidelines",
    description: "Guidelines for securing cloud-based services",
    category: "Guidelines"
  },
  {
    name: "Privacy and Data Protection Policy",
    description: "Policy for protecting personal and sensitive data",
    category: "Policy"
  },
  {
    name: "Security Architecture Standard",
    description: "Standard for designing secure IT architecture",
    category: "Standard"
  },
  {
    name: "Penetration Testing Procedure",
    description: "Procedure for conducting security penetration tests",
    category: "Procedure"
  },
  {
    name: "Security Metrics and KPI Dashboard",
    description: "Framework for measuring information security performance",
    category: "Framework"
  },
  {
    name: "Third-Party Security Assessment Checklist",
    description: "Checklist for assessing third-party security controls",
    category: "Checklist"
  },
  {
    name: "Incident Response Playbook",
    description: "Detailed playbook for responding to security incidents",
    category: "Playbook"
  },
  {
    name: "Security Configuration Standards",
    description: "Standards for secure configuration of systems and applications",
    category: "Standard"
  },
  {
    name: "Digital Forensics Procedure",
    description: "Procedure for conducting digital forensic investigations",
    category: "Procedure"
  },
  {
    name: "Security Audit Program",
    description: "Program for conducting regular security audits",
    category: "Program"
  },
  {
    name: "Acceptable Use Policy",
    description: "Policy defining acceptable use of IT resources",
    category: "Policy"
  },
  {
    name: "Change Management Security Procedure",
    description: "Procedure for managing security aspects of system changes",
    category: "Procedure"
  },
  {
    name: "Secure Disposal Procedure",
    description: "Procedure for securely disposing of information and media",
    category: "Procedure"
  },
  {
    name: "Security Communication Plan",
    description: "Plan for communicating security information to stakeholders",
    category: "Plan"
  },
  {
    name: "Remote Work Security Guidelines",
    description: "Guidelines for maintaining security while working remotely",
    category: "Guidelines"
  },
  {
    name: "Management Review Report Template",
    description: "Template for management review of the information security management system",
    category: "Template"
  }
];

async function cleanAndSeedISO27001() {
  try {
    console.log('Starting clean ISO 27001 setup...');

    // Find existing ISO 27001 framework
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.name, 'ISO27001'))
      .limit(1);

    if (existingFramework.length > 0) {
      console.log('Found existing ISO 27001 framework. Deleting it...');
      // Delete the framework (cascading will remove controls and templates)
      await db
        .delete(frameworks)
        .where(eq(frameworks.id, existingFramework[0].id));
      console.log('Existing ISO 27001 framework deleted.');
    }

    // Create new ISO 27001 framework
    console.log('Creating new ISO 27001 framework...');
    const [newFramework] = await db
      .insert(frameworks)
      .values({
        name: 'ISO27001',
        version: '2022',
        description: 'ISO/IEC 27001:2022 Information Security Management System with 39 comprehensive document templates',
        isActive: true
      })
      .returning();

    console.log(`Created ISO 27001 framework with ID: ${newFramework.id}`);

    // Create 39 individual controls for each template
    console.log('Creating 39 controls...');
    const controlsToCreate = ISO27001_TEMPLATES.map((template, index) => ({
      frameworkId: newFramework.id,
      controlId: `A.${(index + 1).toString().padStart(2, '0')}`,
      title: template.name,
      description: template.description,
      category: template.category
    }));

    const createdControls = await db
      .insert(controls)
      .values(controlsToCreate)
      .returning();

    console.log(`Created ${createdControls.length} controls`);

    // Create templates for each control
    console.log('Creating document templates...');
    const templatesToCreate = createdControls.map((control, index) => ({
      controlId: control.id,
      documentTitle: ISO27001_TEMPLATES[index].name,
      documentType: ISO27001_TEMPLATES[index].category,
      documentDescription: ISO27001_TEMPLATES[index].description,
      contentTemplate: `# ${ISO27001_TEMPLATES[index].name}

## Overview
${ISO27001_TEMPLATES[index].description}

## Purpose
This ${ISO27001_TEMPLATES[index].category.toLowerCase()} provides guidance for implementing the ${ISO27001_TEMPLATES[index].name} as part of the ISO 27001 Information Security Management System.

## Scope
This document applies to all employees, contractors, and third parties who have access to [Organization Name]'s information assets.

## Content
[Template content would be detailed here based on the specific ${ISO27001_TEMPLATES[index].category.toLowerCase()} requirements]

## Implementation Guidelines
1. Customize this template to fit your organization's specific needs
2. Ensure alignment with your organization's risk appetite and security objectives
3. Review and update regularly to maintain effectiveness
4. Train relevant personnel on the requirements and procedures

## Related Documents
- Information Security Policy
- Risk Management Framework
- Business Continuity Plan

## Review and Approval
- Document Owner: [To be assigned]
- Review Frequency: Annual
- Next Review Date: [To be scheduled]
- Approved by: [To be assigned]

---
*This template is part of the ISO 27001:2022 compliance framework implementation.*`
    }));

    const createdTemplates = await db
      .insert(controlTemplates)
      .values(templatesToCreate)
      .returning();

    console.log(`Successfully created ${createdTemplates.length} ISO 27001 templates`);
    console.log('✅ ISO 27001 framework setup completed successfully!');
    
    // Verify the setup
    const finalFrameworks = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.name, 'ISO27001'));
      
    const finalControls = await db
      .select()
      .from(controls)
      .where(eq(controls.frameworkId, newFramework.id));
      
    const finalTemplates = await db
      .select()
      .from(controlTemplates)
      .innerJoin(controls, eq(controlTemplates.controlId, controls.id))
      .where(eq(controls.frameworkId, newFramework.id));

    console.log(`\n📊 Final Summary:`);
    console.log(`   Frameworks: ${finalFrameworks.length}`);
    console.log(`   Controls: ${finalControls.length}`);
    console.log(`   Templates: ${finalTemplates.length}`);

  } catch (error) {
    console.error('❌ Error setting up ISO 27001 framework:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
cleanAndSeedISO27001();
