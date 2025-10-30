-- First, let's add an admin user for you
-- Insert admin role for your user (replace with your actual user ID)
-- You can find your user ID in Supabase Auth dashboard
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'your-email@example.com' -- Replace with your email
ON CONFLICT (user_id, role) DO NOTHING;

-- Also create a super admin role for future use
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'super_admin' 
FROM auth.users 
WHERE email = 'your-email@example.com' -- Replace with your email  
ON CONFLICT (user_id, role) DO NOTHING;

-- Add image_url to item_variations table for variation images
ALTER TABLE public.item_variations 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url to accompaniments table for accompaniment images  
ALTER TABLE public.accompaniments 
ADD COLUMN IF NOT EXISTS image_url TEXT;