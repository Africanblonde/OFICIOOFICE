/**
 * scripts/apply_ficha_schema.ts
 *
 * Usage:
 * 1) Set DATABASE_URL in environment.
 * 2) Run: npx ts-node scripts/apply_ficha_schema.ts
 *
 * Applies the ficha_individual_schema.sql to the database.
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL env var (postgres connection).');
    process.exit(2);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const sqlPath = join(process.cwd(), 'sql', 'ficha_individual_schema.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('Applying ficha_individual_schema.sql...');
    await client.query(sql);
    console.log('Schema applied successfully.');
  } catch (error) {
    console.error('Error applying schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();