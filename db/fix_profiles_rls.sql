-- Drop the restrictive policy
drop policy if exists "Users can read own profile" on profiles;

-- Create a new policy allowing all authenticated users to read profiles
-- This is necessary so students can see the name of the Instructor for a course
create policy "Everyone can read profiles"
  on profiles for select
  using (auth.role() = 'authenticated');
