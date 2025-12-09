-- =============================================
-- CORREÇÃO DEFINITIVA DE TRIGGER (V3)
-- =============================================

-- Problema: O trigger estava sobrescrevendo o role correto (inserido pela Edge Function)
-- com 'WORKER' porque os metadados muitas vezes chegam vazios ou atrasados.

-- Solução:
-- 1. Tenta pegar o role dos metadados.
-- 2. Se não tiver metadados, usa 'WORKER' APENAS NA INSERÇÃO.
-- 3. Se o usuário JÁ EXISTIR (conflito de ID), NÃO SOBRESCREVE o role se o novo valor for o default 'WORKER'.
--    Isso protege o trabalho da Edge Function que faz o upsert com o role correto.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  meta_role text;
  meta_name text;
  default_role text := 'WORKER';
  final_role text;
BEGIN
  -- Extrair valores dos metadados
  meta_role := new.raw_user_meta_data->>'role';
  meta_name := new.raw_user_meta_data->>'name';
  
  -- Definir o role a ser tentado
  final_role := COALESCE(meta_role, default_role);

  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    COALESCE(meta_name, new.email),
    final_role::user_role -- Cast explícito para garantir
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    -- LÓGICA DE PROTEÇÃO:
    -- Só atualiza o role se o valor vindo do trigger (EXCLUDED.role) NÃO FOR o default 'WORKER'.
    -- Se for 'WORKER', assumimos que pode ser falta de metadados e mantemos o que está no banco (que pode ser ADMIN/MANAGER).
    -- Se o metadados trouxer explicitamente 'WORKER', aí sim atualiza.
    role = CASE 
             WHEN EXCLUDED.role::text != 'WORKER' THEN EXCLUDED.role
             -- Se o metadados veio vazio (caiu no default WORKER), mantém o atual
             ELSE public.users.role 
           END;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Trigger V3 atualizado com proteção de sobrescrita.' as status;
