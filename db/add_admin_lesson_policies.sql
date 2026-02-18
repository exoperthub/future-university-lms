-- Allow Admins to View All Lessons
create policy "Admins can view all lessons"
  on lessons for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );

-- Allow Admins to Create/Update/Delete Lessons
create policy "Admins can manage all lessons"
  on lessons for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role_id = (select id from roles where name = 'admin')
    )
  );
