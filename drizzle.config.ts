import type { Config } from 'drizzle-kit'

// drizzle-kit doesn't auto-load Next.js env files, so we load .env.local manually.
// process.loadEnvFile is built into Node.js 20.12+ — no extra packages needed.
process.loadEnvFile('.env.local')

export default {
  // Where Drizzle reads the schema to generate migrations
  schema: './lib/db/schema.ts',
  // Where generated SQL migration files are written
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use the Supabase direct connection string (not the pooler) for migrations,
    // since PgBouncer (the pooler) doesn't support DDL statements.
    // Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    url: process.env.DATABASE_URL!,
  },
} satisfies Config
