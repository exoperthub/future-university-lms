-- Allow admins to insert courses
create policy "Admins can insert courses"
  on courses for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );

-- Allow admins to update all courses
create policy "Admins can update all courses"
  on courses for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );

-- Allow admins to insert lessons
create policy "Admins can insert lessons"
  on lessons for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );

-- Allow admins to update lessons
create policy "Admins can update all lessons"
  on lessons for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );

-- Allow admins to delete lessons
create policy "Admins can delete all lessons"
  on lessons for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );
