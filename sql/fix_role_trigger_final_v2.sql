-- =============================================
-- CORREÇÃO DE TRIGGER DE CRIAÇÃO DE USUÁRIO
-- =============================================

-- O problema original era que a função handle_new_user estava forçando o role 'WORKER'
-- ignorando o role enviado pela Edge Function nos metadados do usuário.

-- Esta correção atualiza a função para ler o role dos metadados (raw_user_meta_data).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    -- Usa o nome dos metadados, ou o email como fallback
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    -- CORREÇÃO: Usa o role dos metadados se existir, senão usa 'WORKER'
    COALESCE(new.raw_user_meta_data->>'role', 'WORKER')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirmação
SELECT 'Função handle_new_user atualizada com sucesso.' as status;
