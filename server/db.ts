import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Expose a function to easily run database migrations programmatically
export async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Create enums first
    // Note: PostgreSQL syntax doesn't support IF NOT EXISTS for types directly
    // We need to use a PL/pgSQL block with exception handling
    await pool.query(`
      DO $$
      BEGIN
        -- Try to create the enum types
        CREATE TYPE account_type AS ENUM ('Savings Account', 'Checking Account', 'Business Account', 'Fixed Deposit');
      EXCEPTION
        -- Catch the error if the type already exists
        WHEN duplicate_object THEN
          NULL;
      END
      $$;

      DO $$
      BEGIN
        CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'transfer');
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END
      $$;

      DO $$
      BEGIN
        CREATE TYPE transaction_status AS ENUM ('completed', 'pending', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END
      $$;
    `);
    
    // Now create the tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "displayName" TEXT,
        "photoURL" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "accountNumber" TEXT NOT NULL UNIQUE,
        "accountType" account_type NOT NULL,
        balance NUMERIC(12,2) NOT NULL DEFAULT 0,
        name TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        type transaction_type NOT NULL,
        amount NUMERIC(12,2) NOT NULL,
        "destinationAccountId" TEXT REFERENCES accounts(id) ON DELETE SET NULL,
        description TEXT,
        status transaction_status NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}