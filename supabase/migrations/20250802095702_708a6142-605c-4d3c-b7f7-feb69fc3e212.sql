-- Enable RLS on missing tables
ALTER TABLE public.restaurant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for restaurant_subscriptions
CREATE POLICY "Users can view their own restaurant subscriptions"
ON public.restaurant_subscriptions
FOR SELECT
USING (restaurant_id = auth.uid());

CREATE POLICY "Users can update their own restaurant subscriptions"
ON public.restaurant_subscriptions
FOR UPDATE
USING (restaurant_id = auth.uid());

CREATE POLICY "Users can insert their own restaurant subscriptions"
ON public.restaurant_subscriptions
FOR INSERT
WITH CHECK (restaurant_id = auth.uid());

CREATE POLICY "Admins can manage all restaurant subscriptions"
ON public.restaurant_subscriptions
FOR ALL
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

-- RLS policies for subscription_packages
CREATE POLICY "Authenticated users can view subscription packages"
ON public.subscription_packages
FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage subscription packages"
ON public.subscription_packages
FOR ALL
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

-- Update existing functions to be more secure
CREATE OR REPLACE FUNCTION public.has_system_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$function$;

-- Create validation function for WhatsApp numbers
CREATE OR REPLACE FUNCTION public.validate_whatsapp_number(_number text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Add validation trigger for restaurants table
CREATE OR REPLACE FUNCTION public.validate_restaurant_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_restaurant_data_trigger ON public.restaurants;
CREATE TRIGGER validate_restaurant_data_trigger
  BEFORE INSERT OR UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_restaurant_data();

-- Add audit logging function
CREATE OR REPLACE FUNCTION public.log_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes
  IF TG_TABLE_NAME = 'user_roles' THEN
    INSERT INTO public.audit_log (
      table_name,
      operation,
      user_id,
      old_values,
      new_values,
      timestamp
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW),
      now()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  operation text NOT NULL,
  user_id uuid,
  old_values jsonb,
  new_values jsonb,
  timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_log
FOR SELECT
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

-- Create audit trigger for user_roles
CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_operations();