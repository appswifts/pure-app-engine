-- 1) Ensure unique (user_id, role) so duplicate roles cannot be created and ON CONFLICT works
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

-- 2) Seed initial super_admin for the provided email
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
  ELSE
    RAISE NOTICE 'No auth user found with email %', 'appswifts@gmail.com';
  END IF;
END$$;

-- 3) Attach trigger to enforce safe role assignments and audit
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_assignment();