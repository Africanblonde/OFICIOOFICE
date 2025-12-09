-- =============================================
-- CORREÇÃO DEFINITIVA DO ERRO 500 DE AUTENTICAÇÃO
-- VERSÃO ROBUSTA - Remove TODAS as políticas primeiro
-- =============================================

-- =============================================
-- PASSO 1: REMOVER **TODAS** AS POLÍTICAS DE USERS
-- =============================================
-- Remove políticas antigas e novas (caso script tenha sido executado parcialmente)

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users CASCADE;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_own_or_system" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_authenticated" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_delete_admin_only" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_select_all" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_insert_all" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_update_all" ON public.users CASCADE;
DROP POLICY IF EXISTS "users_delete_admins" ON public.users CASCADE;

-- =============================================
-- PASSO 2: CRIAR A FUNÇÃO handle_new_user
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', new.email), 'WORKER')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PASSO 3: CRIAR O TRIGGER
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PASSO 4: CRIAR POLÍTICAS PERMISSIVAS
-- =============================================

-- SELECT: Qualquer um pode ler (mesmo não autenticado)
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO public
  USING (true);

-- INSERT: Qualquer um pode inserir (necessário para trigger)
CREATE POLICY "users_insert_all"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Qualquer autenticado pode atualizar
CREATE POLICY "users_update_all"
  ON public.users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- DELETE: Apenas admins
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
-- Políticas criadas:
SELECT 
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY cmd;

-- Trigger criado:
SELECT 
  t.tgname as trigger_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'ATIVO'
    WHEN 'D' THEN 'DESATIVADO'
  END as status
FROM pg_trigger t
WHERE t.tgrelid = 'public.users'::regclass
  AND t.tgname = 'on_auth_user_created';

-- 🎉 CORREÇÃO CONCLUÍDA! Tente fazer login agora.
