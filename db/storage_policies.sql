-- Create 'lessons' bucket (if not exists)
insert into storage.buckets (id, name, public)
values ('lessons', 'lessons', true)
on conflict (id) do nothing;

-- Policy: Allow authenticated users to upload files to 'lessons' bucket
create policy "Authenticated users can upload lessons"
on storage.objects for insert
with check (
  bucket_id = 'lessons' 
  and auth.role() = 'authenticated'
);

-- Policy: Allow public to view files in 'lessons' bucket
create policy "Public can view lessons"
on storage.objects for select
using ( bucket_id = 'lessons' );

-- Policy: Allow users to update/delete their own files (optional, good practice)
create policy "Users can update own files"
on storage.objects for update
using ( auth.uid() = owner )
with check ( bucket_id = 'lessons' );

create policy "Users can delete own files"
on storage.objects for delete
using ( auth.uid() = owner and bucket_id = 'lessons' );
