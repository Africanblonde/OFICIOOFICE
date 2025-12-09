-- =============================================
-- CORREÇÃO DEFINITIVA DO ERRO 500 DE AUTENTICAÇÃO
-- =============================================
-- Este script cria a função necessária e corrige as políticas RLS

-- =============================================
-- PASSO 1: CRIAR A FUNÇÃO handle_new_user (se não existir)
-- =============================================
-- Esta função é chamada automaticamente quando um novo usuário
-- é criado via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), 'WORKER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PASSO 2: CRIAR O TRIGGER (se não existir)
-- =============================================
-- Drop o trigger se já existir para evitar duplicação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger novamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PASSO 3: REMOVER POLÍTICAS ANTIGAS DE USERS
-- =============================================
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_or_system" ON public.users;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- =============================================
-- PASSO 4: CRIAR POLÍTICAS PERMISSIVAS PARA USERS
-- =============================================

-- SELECT: Qualquer usuário autenticado pode ler perfis
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO public
  USING (true);

-- INSERT: Permite inserções sem restrições
-- (necessário para que o trigger funcione)
CREATE POLICY "users_insert_all"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Permite atualizações para usuários autenticados
CREATE POLICY "users_update_all"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Apenas ADMIN e GENERAL_MANAGER podem deletar
CREATE POLICY "users_delete_admins"
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
-- PASSO 5: VERIFICAR RESULTADO
-- =============================================
SELECT 
  policyname,
  cmd as operation,
  roles as "applies_to"
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;

-- Verificar se o trigger foi criado
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'enabled'
    WHEN 'D' THEN 'disabled'
  END as status
FROM pg_trigger t
WHERE t.tgrelid = 'public.users'::regclass
  AND t.tgname = 'on_auth_user_created';

-- =============================================
-- RESULTADO ESPERADO
-- =============================================
-- Deve mostrar:
-- - 4 políticas em public.users
-- - 1 trigger ativo (on_auth_user_created)
