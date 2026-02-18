-- Add status column to profiles
alter table profiles 
add column if not exists status text default 'active' check (status in ('active', 'banned'));

-- Allow admins to update status (already covered by "Admins can update all profiles" policy?)
-- We should verify if "Admins can update all profiles" covers ALL columns. 
-- In db/admin_policies.sql:
-- create policy "Admins can update all profiles" on profiles for update using (is_admin());
-- Yes, this covers all columns.

-- We may need to ensure the new column is readable by everyone?
-- "Everyone can read profiles" policy covers select on * (all columns).
