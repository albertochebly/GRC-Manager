#!/usr/bin/env tsx

/**
 * Targeted PCI DSS Table Creation Script
 * 
 * This script only creates the pci_dss_assessments table if it doesn't exist.
 * It avoids conflicts with existing tables and migrations.
 */

import { db } from "../server/db.js";
import { sql } from "drizzle-orm";

async function createPciDssTable() {
  try {
    console.log('🎯 Creating PCI DSS assessments table if missing...');
    
    // Check if pci_dss_assessments table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pci_dss_assessments'
      );
    `);
    
    if (tableExists.rows[0]?.exists) {
      console.log('✅ pci_dss_assessments table already exists');
      
      // Check if is_header column exists
      const columnExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'pci_dss_assessments'
          AND column_name = 'is_header'
        );
      `);
      
      if (!columnExists.rows[0]?.exists) {
        console.log('🔧 Adding missing is_header column...');
        await db.execute(sql`
          ALTER TABLE "pci_dss_assessments" 
          ADD COLUMN "is_header" boolean DEFAULT false;
        `);
        console.log('✅ Added is_header column');
      } else {
        console.log('✅ is_header column already exists');
      }
      
    } else {
      console.log('🔧 Creating pci_dss_assessments table...');
      
      // Create the complete table with all required columns
      await db.execute(sql`
        CREATE TABLE "pci_dss_assessments" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "organization_id" uuid NOT NULL,
          "requirement" varchar(10) NOT NULL,
          "sub_requirement" varchar(10),
          "description" text NOT NULL,
          "is_header" boolean DEFAULT false,
          "status" varchar(20) DEFAULT 'not-applied' NOT NULL,
          "owner" varchar(100),
          "task" text,
          "completion_date" varchar(20),
          "comments" text,
          "created_by" varchar NOT NULL,
          "updated_by" varchar NOT NULL,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "pci_dss_assessments_organization_id_requirement_unique" UNIQUE("organization_id","requirement")
        );
      `);
      
      console.log('✅ Created pci_dss_assessments table');
      
      // Add foreign key constraints (with error handling)
      try {
        await db.execute(sql`
          ALTER TABLE "pci_dss_assessments" 
          ADD CONSTRAINT "pci_dss_assessments_organization_id_organizations_id_fk" 
          FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") 
          ON DELETE cascade ON UPDATE no action;
        `);
        console.log('✅ Added organization foreign key constraint');
      } catch (err) {
        console.log('⚠️  Organization foreign key constraint may already exist');
      }
      
      try {
        await db.execute(sql`
          ALTER TABLE "pci_dss_assessments" 
          ADD CONSTRAINT "pci_dss_assessments_created_by_users_id_fk" 
          FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") 
          ON DELETE no action ON UPDATE no action;
        `);
        console.log('✅ Added created_by foreign key constraint');
      } catch (err) {
        console.log('⚠️  Created_by foreign key constraint may already exist');
      }
      
      try {
        await db.execute(sql`
          ALTER TABLE "pci_dss_assessments" 
          ADD CONSTRAINT "pci_dss_assessments_updated_by_users_id_fk" 
          FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") 
          ON DELETE no action ON UPDATE no action;
        `);
        console.log('✅ Added updated_by foreign key constraint');
      } catch (err) {
        console.log('⚠️  Updated_by foreign key constraint may already exist');
      }
    }
    
    // Verify final table structure
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'pci_dss_assessments'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Final table structure:');
    columns.rows.forEach((col: any) => {
      console.log(`  ✓ ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('');
    console.log('🎉 PCI DSS table setup completed successfully!');
    console.log('');
    console.log('✅ The table is ready for:');
    console.log('  • PCI DSS assessment saving');
    console.log('  • Header row filtering (is_header column)');
    console.log('  • All required data fields');
    console.log('');
    console.log('Next step: Run framework activation script');
    console.log('  npx tsx scripts/activate-pci-dss-framework.ts');
    
  } catch (error) {
    console.error('❌ Failed to setup PCI DSS table:', error);
    throw error;
  }
}

// Run the setup
createPciDssTable();
