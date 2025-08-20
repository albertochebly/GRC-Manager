import { db } from '../server/db';
import * as schema from '../shared/schema';
import { eq, and, notInArray } from 'drizzle-orm';

async function fixOrganizationUsers() {
  console.log('🔧 Starting migration to fix organization users...');
  
  try {
    // Find all organizations where the creator is not in organization_users
    const orgsWithMissingCreators = await db.select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      createdBy: schema.organizations.createdBy,
    }).from(schema.organizations);

    console.log(`Found ${orgsWithMissingCreators.length} organizations to check...`);

    for (const org of orgsWithMissingCreators) {
      // Check if creator is already in organization_users
      const [existingMembership] = await db.select()
        .from(schema.organizationUsers)
        .where(
          and(
            eq(schema.organizationUsers.organizationId, org.id),
            eq(schema.organizationUsers.userId, org.createdBy)
          )
        );

      if (!existingMembership) {
        console.log(`➕ Adding creator ${org.createdBy} to organization "${org.name}" (${org.id})`);
        
        // Add the creator as an admin to the organization_users table
        await db.insert(schema.organizationUsers)
          .values({
            organizationId: org.id,
            userId: org.createdBy,
            role: 'admin',
            invitedBy: org.createdBy, // Creator invites themselves
          });
        
        console.log(`✅ Added creator as admin to organization "${org.name}"`);
      } else {
        console.log(`ℹ️ Creator already exists in organization "${org.name}"`);
      }
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  fixOrganizationUsers()
    .then(() => {
      console.log('Migration finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default fixOrganizationUsers;
