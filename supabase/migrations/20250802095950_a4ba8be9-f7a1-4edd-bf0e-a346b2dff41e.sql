-- Enable RLS on restaurants table (seems to have been disabled somehow)
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Ensure all triggers are properly created
CREATE TRIGGER IF NOT EXISTS validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();

-- Add a trigger to the handle_new_user function if it doesn't exist
DO $$
BEGIN
  -- Check if trigger exists on auth.users (this might need to be created manually in Supabase dashboard)
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN
    -- Note: This trigger creation might need to be done in the Supabase Auth settings
    -- Since we can't directly modify auth schema from here
    RAISE NOTICE 'Note: You may need to manually configure the auth.users trigger in Supabase dashboard';
  END IF;
END $$;