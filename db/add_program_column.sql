-- Add 'program' column to profiles to track student's enrolled degree
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS program text;

-- Policy to allow users to update their own program (if needed, though usually set on signup)
create policy "Users can update own program"
  on profiles for update
  using (auth.uid() = id);
