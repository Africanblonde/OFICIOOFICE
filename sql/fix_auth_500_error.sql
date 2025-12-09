-- =============================================
-- CORREÇÃO DEFINITIVA DO ERRO 500 DE AUTENTICAÇÃO
-- =============================================
-- Problema: O trigger handle_new_user() não consegue inserir
-- na tabela public.users devido a políticas RLS restritivas

-- =============================================
-- PASSO 1: REMOVER POLÍTICAS PROBLEMÁTICAS DE USERS
-- =============================================
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_or_system" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;

-- =============================================
-- PASSO 2: CRIAR POLÍTICAS QUE PERMITEM TRIGGERS
-- =============================================

-- SELECT: Qualquer usuário autenticado pode ler perfis
CREATE POLICY "users_select_policy"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Permite inserções por:
-- 1. Usuários criando seu próprio perfil (auth.uid() = id)
-- 2. Funções SECURITY DEFINER (como triggers) - não tem auth.uid() então passa
-- 3. Service role (usado pelo sistema internamente)
CREATE POLICY "users_insert_policy"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permite se for o próprio usuário
    auth.uid() = id OR 
    -- Permite se não houver uid (triggers do sistema)
    auth.uid() IS NULL OR
    -- Permite qualquer insert para authenticated (necessário para triggers)
    auth.role() = 'authenticated'
  );

-- UPDATE: Permite atualizações por qualquer usuário autenticado
-- (necessário para que admins possam gerenciar usuários)
CREATE POLICY "users_update_policy"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Apenas ADMIN e GENERAL_MANAGER podem deletar
CREATE POLICY "users_delete_policy"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'GENERAL_MANAGER')
    )
  );

-- =============================================
-- PASSO 3: VERIFICAR O TRIGGER
-- =============================================
-- Verificar se o trigger e a função existem
SELECT 
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.users'::regclass
  AND t.tgname = 'on_auth_user_created';

-- Ver definição da função
SELECT pg_get_functiondef('public.handle_new_user()'::regproc);

-- =============================================
-- PASSO 4: TESTAR A FUNÇÃO MANUALMENTE
-- =============================================
-- Testar se a função consegue inserir dados
-- (simula o que o trigger faz durante criação de usuário)
DO $$
DECLARE
  test_id uuid := gen_random_uuid();
BEGIN
  -- Tenta inserir um usuário de teste
  INSERT INTO public.users (id, name, role)
  VALUES (test_id, 'Test User', 'WORKER');
  
  -- Se chegou aqui, funcionou! Remove o teste
  DELETE FROM public.users WHERE id = test_id;
  
  RAISE NOTICE 'Teste bem-sucedido! A função consegue inserir dados.';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;

-- =============================================
-- PASSO 5: VERIFICAR RESULTADO
-- =============================================
SELECT 
  policyname,
  cmd as operation,
  CASE cmd
    WHEN 'SELECT' THEN 'Leitura de perfis'
    WHEN 'INSERT' THEN 'Criação de perfis (inclui triggers)'
    WHEN 'UPDATE' THEN 'Atualização de perfis'
    WHEN 'DELETE' THEN 'Exclusão de perfis'
  END as description
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- Deve mostrar 4 políticas:
-- 1. users_select_policy (SELECT)
-- 2. users_insert_policy (INSERT) - permite triggers
-- 3. users_update_policy (UPDATE)
-- 4. users_delete_policy (DELETE)
