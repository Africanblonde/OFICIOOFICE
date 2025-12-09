-- Safe migration: convert UUID columns that contain empty-text representations to NULL
-- Reason: comparing a uuid column directly to '' causes PostgreSQL 22P02 errors.
-- Approach: cast uuid to text for comparison and guard with IS NOT NULL to avoid parsing issues.

BEGIN;

-- Preview (run first to inspect affected rows)
-- SELECT id, location_id, location_id::text AS location_id_text FROM users WHERE location_id IS NOT NULL AND location_id::text = '' LIMIT 50;
-- SELECT id, location_id, location_id::text AS location_id_text FROM transactions WHERE location_id IS NOT NULL AND location_id::text = '' LIMIT 50;
-- SELECT id, location_id, location_id::text AS location_id_text FROM invoices WHERE location_id IS NOT NULL AND location_id::text = '' LIMIT 50;

-- Safety: update only rows where the text form is empty
UPDATE users
SET location_id = NULL
WHERE location_id IS NOT NULL
  AND location_id::text = '';

UPDATE transactions
SET location_id = NULL
WHERE location_id IS NOT NULL
  AND location_id::text = '';

UPDATE invoices
SET location_id = NULL
WHERE location_id IS NOT NULL
  AND location_id::text = '';

-- Post-change verification: counts
-- SELECT COUNT(*) AS users_empty_text_after FROM users WHERE location_id IS NOT NULL AND location_id::text = '';
-- SELECT COUNT(*) AS transactions_empty_text_after FROM transactions WHERE location_id IS NOT NULL AND location_id::text = '';
-- SELECT COUNT(*) AS invoices_empty_text_after FROM invoices WHERE location_id IS NOT NULL AND location_id::text = '';

COMMIT;

-- NOTES:
-- 1) Run the SELECT preview lines first to confirm which rows will change.
-- 2) If your project uses backups or a staging copy, run this migration there first.
-- 3) If some columns are text (not uuid) and really contain zero-length strings, the same queries will work because casting preserves text.
-- 4) If you instead need to target explicit zero UUIDs like '00000000-0000-0000-0000-000000000000', use the explicit equality comparison.
--    Example: UPDATE users SET location_id = NULL WHERE location_id = '00000000-0000-0000-0000-000000000000';

-- Quick validation queries to run after migration (uncomment to run):
-- SELECT COUNT(*) FROM users WHERE location_id IS NULL;
-- SELECT COUNT(*) FROM transactions WHERE location_id IS NULL;
-- SELECT COUNT(*) FROM invoices WHERE location_id IS NULL;

-- End of migration file
