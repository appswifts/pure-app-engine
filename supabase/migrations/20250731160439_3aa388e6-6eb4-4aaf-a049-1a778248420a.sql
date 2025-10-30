-- First fix the signup issue by updating the handle_new_user function
-- The function needs to handle the case when basic package doesn't exist

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

-- Create admin user role if not exists
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  'admin'
FROM auth.users u
WHERE u.email LIKE '%admin%' 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role IN ('admin', 'super_admin')
  )
LIMIT 1;

-- Ensure tables have slug column properly set
UPDATE public.tables 
SET slug = CASE 
  WHEN slug IS NULL OR slug = '' THEN 
    lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
  ELSE slug 
END
WHERE slug IS NULL OR slug = '';

-- Add constraint to ensure QR URL logic
ALTER TABLE public.tables 
ADD CONSTRAINT check_qr_url_and_slug 
CHECK (
  (qr_code_url IS NULL) OR 
  (qr_code_url IS NOT NULL AND slug IS NOT NULL AND slug != '')
);