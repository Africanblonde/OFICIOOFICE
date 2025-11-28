-- Helper SQL: Set User as Admin
-- Run this AFTER creating your account to promote yourself to ADMIN

-- Replace 'your-email@example.com' with your actual email
update public.users 
set role = 'ADMIN' 
where id = (
  select id from auth.users where email = 'your-email@example.com'
);

-- Verify the change
select u.id, u.name, u.role, au.email 
from public.users u
join auth.users au on u.id = au.id
where au.email = 'your-email@example.com';
