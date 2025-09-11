#!/usr/bin/env tsx

import { db } from '../server/db';
import { frameworks } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

async function addPCIDSSFramework() {
  console.log('🚀 Adding PCI DSS framework to production database...');
  
  try {
    // Check if PCI DSS framework already exists
    const existingFramework = await db
      .select()
      .from(frameworks)
      .where(
        and(
          eq(frameworks.name, 'PCI DSS'),
          eq(frameworks.version, 'v4.0.1')
        )
      )
      .limit(1);

    if (existingFramework.length > 0) {
      console.log('✅ PCI DSS framework already exists!');
      console.log('Framework details:', existingFramework[0]);
      return;
    }

    // Insert PCI DSS framework
    const newFramework = await db
      .insert(frameworks)
      .values({
        id: '159277a5-c634-47bf-8091-fd8cc01d79fa',
        name: 'PCI DSS',
        version: 'v4.0.1',
        description: 'Payment Card Industry Data Security Standard - A set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment.',
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    console.log('✅ Successfully added PCI DSS framework!');
    console.log('Framework details:', newFramework[0]);

  } catch (error) {
    console.error('❌ Error adding PCI DSS framework:', error);
    process.exit(1);
  }
}

// Run the script
addPCIDSSFramework()
  .then(() => {
    console.log('🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
