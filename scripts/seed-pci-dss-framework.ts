import { db } from "../server/db";
import { frameworks, controlTemplates } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedPCIDSSFramework() {
  console.log("Starting PCI DSS framework seeding...");

  try {
    // Check if PCI DSS framework already exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.name, "PCI DSS"))
      .limit(1);

    if (existingFramework.length > 0) {
      console.log("PCI DSS framework already exists, skipping...");
      return;
    }

    // Insert PCI DSS framework
    const [pciDssFramework] = await db
      .insert(frameworks)
      .values({
        name: "PCI DSS",
        version: "v4.0.1",
        description: "Payment Card Industry Data Security Standard - A set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment.",
      })
      .returning();

    console.log("Created PCI DSS framework:", pciDssFramework);

    // Create control templates for each PCI DSS requirement
    const pciDssRequirements = [
      {
        requirement: "1",
        title: "Install and maintain network security controls",
        description: "Network security controls (NSCs) protect communications between system components and from malicious traffic originating from untrusted networks."
      },
      {
        requirement: "2", 
        title: "Apply secure configurations to all system components",
        description: "Malicious individuals, both external and internal to an entity, often use vendor default settings, unchanged passwords, and other vendor defaults to compromise systems."
      },
      {
        requirement: "3",
        title: "Protect stored cardholder data",
        description: "Protection methods such as encryption, truncation, masking, and hashing are critical components of cardholder data protection."
      },
      {
        requirement: "4",
        title: "Protect cardholder data with strong cryptography during transmission over open, public networks",
        description: "Sensitive information must be encrypted during transmission over networks that are easily accessed by malicious individuals."
      },
      {
        requirement: "5",
        title: "Protect all systems and networks from malicious software",
        description: "Malicious software (malware) is software or firmware designed to infiltrate or damage a computer system without the owner's knowledge or consent."
      },
      {
        requirement: "6",
        title: "Develop and maintain secure systems and software",
        description: "Security vulnerabilities in systems and software may allow criminals to access PAN and related cardholder data."
      },
      {
        requirement: "7",
        title: "Restrict access to system components and cardholder data by business need to know",
        description: "To ensure critical data can only be accessed by authorized personnel, systems and processes must be in place to limit access based on need to know and according to job responsibilities."
      },
      {
        requirement: "8",
        title: "Identify users and authenticate access to system components",
        description: "Assigning a unique identification (ID) to each person with access ensures that each individual is uniquely accountable for their actions."
      },
      {
        requirement: "9",
        title: "Restrict physical access to cardholder data",
        description: "Any physical access to data or systems that house cardholder data provides the opportunity for individuals to access devices or data and to remove systems or hardcopies."
      },
      {
        requirement: "10",
        title: "Log and monitor all access to system components and cardholder data",
        description: "Logging mechanisms and the ability to track user activities are critical in preventing, detecting, or minimizing the impact of a data compromise."
      },
      {
        requirement: "11",
        title: "Test security of systems and networks regularly",
        description: "Vulnerabilities are being discovered continually by malicious individuals and researchers, and being introduced by new software."
      },
      {
        requirement: "12",
        title: "Support information security with organizational policies and programs",
        description: "A strong security policy sets the security tone for the whole entity and informs personnel what is expected of them."
      }
    ];

    // Insert control templates for each requirement
    for (const req of pciDssRequirements) {
      await db
        .insert(controlTemplates)
        .values({
          frameworkId: pciDssFramework.id,
          controlNumber: req.requirement,
          title: req.title,
          description: req.description,
          category: "Security Control",
          riskLevel: req.requirement === "3" || req.requirement === "4" ? "high" : "medium"
        });
    }

    console.log(`Created ${pciDssRequirements.length} control templates for PCI DSS framework`);
    console.log("PCI DSS framework seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding PCI DSS framework:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedPCIDSSFramework();
