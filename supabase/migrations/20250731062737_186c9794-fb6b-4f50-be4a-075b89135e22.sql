-- Fix the handle_new_user function to properly handle phone and whatsapp data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  basic_package_id UUID;
BEGIN
  -- Get the Basic package ID
  SELECT id INTO basic_package_id FROM public.packages WHERE name = 'Basic' LIMIT 1;
  
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
    currency
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
    'RWF'
  );
  
  RETURN NEW;
END;
$function$;