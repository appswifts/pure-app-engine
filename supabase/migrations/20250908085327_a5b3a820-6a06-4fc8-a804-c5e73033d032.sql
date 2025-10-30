-- 0) Ensure trigger is disabled for seeding
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;

-- 1) Update role check constraint to allow 'super_admin'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_role_check'
  ) THEN
    ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_check;
  END IF;
  
  ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'super_admin', 'restaurant_manager'));
END$$;

-- 2) Seed initial super_admin
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
    RAISE NOTICE 'No auth user found with email %, user must sign up first', 'appswifts@gmail.com';
  END IF;
END$$;

-- 3) Re-enable trigger
CREATE TRIGGER validate_role_assignment_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_assignment();