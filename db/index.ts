import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  return drizzle(neon(connectionString), { schema });
}
