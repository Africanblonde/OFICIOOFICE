-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- Execute isso no Supabase SQL Editor

-- PASSO 1: Ver TODAS as policies atuais na tabela users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- PASSO 2: REMOVER TODAS AS POLICIES (limpar tudo)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update profiles" ON public.users;

-- Remover qualquer outra policy que possa existir
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END $$;

-- PASSO 3: Criar UMA ÚNICA policy super simples
CREATE POLICY "users_select_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_all"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- PASSO 4: Verificar se as policies foram criadas
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- PASSO 5: Testar se consegue ler da tabela
SELECT id, name, role FROM public.users LIMIT 5;
