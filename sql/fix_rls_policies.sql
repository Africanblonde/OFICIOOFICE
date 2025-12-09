-- FIX RLS POLICIES FOR USERS TABLE
-- Run this in Supabase SQL Editor to fix the 500 error

-- First, drop existing policies that might be causing conflicts
drop policy if exists "Enable read access for authenticated users" on public.users;
drop policy if exists "Enable insert for authenticated users" on public.users;
drop policy if exists "Enable update for authenticated users" on public.users;

-- Create new, simpler policies that definitely work
-- Allow all authenticated users to read all user profiles
create policy "Allow authenticated users to read all users"
  on public.users
  for select
  to authenticated
  using (true);

-- Allow users to insert their own profile
create policy "Allow users to insert their own profile"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Allow users to update their own profile, or allow admins to update any
create policy "Allow users to update profiles"
  on public.users
  for update
  to authenticated
  using (
    auth.uid() = id 
    OR 
    (select role from public.users where id = auth.uid()) in ('ADMIN', 'GENERAL_MANAGER')
  );

-- Verify the policies are active
select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'users';
