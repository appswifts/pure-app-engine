-- Create admin user account
-- Note: This creates the user record that will be referenced by the auth system
-- The actual password authentication will be handled by Supabase Auth

-- First, let's ensure we have an admin user in the user_roles table
-- We'll create a UUID that will be used for the admin user
DO $$
DECLARE
    admin_user_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- Fixed UUID for admin
BEGIN
    -- Insert admin user role if it doesn't exist
    INSERT INTO user_roles (id, user_id, role, created_at)
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        'admin',
        now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also add super_admin role for full access
    INSERT INTO user_roles (id, user_id, role, created_at)
    VALUES (
        gen_random_uuid(),
        admin_user_id,
        'super_admin',
        now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
END $$;