-- =============================================
-- LIMPEZA DE USUÁRIOS INCONSISTENTES
-- =============================================
-- Este script remove usuários que estão causando erro
-- para que possam ser recriados corretamente pelo app.

-- 1. Remover da tabela public.users (perfil)
DELETE FROM public.users 
WHERE name IN ('juniormuianga', 'armandinho') 
   OR email IN ('junior@example.com', 'armandinho@example.com'); -- Ajuste se souber os emails

-- 2. Remover da tabela auth.users (login) - caso existam parcialmente
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'name' IN ('juniormuianga', 'armandinho')
   OR email IN ('junior@example.com', 'armandinho@example.com');

-- 3. Verificar se limpou tudo
SELECT * FROM public.users WHERE name IN ('juniormuianga', 'armandinho');
