-- Admin Policies

-- Helper function to check if user is admin
-- SECURITY DEFINER allows this function to bypass RLS policies when checking roles
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid()
    and role_id = (select id from roles where name = 'admin')
  );
end;
$$ language plpgsql security definer;

-- Profiles Policies
create policy "Admins can view all profiles"
  on profiles for select
  using (is_admin());

create policy "Admins can update all profiles"
  on profiles for update
  using (is_admin());

-- Courses Policies
create policy "Admins can delete any course"
  on courses for delete
  using (is_admin());

-- Ensure Roles table is readable (if RLS is enabled later)
alter table roles enable row level security;
create policy "Everyone can read roles"
  on roles for select
  using (true);
