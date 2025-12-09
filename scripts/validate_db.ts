/**
 * scripts/validate_db.ts
 *
 * Usage:
 * 1) Set `DATABASE_URL` (Postgres connection string) in your environment.
 *    Example (PowerShell):
 *      $env:DATABASE_URL = "postgresql://user:pass@host:5432/dbname"
 *
 * 2) Run with ts-node (recommended for ad-hoc use):
 *      npx ts-node scripts/validate_db.ts
 *
 * 3) Or compile then run with node.
 *
 * What it checks:
 * - Empty-text UUID representations (uuid::text = '') in known FK columns
 * - NULL values found in NOT NULL columns (scans information_schema)
 * - Orphaned rows for a set of common foreign-key relationships
 * - Duplicate invoice numbers
 *
 * Exit codes:
 * - 0 = OK (no critical issues)
 * - 1 = Found critical issues (printed in JSON report)
 */

import { Client } from 'pg';

type Report = {
  emptyUuidCounts: Record<string, number>;
  notNullViolations: Array<{ table: string; column: string; nullCount: number }>;
  orphanedCounts: Array<{ table: string; column: string; ref_table: string; ref_column: string; orphanCount: number }>;
  duplicateInvoiceNumbers: Array<{ numero: string; count: number }>;
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('Please set DATABASE_URL env var (postgres connection).');
    process.exit(2);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const report: Report = {
    emptyUuidCounts: {},
    notNullViolations: [],
    orphanedCounts: [],
    duplicateInvoiceNumbers: []
  };

  try {
    // 1) Empty-string UUID checks (using ::text)
    const emptyUuidTargets = [
      { table: 'users', column: 'location_id' },
      { table: 'transactions', column: 'location_id' },
      { table: 'invoices', column: 'location_id' }
    ];

    for (const t of emptyUuidTargets) {
      const q = `SELECT COUNT(*)::int AS c FROM ${t.table} WHERE ${t.column} IS NOT NULL AND ${t.column}::text = ''`;
      const res = await client.query(q);
      const c = res.rows[0]?.c ?? 0;
      report.emptyUuidCounts[`${t.table}.${t.column}`] = Number(c);
    }

    // 2) NOT NULL columns that have NULLs (scan information_schema)
    const notNullColsRes = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND is_nullable = 'NO'
      ORDER BY table_name
    `);

    for (const row of notNullColsRes.rows) {
      const table = row.table_name;
      const column = row.column_name;
      // Skip primary key serial columns since they shouldn't be NULL but usually aren't
      const q = `SELECT COUNT(*)::int AS c FROM ${table} WHERE ${column} IS NULL`;
      try {
        const r = await client.query(q);
        const c = Number(r.rows[0]?.c ?? 0);
        if (c > 0) report.notNullViolations.push({ table, column, nullCount: c });
      } catch (err) {
        // Some columns (e.g., generated columns) may error out; ignore those
        // but log for visibility
        console.warn(`Skipping NOT NULL check for ${table}.${column}:`, (err as Error).message);
      }
    }

    // 3) Orphaned FK checks for common relationships
    const fkChecks = [
      { table: 'transactions', column: 'user_id', ref_table: 'users', ref_column: 'id' },
      { table: 'transactions', column: 'location_id', ref_table: 'locations', ref_column: 'id' },
      { table: 'inventory', column: 'location_id', ref_table: 'locations', ref_column: 'id' },
      { table: 'inventory', column: 'item_id', ref_table: 'items', ref_column: 'id' },
      { table: 'transaction_items', column: 'transaction_id', ref_table: 'transactions', ref_column: 'id' },
      { table: 'transaction_items', column: 'item_id', ref_table: 'items', ref_column: 'id' },
      { table: 'invoice_items', column: 'invoice_id', ref_table: 'invoices', ref_column: 'id' },
      { table: 'invoice_items', column: 'item_id', ref_table: 'items', ref_column: 'id' },
      { table: 'users', column: 'location_id', ref_table: 'locations', ref_column: 'id' }
    ];

    for (const fk of fkChecks) {
      const q = `
        SELECT COUNT(*)::int AS c
        FROM ${fk.table} t
        LEFT JOIN ${fk.ref_table} r ON t.${fk.column} = r.${fk.ref_column}
        WHERE t.${fk.column} IS NOT NULL AND r.${fk.ref_column} IS NULL
      `;
      try {
        const r = await client.query(q);
        const c = Number(r.rows[0]?.c ?? 0);
        report.orphanedCounts.push({ table: fk.table, column: fk.column, ref_table: fk.ref_table, ref_column: fk.ref_column, orphanCount: c });
      } catch (err) {
        console.warn(`Skipping FK check ${fk.table}.${fk.column} -> ${fk.ref_table}.${fk.ref_column}:`, (err as Error).message);
      }
    }

    // 4) Duplicate invoice numbers
    try {
      const dupQ = `
        SELECT numero, COUNT(*)::int AS c
        FROM invoices
        WHERE numero IS NOT NULL AND TRIM(numero) <> ''
        GROUP BY numero
        HAVING COUNT(*) > 1
        ORDER BY c DESC
        LIMIT 100
      `;
      const dupR = await client.query(dupQ);
      for (const r of dupR.rows) report.duplicateInvoiceNumbers.push({ numero: r.numero, count: Number(r.c) });
    } catch (err) {
      console.warn('Skipping duplicate invoice check:', (err as Error).message);
    }

    // Print JSON report
    console.log(JSON.stringify(report, null, 2));

    // Decide criticality: any orphaned >0 OR any emptyUuidCounts >0 OR any notNullViolations >0 OR duplicates >0
    const criticalFound = Object.values(report.emptyUuidCounts).some(v => v > 0)
      || report.notNullViolations.some(v => v.nullCount > 0)
      || report.orphanedCounts.some(v => v.orphanCount > 0)
      || report.duplicateInvoiceNumbers.length > 0;

    if (criticalFound) {
      console.error('\nCRITICAL ISSUES FOUND. Please review the report and fix before applying stricter constraints.');
      process.exit(1);
    }

    console.log('\nNo critical data integrity issues found.');
    process.exit(0);
  } catch (err) {
    console.error('Validation script failed:', (err as Error).message);
    process.exit(3);
  } finally {
    await client.end();
  }
}

main();
