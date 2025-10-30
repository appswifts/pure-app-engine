-- Expand allowed roles in public.user_roles to include restaurant_manager and staff
-- Safe constraint replacement that works regardless of the original constraint name

BEGIN;

-- Ensure the table exists before altering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    RAISE EXCEPTION 'Table public.user_roles does not exist. Run earlier migrations first.';
  END IF;
END $$;

-- Drop existing CHECK constraint on role (name may vary), then add a new explicit one
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.user_roles'::regclass
    AND contype = 'c'; -- check constraint

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT %I', constraint_name);
  END IF;

  -- Add new constraint with expanded role set
  EXECUTE $$
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_role_check
    CHECK (role IN (
      'admin',
      'super_admin',
      'restaurant',
      'restaurant_manager',
      'staff'
    ));
  $$;
END $$;

-- Optional: Keep a lightweight sanity check to ensure existing rows still comply
-- This will raise if any existing row has an unsupported role
ALTER TABLE public.user_roles VALIDATE CONSTRAINT user_roles_role_check;

COMMIT;
