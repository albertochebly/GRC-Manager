
import { db } from "../server/db";
import { frameworks, controls } from "../shared/schema";

async function seedFrameworks() {
  console.log("🌱 Seeding cybersecurity frameworks...");

  // NIST Cybersecurity Framework
  const [nistFramework] = await db.insert(frameworks).values({
    name: "NIST Cybersecurity Framework",
    version: "1.1",
    description: "The NIST Cybersecurity Framework provides a policy framework of computer security guidance for how private sector organizations can assess and improve their ability to prevent, detect, and respond to cyber attacks.",
    isActive: true,
  }).returning();

  // NIST Controls
  const nistControls = [
    {
      frameworkId: nistFramework.id,
      controlId: "ID.AM-1",
      title: "Physical devices and systems within the organization are inventoried",
      description: "Maintain an accurate, complete, and up-to-date inventory of all technology assets with the potential to store or process information.",
      category: "Identify",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "ID.AM-2",
      title: "Software platforms and applications within the organization are inventoried",
      description: "Maintain an accurate, complete, and up-to-date inventory of all software platforms and applications.",
      category: "Identify",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "PR.AC-1",
      title: "Identities and credentials are issued, managed, verified, revoked, and audited",
      description: "Access to systems and assets is controlled by properly managing identities and credentials.",
      category: "Protect",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "PR.AC-3",
      title: "Remote access is managed",
      description: "Remote access sessions are managed to prevent unauthorized access and potential cybersecurity events.",
      category: "Protect",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "DE.AE-1",
      title: "A baseline of network operations and expected data flows is established and managed",
      description: "Network operations are monitored to detect potential cybersecurity events.",
      category: "Detect",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "RS.RP-1",
      title: "Response plan is executed during or after an incident",
      description: "Response plans are executed during or after a cybersecurity incident.",
      category: "Respond",
    },
    {
      frameworkId: nistFramework.id,
      controlId: "RC.RP-1",
      title: "Recovery plan is executed during or after a cybersecurity incident",
      description: "Recovery plans are executed during or after a cybersecurity incident.",
      category: "Recover",
    },
  ];

  await db.insert(controls).values(nistControls);

  // ISO 27001
  const [isoFramework] = await db.insert(frameworks).values({
    name: "ISO 27001",
    version: "2013",
    description: "ISO/IEC 27001 is an international standard for information security management systems (ISMS).",
    isActive: true,
  }).returning();

  // ISO 27001 Controls (sample)
  const isoControls = [
    {
      frameworkId: isoFramework.id,
      controlId: "A.5.1.1",
      title: "Information security policy",
      description: "A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.",
      category: "Information Security Policies",
    },
    {
      frameworkId: isoFramework.id,
      controlId: "A.6.1.1",
      title: "Information security roles and responsibilities",
      description: "All information security responsibilities shall be defined and allocated.",
      category: "Organization of Information Security",
    },
    {
      frameworkId: isoFramework.id,
      controlId: "A.8.1.1",
      title: "Inventory of assets",
      description: "Assets associated with information and information processing facilities shall be identified and an inventory of these assets shall be drawn up and maintained.",
      category: "Asset Management",
    },
    {
      frameworkId: isoFramework.id,
      controlId: "A.9.1.1",
      title: "Access control policy",
      description: "An access control policy shall be established, documented and reviewed based on business and information security requirements.",
      category: "Access Control",
    },
    {
      frameworkId: isoFramework.id,
      controlId: "A.12.1.1",
      title: "Documented operating procedures",
      description: "Operating procedures shall be documented and made available to all users who need them.",
      category: "Operations Security",
    },
  ];

  await db.insert(controls).values(isoControls);

  console.log("✅ Seeded frameworks and controls successfully!");
}

async function main() {
  try {
    await seedFrameworks();
    console.log("🎉 Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

main();
