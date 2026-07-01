import process from 'node:process'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Server-side only. DATABASE_URL must never reach the client bundle —
// call this from serverless functions, not React components.
const sql = neon(process.env.DATABASE_URL!)

export const db = drizzle(sql, { schema })
