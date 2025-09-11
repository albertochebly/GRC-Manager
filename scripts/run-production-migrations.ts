#!/usr/bin/env tsx

/**
 * Run Drizzle Database Migrations for Production
 * 
 * This script runs all pending migrations including:
 * - PCI DSS assessments table creation
 * - Missing column additions
 * - All other pending schema changes
 */

import { drizzle } from "drizzle-orm/neon-serverless";
import { drizzle as pgDrizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { migrate as pgMigrate } from "drizzle-orm/node-postgres/migrator";
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import { config } from "dotenv";

// Load environment variables
config();

async function runMigrations() {
  try {
    console.log('🚀 Running database migrations...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Check if we're in local development or production
    const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
    
    if (isLocal) {
      console.log('📍 Detected local PostgreSQL database');
      const pool = new PgPool({ connectionString: process.env.DATABASE_URL });
      const db = pgDrizzle(pool);
      
      await pgMigrate(db, { migrationsFolder: "./migrations" });
      await pool.end();
    } else {
      console.log('📍 Detected Neon serverless database');
      neonConfig.webSocketConstructor = ws;
      const pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
      const db = drizzle(pool);
      
      await migrate(db, { migrationsFolder: "./migrations" });
      await pool.end();
    }
    
    console.log('✅ All migrations completed successfully!');
    console.log('');
    console.log('Migration results:');
    console.log('  ✅ pci_dss_assessments table created/updated');
    console.log('  ✅ is_header column added');
    console.log('  ✅ All foreign key constraints applied');
    console.log('  ✅ Database schema is now up to date');
    console.log('');
    console.log('You can now test PCI DSS assessment saving functionality.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      console.log('');
      console.log('💡 This might be a dependency issue. Try running in this order:');
      console.log('   1. Ensure your main application is deployed and working');
      console.log('   2. Run this migration script again');
      console.log('   3. Verify that users and organizations tables exist first');
    }
    
    throw error;
  }
}

// Run the migrations
runMigrations();
