-- Migration: Fix handle_new_user function to remove explicit enum cast
-- Date: 2025-12-08
-- Problem: ERROR 42710 - type "user_role" already exists (trying to create duplicate)
-- Solution: Drop and recreate only the function and trigger, not the enum

-- Step 1: Drop existing trigger (if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop existing function (if exists)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 3: Recreate function with corrected implementation
-- KEY CHANGE: Remove explicit ::user_role cast, rely on implicit type inference
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
    COALESCE(final_role, 'WORKER')::public.user_role  -- Explicit cast to user_role enum
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    -- Only update role if the incoming role is not the default 'WORKER'
    role = CASE
             WHEN EXCLUDED.role::text != 'WORKER' THEN EXCLUDED.role
             ELSE public.users.role
           END;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Verify function and trigger are in place
-- You can run these verification queries in SQL Editor to confirm:
-- SELECT pg_get_triggerdef(oid) FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
