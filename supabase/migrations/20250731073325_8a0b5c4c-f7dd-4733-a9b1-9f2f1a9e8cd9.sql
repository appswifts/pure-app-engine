-- First, ensure admin role exists for user role management
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.users.id, 'admin' 
FROM auth.users 
WHERE auth.users.email = 'admin@menumanager.com'  -- Replace with actual admin email
ON CONFLICT (user_id, role) DO NOTHING;

-- Update packages table with more features and better pricing structure
UPDATE public.packages SET
  name = 'Basic',
  description = 'Perfect for small restaurants getting started with digital menus',
  price = 0,
  max_menu_items = 25,
  max_tables = 5,
  features = '["Digital Menu", "QR Code Generation", "WhatsApp Integration", "Basic Customization"]'
WHERE name = 'Basic';

INSERT INTO public.packages (name, description, price, max_menu_items, max_tables, features) VALUES
  ('Premium', 'Great for growing restaurants with advanced needs', 15000, 100, 20, '["All Basic Features", "Custom Branding", "Image Uploads", "Analytics Dashboard", "Priority Support"]'),
  ('Enterprise', 'Complete solution for restaurant chains and large establishments', 35000, 500, 100, '["All Premium Features", "Multi-location Management", "Advanced Analytics", "API Access", "Custom Integrations", "Dedicated Support"]')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  max_menu_items = EXCLUDED.max_menu_items,
  max_tables = EXCLUDED.max_tables,
  features = EXCLUDED.features;

-- Add trial period and grace period support to restaurants table
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update check_subscription_access function to handle trials and grace periods
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

-- Update restaurants trigger to set trial period for new restaurants
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  basic_package_id UUID;
BEGIN
  -- Get the Basic package ID
  SELECT id INTO basic_package_id FROM public.packages WHERE name = 'Basic' LIMIT 1;
  
  -- Insert restaurant record with trial period
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
    trial_end_date
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Restaurant ' || COALESCE(NEW.email, 'User')),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', ''),
    'handled_by_auth',
    'trial',
    basic_package_id,
    'paid',
    'RWF',
    NOW() + INTERVAL '14 days'  -- 14-day trial
  );
  
  RETURN NEW;
END;
$function$;