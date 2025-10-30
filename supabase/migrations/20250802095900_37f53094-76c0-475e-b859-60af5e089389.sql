-- Fix remaining security issues

-- Update functions to have immutable search paths
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the current user has admin role
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_subscription_access(_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE 
    -- Always allow free plan
    WHEN r.plan = 'free' THEN true
    -- Active subscription
    WHEN r.subscription_status = 'active' 
         AND r.subscription_start_date IS NOT NULL 
         AND r.subscription_end_date IS NOT NULL 
         AND r.subscription_end_date > now() THEN true
    -- Trial period
    WHEN r.subscription_status = 'trial' 
         AND r.trial_end_date IS NOT NULL 
         AND r.trial_end_date > now() THEN true
    -- Grace period after subscription expires
    WHEN r.subscription_status = 'expired' 
         AND r.grace_period_end_date IS NOT NULL 
         AND r.grace_period_end_date > now() THEN true
    ELSE false
  END
  FROM public.restaurants r
  WHERE r.id = _restaurant_id;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow role assignment if the assigner is an admin
  -- and prevent self-assignment of elevated roles
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Prevent users from assigning admin roles to themselves
    IF NEW.user_id = auth.uid() AND NEW.role IN ('admin', 'super_admin') THEN
      RAISE EXCEPTION 'Users cannot assign admin roles to themselves';
    END IF;
    
    -- Only existing admins can assign admin roles
    IF NEW.role IN ('admin', 'super_admin') AND NOT (
      public.has_system_role(auth.uid(), 'admin') OR 
      public.has_system_role(auth.uid(), 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  basic_package_id UUID;
  generated_slug TEXT;
BEGIN
  -- Get the Basic package ID (create if it doesn't exist)
  SELECT id INTO basic_package_id FROM public.packages WHERE name = 'Basic' LIMIT 1;
  
  -- If no basic package exists, create one
  IF basic_package_id IS NULL THEN
    INSERT INTO public.packages (name, description, price, max_menu_items, max_tables, trial_days, grace_period_days, features)
    VALUES ('Basic', 'Basic package for small restaurants', 0, 50, 10, 14, 7, '["QR Menu", "Basic Support"]'::jsonb)
    RETURNING id INTO basic_package_id;
  END IF;
  
  -- Generate slug from restaurant name or email
  generated_slug := COALESCE(
    regexp_replace(
      lower(trim(COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, 'restaurant'), '@', 1)))),
      '[^a-z0-9]+', '-', 'g'
    ),
    'restaurant-' || substr(NEW.id::text, 1, 8)
  );
  
  -- Ensure slug is unique by appending number if needed
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = generated_slug) LOOP
    generated_slug := generated_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Insert restaurant record with proper metadata handling
  INSERT INTO public.restaurants (
    id,
    name,
    email,
    phone,
    whatsapp_number,
    password_hash,
    subscription_status,
    package_id,
    plan,
    currency,
    slug,
    brand_color,
    font_family,
    background_style,
    background_color
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Restaurant ' || COALESCE(NEW.email, 'User')),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    'handled_by_auth',
    'pending',
    basic_package_id,
    'paid',
    'RWF',
    generated_slug,
    '#3B82F6',
    'Inter',
    'gradient',
    '#FFFFFF'
  );
  
  RETURN NEW;
END;
$function$;