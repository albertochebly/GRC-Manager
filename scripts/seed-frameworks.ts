import { db } from "../server/db";
import { frameworks, controls } from "@shared/schema";

async function seedFrameworks() {
  const frameworksData = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "ISO 27001",
      version: "2013",
      description: "Information Security Management System (ISMS) standard",
      isActive: true,
      createdAt: new Date()
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "NIST CSF",
      version: "1.1",
      description: "Cybersecurity Framework for critical infrastructure",
      isActive: true,
      createdAt: new Date()
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "SOC 2",
      version: "2017",
      description: "Service Organization Control for service providers",
      isActive: true,
      createdAt: new Date()
    }
  ];

  const controlsData = [
    {
      id: "660e8400-e29b-41d4-a716-446655440000",
      frameworkId: "550e8400-e29b-41d4-a716-446655440000",
      controlId: "A.5",
      title: "Information Security Policies",
      category: "Policies",
      description: "Management direction for information security"
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440001",
      frameworkId: "550e8400-e29b-41d4-a716-446655440001",
      controlId: "ID.1",
      title: "Asset Management",
      category: "Identify",
      description: "The data, personnel, devices, systems, and facilities that enable the organization to achieve business purposes are identified and managed"
    },
    {
      id: "660e8400-e29b-41d4-a716-446655440002",
      frameworkId: "550e8400-e29b-41d4-a716-446655440002",
      controlId: "CC1.0",
      title: "Control Environment",
      category: "Common Criteria",
      description: "The entity demonstrates a commitment to integrity and ethical values"
    }
  ];

  console.log('Seeding frameworks...');
  
  try {
    // Insert frameworks
    for (const framework of frameworksData) {
      await db.insert(frameworks).values(framework).onConflictDoNothing();
    }
    console.log('Frameworks seeded successfully');

    // Insert controls
    for (const control of controlsData) {
      await db.insert(controls).values(control).onConflictDoNothing();
    }
    console.log('Controls seeded successfully');
  } catch (error) {
    console.error('Error seeding frameworks:', error);
  }
}

seedFrameworks().then(() => {
  console.log('Done seeding frameworks');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
