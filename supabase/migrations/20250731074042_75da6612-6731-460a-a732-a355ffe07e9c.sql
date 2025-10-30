-- Add admin role for a specific user (replace with actual admin email)
-- First, you need to create the user account through normal signup, then run this:

-- Example: Replace 'admin@yourrestaurant.com' with the actual admin email
-- This query will only work AFTER the user has signed up normally

-- To add admin role to an existing user:
-- 1. Get the user_id from auth.users table in Supabase dashboard
-- 2. Replace the email below with the admin's actual email
-- 3. This will grant admin access to that user

INSERT INTO public.user_roles (user_id, role) 
SELECT auth.users.id, 'admin' 
FROM auth.users 
WHERE auth.users.email = 'admin@example.com'  -- Replace with actual admin email
ON CONFLICT (user_id, role) DO NOTHING;

-- Note: You'll need to:
-- 1. Sign up the admin user normally through the app
-- 2. Find their user_id in the Supabase auth dashboard  
-- 3. Update this query with their actual email
-- 4. Then run this migration