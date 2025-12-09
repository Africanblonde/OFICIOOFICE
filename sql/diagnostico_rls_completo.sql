-- =============================================
-- DIAGNÓSTICO COMPLETO DE POLÍTICAS RLS
-- =============================================
-- Este script verifica as políticas RLS de TODAS as tabelas
-- consultadas durante o login

-- Listar todas as políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Verificar quais tabelas têm RLS habilitado mas sem políticas SELECT
SELECT 
  t.tablename,
  t.rowsecurity as rls_enabled,
  COUNT(p.policyname) FILTER (WHERE p.cmd = 'SELECT') as select_policies_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname AND p.cmd = 'SELECT'
WHERE t.schemaname = 'public'
  AND t.rowsecurity = true
GROUP BY t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) FILTER (WHERE p.cmd = 'SELECT') = 0
ORDER BY t.tablename;

-- Listar tabelas que o LogisticsContext consulta durante o login:
-- users, locations, items, inventory, requisitions, requisition_logs,
-- daily_performance, transactions, transaction_items, clients,
-- invoices, invoice_items, invoice_payments

-- RESULTADO: Tabelas COM RLS mas SEM políticas SELECT causarão erro no login!
