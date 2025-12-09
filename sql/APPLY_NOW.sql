-- QUICK TEST COMMAND
-- Copy and paste this in Supabase SQL Editor to apply the fixed function

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_role text;
  meta_name text;
  default_role text := 'WORKER';
  final_role text;
BEGIN
  -- Extract metadata values
  meta_role := new.raw_user_meta_data->>'role';
  meta_name := new.raw_user_meta_data->>'name';

  -- Determine final role (use default if not provided)
  final_role := COALESCE(meta_role, default_role);

  INSERT INTO public.users (id, name, role)
  VALUES (
    new.id,
    COALESCE(meta_name, new.email),
    COALESCE(final_role, 'WORKER')::public.user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = CASE
             WHEN EXCLUDED.role::text != 'WORKER' THEN EXCLUDED.role
             ELSE public.users.role
           END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
