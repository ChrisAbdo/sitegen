import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import * as schema from "./schema";

// Load environment variables
config({ path: ".env.local" });

// Create the connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For serverless functions, we need to configure the connection pool
const client = postgres(connectionString, {
  prepare: false,
  max: 1, // Use single connection for serverless
});

export const db = drizzle(client, { schema });

// Export types
export type DB = typeof db;
