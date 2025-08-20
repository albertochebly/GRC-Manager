import { db } from "../server/db";
import { frameworks, controls, controlTemplates } from "../shared/schema";

async function seedFrameworksAndTemplates() {
  console.log("🌱 Seeding frameworks and control templates...");

  try {
    // Create NIST Cybersecurity Framework
    const [nistFramework] = await db
      .insert(frameworks)
      .values({
        name: "NIST Cybersecurity Framework",
        version: "1.1",
        description: "A framework for improving critical infrastructure cybersecurity",
        isActive: true,
      })
      .returning();

    console.log("✅ Created NIST Framework:", nistFramework.id);

    // Create some sample controls for NIST
    const nistControls = [
      {
        frameworkId: nistFramework.id,
        controlId: "ID.AM-1",
        title: "Physical devices and systems within the organization are inventoried",
        description: "Maintain an accurate inventory of all physical devices and systems within the organization",
        category: "Identify",
      },
      {
        frameworkId: nistFramework.id,
        controlId: "ID.AM-2",
        title: "Software platforms and applications within the organization are inventoried",
        description: "Maintain an accurate inventory of all software platforms and applications within the organization",
        category: "Identify",
      },
      {
        frameworkId: nistFramework.id,
        controlId: "PR.AC-1",
        title: "Identities and credentials are issued, managed, verified, revoked, and audited",
        description: "Establish and maintain processes for identity and credential management",
        category: "Protect",
      },
      {
        frameworkId: nistFramework.id,
        controlId: "PR.AC-4",
        title: "Access permissions and authorizations are managed, incorporating the principles of least privilege",
        description: "Implement access controls based on the principle of least privilege",
        category: "Protect",
      },
      {
        frameworkId: nistFramework.id,
        controlId: "DE.CM-1",
        title: "The network is monitored to detect potential cybersecurity events",
        description: "Implement continuous monitoring of network traffic and activities",
        category: "Detect",
      }
    ];

    const createdControls = await db
      .insert(controls)
      .values(nistControls)
      .returning();

    console.log(`✅ Created ${createdControls.length} NIST controls`);

    // Create control templates
    const templates = [
      // ID.AM-1 templates
      {
        controlId: createdControls[0].id,
        documentTitle: "Physical Asset Inventory Policy",
        documentType: "policy",
        documentDescription: "Policy for maintaining accurate physical asset inventory",
        contentTemplate: "<h1>Physical Asset Inventory Policy</h1><h2>Purpose</h2><p>This policy establishes requirements for maintaining an accurate inventory of all physical devices and systems within the organization.</p><h2>Scope</h2><p>This policy applies to all physical assets including servers, workstations, network equipment, and mobile devices.</p><h2>Requirements</h2><ul><li>All physical assets must be tagged and recorded in the asset management system</li><li>Asset inventory must be updated within 24 hours of acquisition or disposal</li><li>Quarterly asset audits must be conducted</li></ul>"
      },
      {
        controlId: createdControls[0].id,
        documentTitle: "Asset Inventory Management Procedure",
        documentType: "procedure",
        documentDescription: "Step-by-step procedure for managing physical asset inventory",
        contentTemplate: "<h1>Asset Inventory Management Procedure</h1><h2>Overview</h2><p>This procedure outlines the steps for maintaining the physical asset inventory.</p><h2>Steps</h2><ol><li>Identify new asset</li><li>Assign unique asset tag</li><li>Record asset details in inventory system</li><li>Schedule asset for regular audits</li></ol>"
      },
      // ID.AM-2 templates
      {
        controlId: createdControls[1].id,
        documentTitle: "Software Asset Management Policy",
        documentType: "policy",
        documentDescription: "Policy for maintaining software inventory and licensing compliance",
        contentTemplate: "<h1>Software Asset Management Policy</h1><h2>Purpose</h2><p>This policy ensures proper management of software assets and licensing compliance.</p><h2>Requirements</h2><ul><li>All software installations must be authorized and licensed</li><li>Software inventory must be maintained and regularly audited</li><li>Unauthorized software must be removed immediately</li></ul>"
      },
      // PR.AC-1 templates
      {
        controlId: createdControls[2].id,
        documentTitle: "Identity and Access Management Policy",
        documentType: "policy",
        documentDescription: "Comprehensive policy for identity and access management",
        contentTemplate: "<h1>Identity and Access Management Policy</h1><h2>Purpose</h2><p>This policy establishes requirements for managing user identities and access credentials.</p><h2>Requirements</h2><ul><li>User accounts must be provisioned through formal request process</li><li>Passwords must meet complexity requirements</li><li>User access must be reviewed quarterly</li><li>Terminated users must have access revoked immediately</li></ul>"
      },
      {
        controlId: createdControls[2].id,
        documentTitle: "User Access Provisioning Procedure",
        documentType: "procedure",
        documentDescription: "Step-by-step procedure for provisioning user access",
        contentTemplate: "<h1>User Access Provisioning Procedure</h1><h2>Steps</h2><ol><li>Receive and validate access request</li><li>Verify manager approval</li><li>Create user account with appropriate permissions</li><li>Notify user of account creation</li><li>Schedule access review</li></ol>"
      },
      // PR.AC-4 templates
      {
        controlId: createdControls[3].id,
        documentTitle: "Least Privilege Access Control Standard",
        documentType: "standard",
        documentDescription: "Technical standard for implementing least privilege access controls",
        contentTemplate: "<h1>Least Privilege Access Control Standard</h1><h2>Principle</h2><p>Users should be granted the minimum levels of access necessary to perform their job functions.</p><h2>Implementation</h2><ul><li>Role-based access control (RBAC) must be implemented</li><li>Default access should be deny-all</li><li>Access requests must include business justification</li><li>Privileged access requires additional approval</li></ul>"
      },
      // DE.CM-1 templates
      {
        controlId: createdControls[4].id,
        documentTitle: "Network Monitoring Plan",
        documentType: "plan",
        documentDescription: "Comprehensive plan for continuous network monitoring",
        contentTemplate: "<h1>Network Monitoring Plan</h1><h2>Objectives</h2><ul><li>Detect unauthorized network activity</li><li>Identify potential security incidents</li><li>Monitor network performance and availability</li></ul><h2>Monitoring Tools</h2><ul><li>SIEM system for log analysis</li><li>Network intrusion detection system (NIDS)</li><li>Network flow monitoring</li></ul><h2>Response Procedures</h2><p>When suspicious activity is detected, follow the incident response procedure.</p>"
      },
      {
        controlId: createdControls[4].id,
        documentTitle: "Network Monitoring Configuration Guideline",
        documentType: "guideline",
        documentDescription: "Technical guidelines for configuring network monitoring tools",
        contentTemplate: "<h1>Network Monitoring Configuration Guideline</h1><h2>SIEM Configuration</h2><ul><li>Configure log collection from all network devices</li><li>Set up correlation rules for common attack patterns</li><li>Configure alerting thresholds</li></ul><h2>NIDS Configuration</h2><ul><li>Deploy sensors at network perimeter and critical segments</li><li>Update signature databases regularly</li><li>Configure custom rules for organization-specific threats</li></ul>"
      }
    ];

    const createdTemplates = await db
      .insert(controlTemplates)
      .values(templates)
      .returning();

    console.log(`✅ Created ${createdTemplates.length} control templates`);

    // Create ISO 27001 Framework
    const [isoFramework] = await db
      .insert(frameworks)
      .values({
        name: "ISO 27001:2013",
        version: "2013",
        description: "International standard for information security management systems",
        isActive: true,
      })
      .returning();

    console.log("✅ Created ISO 27001 Framework:", isoFramework.id);

    // Create some sample controls for ISO 27001
    const isoControls = [
      {
        frameworkId: isoFramework.id,
        controlId: "A.9.1.1",
        title: "Access control policy",
        description: "An access control policy shall be established, documented and reviewed",
        category: "Access Control",
      },
      {
        frameworkId: isoFramework.id,
        controlId: "A.12.1.1",
        title: "Documented operating procedures",
        description: "Operating procedures shall be documented and made available to all users",
        category: "Operations Security",
      },
      {
        frameworkId: isoFramework.id,
        controlId: "A.16.1.1",
        title: "Responsibilities and procedures",
        description: "Management responsibilities and procedures shall be established to ensure a quick response to security incidents",
        category: "Information Security Incident Management",
      }
    ];

    const createdIsoControls = await db
      .insert(controls)
      .values(isoControls)
      .returning();

    console.log(`✅ Created ${createdIsoControls.length} ISO 27001 controls`);

    // Create ISO control templates
    const isoTemplates = [
      {
        controlId: createdIsoControls[0].id,
        documentTitle: "Access Control Policy",
        documentType: "policy",
        documentDescription: "Comprehensive access control policy per ISO 27001 A.9.1.1",
        contentTemplate: "<h1>Access Control Policy</h1><h2>Purpose</h2><p>This policy defines the organization's approach to controlling access to information and information processing facilities.</p><h2>Policy Statements</h2><ul><li>Access to information and information processing facilities shall be restricted to authorized users</li><li>All access shall be based on business need and principle of least privilege</li><li>Access rights shall be reviewed regularly</li></ul>"
      },
      {
        controlId: createdIsoControls[1].id,
        documentTitle: "IT Operations Manual",
        documentType: "procedure",
        documentDescription: "Documented procedures for IT operations per ISO 27001 A.12.1.1",
        contentTemplate: "<h1>IT Operations Manual</h1><h2>Purpose</h2><p>This manual documents operating procedures for IT systems and services.</p><h2>Procedures</h2><ul><li>System startup and shutdown procedures</li><li>Backup and recovery procedures</li><li>Change management procedures</li><li>Incident response procedures</li></ul>"
      },
      {
        controlId: createdIsoControls[2].id,
        documentTitle: "Information Security Incident Response Plan",
        documentType: "plan",
        documentDescription: "Incident response plan per ISO 27001 A.16.1.1",
        contentTemplate: "<h1>Information Security Incident Response Plan</h1><h2>Objectives</h2><ul><li>Ensure quick and effective response to security incidents</li><li>Minimize impact of security incidents</li><li>Preserve evidence for forensic analysis</li></ul><h2>Incident Response Team</h2><p>Define roles and responsibilities of the incident response team.</p><h2>Response Procedures</h2><ol><li>Incident detection and reporting</li><li>Initial assessment and classification</li><li>Containment and eradication</li><li>Recovery and post-incident analysis</li></ol>"
      }
    ];

    await db
      .insert(controlTemplates)
      .values(isoTemplates)
      .returning();

    console.log(`✅ Created ${isoTemplates.length} ISO 27001 control templates`);

    console.log("🎉 Successfully seeded frameworks and control templates!");
    
  } catch (error) {
    console.error("❌ Error seeding frameworks and templates:", error);
    throw error;
  }
}

// Run the seeding function
seedFrameworksAndTemplates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
