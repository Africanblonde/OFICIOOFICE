-- VERIFICAÇÃO FINAL: Execute linha por linha

-- 1. PRIMEIRO: Ver qual é sua role atual
SELECT 
  id,
  name,
  role,
  location_id,
  created_at
FROM public.users
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';

-- 2. SEGUNDO: Atualizar para ADMIN
UPDATE public.users 
SET role = 'ADMIN'
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';

-- 3. TERCEIRO: Confirmar que atualizou
SELECT 
  id,
  name,
  role,
  location_id
FROM public.users
WHERE id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';
