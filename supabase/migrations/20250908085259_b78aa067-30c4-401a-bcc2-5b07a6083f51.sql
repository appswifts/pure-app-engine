-- 0) Temporarily drop trigger to allow seeding without RLS-style checks
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;

-- 1) Ensure unique (user_id, role) constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_roles_user_role_unique'
  ) THEN
    ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);
  END IF;
END$$;

-- 2) Seed initial super_admin safely while trigger is disabled
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'appswifts@gmail.com'
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RAISE NOTICE 'Seeded super_admin for %', v_user_id;
  ELSE
    RAISE NOTICE 'No auth user found with email %, user must sign up first', 'appswifts@gmail.com';
  END IF;
END$$;

-- 3) Re-create the trigger for future inserts
CREATE TRIGGER validate_role_assignment_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_assignment();