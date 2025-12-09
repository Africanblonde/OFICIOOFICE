-- LIMPEZA TOTAL E CORREÇÃO DEFINITIVA
-- Execute TODO este script de uma vez no Supabase SQL Editor

-- PASSO 1: DELETAR TODAS AS 8 POLICIES CONFLITANTES
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users CASCADE;
DROP POLICY IF EXISTS "Allow users to update profiles" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_admins" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_self" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_admins" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_self" ON public.users CASCADE;

-- PASSO 2: Verificar que todas foram removidas (deve retornar 0 linhas)
SELECT COUNT(*) as policies_restantes 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- PASSO 3: Criar APENAS 4 policies simples e claras
-- SELECT: Todos usuários autenticados podem ler todos os perfis
CREATE POLICY "users_policy_select"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Usuários podem criar seu próprio perfil
CREATE POLICY "users_policy_insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Todos autenticados podem atualizar (necessário para admins gerenciarem)
CREATE POLICY "users_policy_update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Só admins podem deletar usuários
CREATE POLICY "users_policy_delete"
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

-- PASSO 4: Confirmar que temos exatamente 4 policies
SELECT 
  policyname,
  cmd as operacao,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;

-- PASSO 5: TESTAR se funciona (deve retornar seus dados)
SELECT id, name, role, location_id 
FROM public.users 
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';

-- PASSO 6: Confirmar que a role está como ADMIN
UPDATE public.users 
SET role = 'ADMIN'
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';

-- PASSO 7: Verificar atualização
SELECT id, name, role FROM public.users 
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';
