-- Temporarily disable the role validation trigger to bootstrap the first admin
ALTER TABLE user_roles DISABLE TRIGGER ALL;

-- Create the first admin user using the currently logged in user
INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (
    gen_random_uuid(),
    '8c182af4-d209-4b30-b96f-c53f82cff3c4'::uuid, -- From the auth logs
    'admin',
    now()
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also add super_admin role
INSERT INTO user_roles (id, user_id, role, created_at)
VALUES (
    gen_random_uuid(),
    '8c182af4-d209-4b30-b96f-c53f82cff3c4'::uuid,
    'super_admin',
    now()
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-enable the trigger
ALTER TABLE user_roles ENABLE TRIGGER ALL;