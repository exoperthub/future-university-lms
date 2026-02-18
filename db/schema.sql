-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES
create table roles (
  id serial primary key,
  name text unique not null
);

insert into roles (name) values ('admin'), ('instructor'), ('student')
on conflict (name) do nothing;

-- PROFILES
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  email text,
  role_id integer references roles(id) default 3 -- defaulting to student
);

-- COURSES
create table courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  instructor_id uuid references profiles(id)
);

-- LESSONS
create table lessons (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  type text check (type in ('pdf', 'video', 'link')),
  file_url text
);

-- ENROLLMENTS
create table enrollments (
  student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  enrolled_at timestamptz default now(),
  primary key (student_id, course_id)
);

-- RLS POLICIES

-- Profiles
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Courses
alter table courses enable row level security;

create policy "Everyone can view courses"
  on courses for select
  using (auth.role() = 'authenticated');

create policy "Instructors can manage own courses"
  on courses for all
  using (auth.uid() = instructor_id);

-- Lessons
alter table lessons enable row level security;

-- Helper function to check enrollment
create or replace function is_enrolled(user_id uuid, course_id_check uuid)
returns boolean as $$
begin
  return exists (
    select 1 from enrollments
    where student_id = user_id
    and course_id = course_id_check
  );
end;
$$ language plpgsql security definer;

-- Helper function to check if user is the instructor of the course
create or replace function is_instructor_of_course(user_id uuid, course_id_check uuid)
returns boolean as $$
begin
  return exists (
    select 1 from courses
    where id = course_id_check
    and instructor_id = user_id
  );
end;
$$ language plpgsql security definer;


create policy "Enrolled students can view lessons"
  on lessons for select
  using (is_enrolled(auth.uid(), course_id));

create policy "Instructors can view own course lessons"
  on lessons for select
  using (is_instructor_of_course(auth.uid(), course_id));

create policy "Instructors can manage own course lessons"
  on lessons for all
  using (is_instructor_of_course(auth.uid(), course_id));

-- Enrollments
alter table enrollments enable row level security;

create policy "Users can view own enrollments"
  on enrollments for select
  using (student_id = auth.uid());

create policy "Users can enroll themselves"
  on enrollments for insert
  with check (student_id = auth.uid());
