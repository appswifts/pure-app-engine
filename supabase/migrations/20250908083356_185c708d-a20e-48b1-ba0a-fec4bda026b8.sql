-- Fix remaining security issues - Function search paths
-- Set proper search_path for all functions missing it

-- Fix update functions
CREATE OR REPLACE FUNCTION public.update_payment_config_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_subscription_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix validation functions
CREATE OR REPLACE FUNCTION public.validate_whatsapp_number(_number text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Basic WhatsApp number validation (starts with +, 7-15 digits)
  IF _number IS NULL OR _number = '' THEN
    RETURN false;
  END IF;
  
  -- Must start with + and contain only digits after
  IF NOT _number ~ '^\+[1-9][0-9]{6,14}$' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_restaurant_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate WhatsApp number if provided
  IF NEW.whatsapp_number IS NOT NULL AND NEW.whatsapp_number != '' THEN
    IF NOT public.validate_whatsapp_number(NEW.whatsapp_number) THEN
      RAISE EXCEPTION 'Invalid WhatsApp number format. Must start with + followed by country code and phone number.';
    END IF;
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NOT NEW.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format.';
    END IF;
  END IF;
  
  -- Sanitize restaurant name (basic XSS prevention)
  IF NEW.name IS NOT NULL THEN
    NEW.name := regexp_replace(NEW.name, '[<>"\''&]', '', 'g');
    NEW.name := trim(NEW.name);
    
    IF length(NEW.name) = 0 THEN
      RAISE EXCEPTION 'Restaurant name cannot be empty after sanitization.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_restaurant_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sanitize restaurant name (prevent XSS)
  IF NEW.name IS NOT NULL THEN
    NEW.name := regexp_replace(NEW.name, '[<>"\''&]', '', 'g');
    NEW.name := trim(NEW.name);
    
    IF length(NEW.name) = 0 THEN
      RAISE EXCEPTION 'Restaurant name cannot be empty after sanitization.';
    END IF;
  END IF;
  
  -- Validate email format
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NOT NEW.email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Invalid email format.';
    END IF;
  END IF;
  
  -- Validate WhatsApp number format  
  IF NEW.whatsapp_number IS NOT NULL AND NEW.whatsapp_number != '' THEN
    IF NOT NEW.whatsapp_number ~ '^\+[1-9][0-9]{6,14}$' THEN
      RAISE EXCEPTION 'Invalid WhatsApp number format. Must start with + followed by country code and phone number.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix complex functions
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_data()
RETURNS TABLE(total_restaurants bigint, active_restaurants bigint, trial_restaurants bigint, total_users bigint, recent_signups bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.restaurants) as total_restaurants,
    (SELECT COUNT(*) FROM public.restaurants WHERE subscription_status = 'active') as active_restaurants,
    (SELECT COUNT(*) FROM public.restaurants WHERE subscription_status = 'trial') as trial_restaurants,
    (SELECT COUNT(DISTINCT user_id) FROM public.user_roles) as total_users,
    (SELECT COUNT(*) FROM public.restaurants WHERE created_at >= NOW() - INTERVAL '7 days') as recent_signups;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_user_subscription(p_user_id uuid, p_plan_id uuid, p_billing_interval text DEFAULT 'monthly'::text, p_restaurant_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id uuid;
    v_plan_record record;
    v_trial_end timestamp with time zone;
    v_current_period_end timestamp with time zone;
BEGIN
    -- Get plan details
    SELECT * INTO v_plan_record 
    FROM subscription_plans 
    WHERE id = p_plan_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found or inactive';
    END IF;
    
    -- Calculate trial end date
    v_trial_end := now() + (v_plan_record.trial_days || ' days')::interval;
    
    -- Calculate current period end (trial end + billing interval)
    IF p_billing_interval = 'yearly' THEN
        v_current_period_end := v_trial_end + interval '1 year';
    ELSE
        v_current_period_end := v_trial_end + interval '1 month';
    END IF;
    
    -- Create subscription
    INSERT INTO subscriptions (
        user_id,
        restaurant_id,
        plan_id,
        status,
        billing_interval,
        amount,
        currency,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        next_billing_date
    ) VALUES (
        p_user_id,
        p_restaurant_id,
        p_plan_id,
        'trialing',
        p_billing_interval,
        CASE 
            WHEN p_billing_interval = 'yearly' THEN v_plan_record.price * 12
            ELSE v_plan_record.price
        END,
        v_plan_record.currency,
        now(),
        v_current_period_end,
        now(),
        v_trial_end,
        v_trial_end
    ) RETURNING id INTO v_subscription_id;
    
    RETURN v_subscription_id;
END;
$$;