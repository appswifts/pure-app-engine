-- Create admin user with super_admin role
-- First, insert a sample admin user record if it doesn't exist
INSERT INTO public.user_roles (user_id, role)
VALUES 
  -- Replace this with your actual user ID from Supabase Auth
  ('00000000-0000-0000-0000-000000000000', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also create an admin role entry
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Add a notes field to tables for storing admin notes
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS notes TEXT;