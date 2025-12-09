-- =============================================
-- CORREÇÃO COMPLETA DE TODAS AS POLÍTICAS RLS
-- =============================================
-- Este script corrige as políticas RLS de TODAS as tabelas
-- consultadas durante o login do aplicativo

-- Durante o login, o LogisticsContext.tsx faz queries nas seguintes tabelas:
-- - users
-- - locations  
-- - items
-- - inventory
-- - requisitions
-- - requisition_logs
-- - daily_performance
-- - transactions
-- - transaction_items
-- - clients
-- - invoices
-- - invoice_items
-- - invoice_payments

-- =============================================
-- PASSO 1: VERIFICAR POLÍTICAS ATUAIS
-- =============================================
\echo 'Verificando políticas atuais...'
SELECT 
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_count,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_count,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_count,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =============================================
-- PASSO 2: REMOVER POLÍTICAS DUPLICADAS/CONFLITANTES
-- =============================================
\echo 'Removendo políticas duplicadas...'

-- Nota: Algumas tabelas podem ter múltiplas políticas com o mesmo nome
-- devido a execuções anteriores do schema. Vamos limpar TUDO.

-- LOCATIONS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.locations CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.locations CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.locations CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.locations CASCADE;

-- ITEMS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.items CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.items CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.items CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.items CASCADE;

-- INVENTORY
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.inventory CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.inventory CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.inventory CASCADE;

-- REQUISITIONS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.requisitions CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.requisitions CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.requisitions CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.requisitions CASCADE;

-- REQUISITION_LOGS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.requisition_logs CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.requisition_logs CASCADE;

-- DAILY_PERFORMANCE
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.daily_performance CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.daily_performance CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.daily_performance CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.daily_performance CASCADE;

-- CLIENTS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.clients CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.clients CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.clients CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.clients CASCADE;

-- TRANSACTIONS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transactions CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.transactions CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.transactions CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.transactions CASCADE;

-- TRANSACTION_ITEMS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.transaction_items CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.transaction_items CASCADE;

-- INVOICES
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoices CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.invoices CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.invoices CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.invoices CASCADE;

-- INVOICE_ITEMS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoice_items CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.invoice_items CASCADE;

-- INVOICE_PAYMENTS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.invoice_payments CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.invoice_payments CASCADE;

-- =============================================
-- PASSO 3: CRIAR POLÍTICAS SIMPLES PARA TODAS AS TABELAS
-- =============================================
\echo 'Criando novas políticas simplificadas...'

-- LOCATIONS
CREATE POLICY "locations_select" ON public.locations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "locations_insert" ON public.locations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "locations_update" ON public.locations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "locations_delete" ON public.locations FOR DELETE USING (auth.role() = 'authenticated');

-- ITEMS
CREATE POLICY "items_select" ON public.items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "items_insert" ON public.items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "items_update" ON public.items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "items_delete" ON public.items FOR DELETE USING (auth.role() = 'authenticated');

-- INVENTORY
CREATE POLICY "inventory_select" ON public.inventory FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inventory_insert" ON public.inventory FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "inventory_update" ON public.inventory FOR UPDATE USING (auth.role() = 'authenticated');

-- REQUISITIONS
CREATE POLICY "requisitions_select" ON public.requisitions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "requisitions_insert" ON public.requisitions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "requisitions_update" ON public.requisitions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "requisitions_delete" ON public.requisitions FOR DELETE USING (auth.role() = 'authenticated');

-- REQUISITION_LOGS
CREATE POLICY "requisition_logs_select" ON public.requisition_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "requisition_logs_insert" ON public.requisition_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- DAILY_PERFORMANCE
CREATE POLICY "daily_performance_select" ON public.daily_performance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "daily_performance_insert" ON public.daily_performance FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "daily_performance_update" ON public.daily_performance FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "daily_performance_delete" ON public.daily_performance FOR DELETE USING (auth.role() = 'authenticated');

-- CLIENTS
CREATE POLICY "clients_select" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "clients_update" ON public.clients FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "clients_delete" ON public.clients FOR DELETE USING (auth.role() = 'authenticated');

-- TRANSACTIONS
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE USING (auth.role() = 'authenticated');

-- TRANSACTION_ITEMS
CREATE POLICY "transaction_items_select" ON public.transaction_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "transaction_items_insert" ON public.transaction_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- INVOICES
CREATE POLICY "invoices_select" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "invoices_delete" ON public.invoices FOR DELETE USING (auth.role() = 'authenticated');

-- INVOICE_ITEMS
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invoice_items_insert" ON public.invoice_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- INVOICE_PAYMENTS
CREATE POLICY "invoice_payments_select" ON public.invoice_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "invoice_payments_insert" ON public.invoice_payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- PASSO 4: VERIFICAR RESULTADO
-- =============================================
\echo 'Verificando políticas criadas...'
SELECT 
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete,
  COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'locations', 'items', 'inventory', 
    'requisitions', 'requisition_logs', 'daily_performance',
    'transactions', 'transaction_items', 'clients',
    'invoices', 'invoice_items', 'invoice_payments'
  )
GROUP BY tablename
ORDER BY tablename;

\echo 'Correção concluída! Todas as tabelas agora têm políticas RLS adequadas.'
