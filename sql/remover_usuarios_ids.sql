-- =============================================
-- REMOVER USUÁRIOS POR ID
-- =============================================

-- 1. Remover dependências (se houver) em outras tabelas
-- Isso evita erro de foreign key constraint
DELETE FROM public.requisitions WHERE requester_id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');
DELETE FROM public.requisition_logs WHERE actor_id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');
DELETE FROM public.daily_performance WHERE worker_id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');
DELETE FROM public.transactions WHERE user_id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');

-- 2. Remover da tabela de perfis (public.users)
DELETE FROM public.users 
WHERE id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');

-- 3. Remover da tabela de autenticação (auth.users)
DELETE FROM auth.users 
WHERE id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');

-- 4. Confirmar remoção
SELECT id, name FROM public.users WHERE id IN ('53c96a99-6e0e-4ef9-bba6-84f2a3bb8635', '6c6a79ba-6277-4d41-b343-2b51470c2e88');
