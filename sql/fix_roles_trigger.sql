-- =============================================
-- CORREÇÃO DE ROLES E TRIGGER
-- =============================================

-- 1. Atualizar a função handle_new_user para respeitar o role enviado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    -- Usa o role dos metadados se existir, senão usa WORKER
    COALESCE(new.raw_user_meta_data->>'role', 'WORKER')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir usuários que estão com role errado (exemplo)
-- Substitua pelos IDs ou Emails corretos se necessário
UPDATE public.users 
SET role = 'MANAGER' 
WHERE email = 'junior@example.com'; -- Exemplo

UPDATE public.users 
SET role = 'ADMIN' 
WHERE email = 'armandinho@example.com'; -- Exemplo

-- 3. Verificar roles atuais
SELECT id, name, email, role FROM public.users;
