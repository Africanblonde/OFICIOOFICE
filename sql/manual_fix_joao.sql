-- =============================================
-- CORREÇÃO MANUAL DE ROLE PARA USUÁRIO ESPECÍFICO
-- =============================================

-- ID do Usuário: 3315663f-d6db-4b05-a27d-2e919ada0b0e (joaosilva@olc.com)

-- 1. Atualizar na tabela pública (que o app usa)
UPDATE public.users 
SET role = 'ADMIN' -- Pode mudar para 'MANAGER' ou 'GENERAL_MANAGER' se preferir
WHERE id = '3315663f-d6db-4b05-a27d-2e919ada0b0e';

-- 2. Atualizar nos metadados de autenticação (para consistência)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb), 
  '{role}', 
  '"ADMIN"'
) 
WHERE id = '3315663f-d6db-4b05-a27d-2e919ada0b0e';

-- 3. Verificar o resultado
SELECT id, name, role FROM public.users WHERE id = '3315663f-d6db-4b05-a27d-2e919ada0b0e';
