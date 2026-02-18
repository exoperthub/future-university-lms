-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_role_id integer;
  assigned_role_id integer;
begin
  -- Get the role ID based on the metadata 'role' field (default to student if missing/invalid)
  select id into default_role_id from public.roles where name = 'student';
  
  select id into assigned_role_id 
  from public.roles 
  where name = (new.raw_user_meta_data->>'role')::text;

  -- Use assigned role or fallback to default
  if assigned_role_id is null then
    assigned_role_id := default_role_id;
  end if;

  insert into public.profiles (id, name, email, role_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    assigned_role_id
  );
  return new;
end;
$$;

-- Trigger to call the function on new user insert
-- Drop if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
