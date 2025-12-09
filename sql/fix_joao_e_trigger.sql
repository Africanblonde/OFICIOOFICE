-- =============================================
-- CORREÇÃO FINAL: REMOVER JOAO E CORRIGIR TRIGGER
-- =============================================

-- 1. Remover o usuário "joao silva" que ficou incorreto (se existir)
DELETE FROM public.users WHERE name ILIKE 'joao silva';
DELETE FROM auth.users WHERE raw_user_meta_data->>'name' ILIKE 'joao silva';

-- 2. GARANTIR que o trigger aceite o role enviado pela Edge Function
-- E faça o cast correto para user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    -- Usa o role dos metadados se existir, senão usa WORKER
    -- E faz o cast explícito para user_role
    (COALESCE(new.raw_user_meta_data->>'role', 'WORKER'))::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificar se limpou
SELECT * FROM public.users WHERE name ILIKE 'joao silva';
