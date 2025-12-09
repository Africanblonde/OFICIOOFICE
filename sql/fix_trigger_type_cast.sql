-- =============================================
-- CORREÇÃO DE TIPO NO TRIGGER (TEXT -> USER_ROLE)
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    -- FAZ O CAST EXPLÍCITO PARA O TIPO user_role
    (COALESCE(new.raw_user_meta_data->>'role', 'WORKER'))::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role;
    
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
