-- DIAGNOSTIC SCRIPT: Run this to check your setup
-- Copy the results and send them if you need help

-- 1. Check if you exist in auth.users
select 
  'auth.users' as table_name,
  id, 
  email,
  raw_user_meta_data->>'name' as name,
  created_at
from auth.users 
where email = 'davidjuniormuianga@gmail.com';

-- 2. Check if you exist in public.users
select 
  'public.users' as table_name,
  id,
  name,
  role,
  location_id,
  created_at
from public.users 
where id = 'f94a22bb-9233-41c0-9362-1696ff87d32c';

-- 3. Check RLS policies on users table
select 
  'RLS Policies' as info,
  policyname,
  cmd,
  permissive,
  roles
from pg_policies 
where schemaname = 'public' 
  and tablename = 'users';

-- 4. Check if RLS is enabled
select 
  'RLS Status' as info,
  relname as table_name,
  relrowsecurity as rls_enabled
from pg_class 
where relname = 'users';

-- 5. Test if you can read from users table (should work after fix)
select 
  'Can Read Users?' as test,
  count(*) as user_count
from public.users;
