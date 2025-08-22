
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "../shared/schema";
import { config } from "dotenv";

// Load environment variables from .env file
config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're in local development
const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

let pool: any;
let db: any;

if (isLocal) {
  // Use standard PostgreSQL connection for local development
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = pgDrizzle(pool, { schema });
} else {
  // Use Neon serverless for production
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
