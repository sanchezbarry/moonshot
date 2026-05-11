import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// prepare:false is required for Supabase's Transaction pool mode (port 6543),
// which doesn't support PostgreSQL prepared statements.
// max:1 prevents connection pool exhaustion in serverless environments.
const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })

// Pass schema so Drizzle can resolve relational queries (db.query.profiles etc.)
export const db = drizzle(client, { schema })
