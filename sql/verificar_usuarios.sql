-- =============================================
-- VERIFICAR USUÁRIOS NO SUPABASE AUTH
-- =============================================

-- 1. Verificar se você existe na tabela auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar se você existe na tabela public.users
SELECT 
  id,
  name,
  role,
  location_id
FROM public.users
ORDER BY created_at DESC;

-- 3. Verificar configurações de auth
SELECT 
  current_setting('app.settings.jwt_secret', true) as jwt_secret_set;
