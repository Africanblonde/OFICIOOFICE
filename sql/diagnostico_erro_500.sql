-- =============================================
-- DIAGNÓSTICO AVANÇADO - Encontrar Causa do Erro 500
-- =============================================

-- =============================================
-- 1. VERIFICAR TODOS OS TRIGGERS NA TABELA USERS
-- =============================================
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
WHERE t.tgrelid = 'public.users'::regclass
  AND NOT t.tgisinternal;

-- =============================================
-- 2. VERIFICAR ESTRUTURA DA TABELA USERS
-- =============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- =============================================
-- 3. VERIFICAR SE HÁ CONSTRAINTS PROBLEMÁTICAS
-- =============================================
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass;

-- =============================================
-- 4. TESTAR SE CONSEGUIMOS INSERIR MANUALMENTE
-- =============================================
-- Este teste simula o que o trigger faz
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
  test_email text := 'test@example.com';
BEGIN
  -- Tenta inserir um usuário de teste
  INSERT INTO public.users (id, name, role)
  VALUES (test_id, test_email, 'WORKER');
  
  RAISE NOTICE '✅ Inserção manual funcionou! ID: %', test_id;
  
  -- Limpa o teste
  DELETE FROM public.users WHERE id = test_id;
  RAISE NOTICE '✅ Teste concluído e limpo.';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO ao inserir: %', SQLERRM;
    RAISE NOTICE 'Código de erro: %', SQLSTATE;
END $$;

-- =============================================
-- 5. VERIFICAR SE A FUNÇÃO handle_new_user EXISTE
-- =============================================
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'handle_new_user';

-- =============================================
-- 6. VERIFICAR SE HÁ OUTRAS TABELAS COM FOREIGN KEYS
-- =============================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'users';

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- Este script vai mostrar:
-- - Todos os triggers ativos
-- - Estrutura da tabela
-- - Constraints que podem causar conflitos
-- - Resultado do teste de inserção
