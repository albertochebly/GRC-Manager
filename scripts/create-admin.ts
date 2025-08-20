#!/usr/bin/env tsx

import { config } from "dotenv";
config();

import { db } from "../server/db";
import { users, organizations, organizationUsers } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  try {
    console.log("🔐 Creating admin user...");

    // Get admin user details from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const adminFirstName = process.env.ADMIN_FIRST_NAME || "Admin";
    const adminLastName = process.env.ADMIN_LAST_NAME || "User";

    console.log(`📧 Admin email: ${adminEmail}`);

    // Check if admin user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("⚠️  Admin user already exists!");
      
      // Update password if different
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await db
        .update(users)
        .set({ 
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          updatedAt: new Date()
        })
        .where(eq(users.email, adminEmail));
      
      console.log("✅ Admin user credentials updated!");
      return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    // Create the admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: adminEmail,
        passwordHash,
        firstName: adminFirstName,
        lastName: adminLastName,
        username: adminEmail.split('@')[0], // Use email prefix as username
      })
      .returning();

    console.log("✅ Admin user created successfully!");
    console.log(`👤 User ID: ${adminUser.id}`);

    // Create a default organization for the admin
    const [defaultOrg] = await db
      .insert(organizations)
      .values({
        name: "Default Organization",
        description: "Default organization for admin user",
        createdBy: adminUser.id,
      })
      .returning();

    console.log("🏢 Default organization created!");
    console.log(`🏢 Organization ID: ${defaultOrg.id}`);

    // Add admin user to the organization as admin
    await db
      .insert(organizationUsers)
      .values({
        organizationId: defaultOrg.id,
        userId: adminUser.id,
        role: "admin",
        invitedBy: adminUser.id,
      });

    console.log("✅ Admin user added to default organization!");

    console.log("\n🎉 Setup complete!");
    console.log("👤 Admin Login Credentials:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log("\n⚠️  Please change the admin password after first login!");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Check command line arguments for credentials
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
📖 Admin User Creation Script

Usage: npm run create-admin [options]

Environment Variables:
  ADMIN_EMAIL      Admin user email (default: admin@example.com)
  ADMIN_PASSWORD   Admin user password (default: admin123)
  ADMIN_FIRST_NAME Admin first name (default: Admin)
  ADMIN_LAST_NAME  Admin last name (default: User)

Examples:
  npm run create-admin
  ADMIN_EMAIL=admin@mycompany.com ADMIN_PASSWORD=mypassword npm run create-admin

Security Notes:
- Use a strong password for production environments
- Change the default password after first login
- Consider using environment variables for sensitive data
`);
  process.exit(0);
}

// Run the script
createAdminUser();
