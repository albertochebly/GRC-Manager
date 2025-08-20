#!/usr/bin/env tsx

import { db } from "../server/db";
import { users, organizations, organizationUsers } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");
    
    // Admin user details - you can modify these
    const adminEmail = "admin@example.com";
    const adminPassword = "admin123"; // Change this!
    const adminFirstName = "Admin";
    const adminLastName = "User";
    const adminUsername = "admin";
    
    // Organization details
    const orgName = "Default Organization";
    const orgDescription = "Default organization for admin user";
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    let adminUser;
    
    if (existingUser.length > 0) {
      console.log("⚠️  Admin user already exists, updating password...");
      await db
        .update(users)
        .set({ 
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          username: adminUsername,
          updatedAt: new Date()
        })
        .where(eq(users.email, adminEmail));
      
      adminUser = existingUser[0];
    } else {
      console.log("👤 Creating new admin user...");
      const [newUser] = await db
        .insert(users)
        .values({
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          username: adminUsername,
        })
        .returning();
      
      adminUser = newUser;
    }
    
    // Check if default organization exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.createdBy, adminUser.id))
      .limit(1);
    
    let organization;
    
    if (existingOrg.length > 0) {
      console.log("🏢 Using existing organization...");
      organization = existingOrg[0];
    } else {
      console.log("🏢 Creating default organization...");
      const [newOrg] = await db
        .insert(organizations)
        .values({
          name: orgName,
          description: orgDescription,
          createdBy: adminUser.id,
        })
        .returning();
      
      organization = newOrg;
    }
    
    // Check if admin is already associated with organization
    const existingOrgUser = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.userId, adminUser.id))
      .limit(1);
    
    if (existingOrgUser.length === 0) {
      console.log("🔗 Adding admin to organization...");
      await db
        .insert(organizationUsers)
        .values({
          organizationId: organization.id,
          userId: adminUser.id,
          role: "admin",
          invitedBy: adminUser.id,
        });
    } else {
      console.log("🔗 Updating admin role in organization...");
      await db
        .update(organizationUsers)
        .set({ role: "admin" })
        .where(eq(organizationUsers.userId, adminUser.id));
    }
    
    console.log("✅ Admin user setup completed!");
    console.log("\n📋 Admin Login Details:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Organization: ${orgName}`);
    console.log("\n⚠️  IMPORTANT: Change the default password after first login!");
    
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log("🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
