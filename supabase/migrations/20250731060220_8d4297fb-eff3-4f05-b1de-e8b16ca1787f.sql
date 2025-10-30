-- Fix security warning: Set search_path for all functions to prevent SQL injection

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  basic_package_id UUID;
BEGIN
  -- Get the Basic package ID
  SELECT id INTO basic_package_id FROM public.packages WHERE name = 'Basic' LIMIT 1;
  
  -- Insert restaurant record
  INSERT INTO public.restaurants (
    id,
    name,
    email,
    password_hash,
    subscription_status,
    package_id,
    plan,
    currency
  ) VALUES (
    NEW.id,
    'Restaurant ' || COALESCE(NEW.email, 'User'),
    COALESCE(NEW.email, ''),
    'handled_by_auth',
    'pending',
    basic_package_id,
    'paid',
    'RWF'
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_subscription_access(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN r.plan = 'free' THEN true
    WHEN r.subscription_status = 'active' 
         AND r.subscription_start_date IS NOT NULL 
         AND r.subscription_end_date IS NOT NULL 
         AND r.subscription_end_date > now() THEN true
    ELSE false
  END
  FROM public.restaurants r
  WHERE r.id = _restaurant_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_system_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;