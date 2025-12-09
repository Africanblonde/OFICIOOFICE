-- =============================================
-- DIAGNÓSTICO DE METADADOS E ROLES
-- =============================================

-- 1. Verifique os últimos 5 usuários criados e seus metadados
SELECT 
    id, 
    email, 
    raw_user_meta_data, 
    created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Verifique a tabela public.users correspondente
SELECT 
    id, 
    name, 
    role, 
    created_at 
FROM public.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Teste se o trigger está funcionando simulando uma inserção (ROLLBACK no final para não sujar)
BEGIN;
    INSERT INTO public.users (id, name, role)
    VALUES (
        '00000000-0000-0000-0000-000000000000', 
        'Teste Trigger', 
        'ADMIN' -- Tentando inserir como ADMIN
    );
    
    SELECT * FROM public.users WHERE id = '00000000-0000-0000-0000-000000000000';
ROLLBACK;
