-- Temporarily disable trigger
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;

-- Seed initial admin (using 'admin' to satisfy existing role constraint)
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
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    RAISE NOTICE 'No auth user found with email %, user must sign up first', 'appswifts@gmail.com';
  END IF;
END$$;

-- Re-enable trigger
CREATE TRIGGER validate_role_assignment_trigger
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.validate_role_assignment();