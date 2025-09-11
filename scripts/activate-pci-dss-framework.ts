import { db } from "../server/db.js";
import { organizationFrameworks, organizations, frameworks } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";

async function activatePCIDSSFramework() {
  try {
    console.log('Activating PCI DSS framework for organization...');
    
    // Find the PCI DSS framework
    const pciFramework = await db.select()
      .from(frameworks)
      .where(eq(frameworks.name, 'PCI DSS'))
      .limit(1);
    
    if (pciFramework.length === 0) {
      console.error('PCI DSS framework not found in database');
      return;
    }
    
    console.log('Found PCI DSS framework:', pciFramework[0]);
    
    // Find the organization
    const org = await db.select()
      .from(organizations)
      .where(eq(organizations.name, 'Default Organization'))
      .limit(1);
    
    if (org.length === 0) {
      console.error('Default Organization not found');
      return;
    }
    
    console.log('Found organization:', org[0]);
    
    // Check if framework is already activated
    const existing = await db.select()
      .from(organizationFrameworks)
      .where(and(
        eq(organizationFrameworks.organizationId, org[0].id),
        eq(organizationFrameworks.frameworkId, pciFramework[0].id)
      ));
    
    if (existing.length > 0) {
      console.log('✅ PCI DSS framework already activated for organization');
      console.log('Existing record:', existing[0]);
    } else {
      // Activate the framework
      const result = await db.insert(organizationFrameworks).values({
        organizationId: org[0].id,
        frameworkId: pciFramework[0].id,
        isActive: true,
      }).returning();
      
      console.log('✅ PCI DSS framework activated for organization:', result[0]);
    }
    
    // Verify activation
    const activated = await db.select()
      .from(organizationFrameworks)
      .where(eq(organizationFrameworks.organizationId, org[0].id));
    
    console.log('All activated frameworks for organization:', activated);
    
  } catch (error) {
    console.error('Error activating PCI DSS framework:', error);
  }
}

activatePCIDSSFramework();
