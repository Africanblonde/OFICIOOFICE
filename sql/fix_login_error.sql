-- =============================================
-- CORREÇÃO DO ERRO DE LOGIN
-- "Database error querying schema"
-- =============================================
-- Este script corrige as políticas RLS que impedem
-- a consulta à tabela users após autenticação

-- PASSO 1: Verificar políticas existentes na tabela users
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd, policyname;

-- PASSO 2: Remover TODAS as políticas antigas da tabela users
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update profiles" ON public.users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_admins" ON public.users;
DROP POLICY IF EXISTS "users_select_self" ON public.users;
DROP POLICY IF EXISTS "users_update_admins" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "users_policy_select" ON public.users;
DROP POLICY IF EXISTS "users_policy_insert" ON public.users;
DROP POLICY IF EXISTS "users_policy_update" ON public.users;
DROP POLICY IF EXISTS "users_policy_delete" ON public.users;

-- PASSO 3: Criar políticas simples e funcionais
-- Política SELECT: Permite usuários autenticados lerem qualquer perfil
CREATE POLICY "users_select_authenticated"
  ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política INSERT: Permite usuários autenticados criarem seu próprio perfil
-- OU permite que o sistema crie perfis via trigger
CREATE POLICY "users_insert_own_or_system"
  ON public.users
  FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    auth.role() = 'authenticated'
  );

-- Política UPDATE: Permite qualquer usuário autenticado atualizar
-- (necessário para que admins possam gerenciar outros usuários)
CREATE POLICY "users_update_authenticated"
  ON public.users
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Política DELETE: Apenas admins podem deletar
CREATE POLICY "users_delete_admin_only"
  ON public.users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'GENERAL_MANAGER')
    )
  );

-- PASSO 4: Verificar que as políticas foram criadas corretamente
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Reading user profiles'
    WHEN cmd = 'INSERT' THEN 'Creating new user profiles'
    WHEN cmd = 'UPDATE' THEN 'Updating user profiles'
    WHEN cmd = 'DELETE' THEN 'Deleting user profiles'
  END as description
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;

-- PASSO 5: Verificar se a tabela users tem RLS habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- PASSO 6: Testar se você consegue ler os dados do seu usuário
-- Substitua 'SEU_USER_ID' pelo ID do usuário autenticado
-- Você pode obter isso executando: SELECT auth.uid();
SELECT id, name, role, location_id 
FROM public.users 
WHERE id = auth.uid();

-- PASSO 7: Listar todos os usuários (para verificar que a consulta funciona)
SELECT id, name, role, location_id 
FROM public.users
ORDER BY created_at DESC;
