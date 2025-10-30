-- CRITICAL SECURITY FIXES
-- Enable RLS on missing tables and add proper policies

-- 1. Enable RLS on restaurants table
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on payment_records table  
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- 3. Enable RLS on payment_provider_configs table
ALTER TABLE public.payment_provider_configs ENABLE ROW LEVEL SECURITY;

-- 4. Enable RLS on webhook_events table
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- 5. Add RLS policies for restaurants
CREATE POLICY "Users can view their own restaurant" ON public.restaurants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own restaurant" ON public.restaurants  
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own restaurant" ON public.restaurants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can view restaurant menus" ON public.restaurants
    FOR SELECT USING (true);

-- 6. Add RLS policies for payment_records  
CREATE POLICY "Users can view their payment records" ON public.payment_records
    FOR SELECT USING (
        subscription_id IN (
            SELECT id FROM subscriptions s
            WHERE s.restaurant_id = auth.uid()
        )
    );

CREATE POLICY "System can manage payment records" ON public.payment_records
    FOR ALL USING (true);

-- 7. Add RLS policies for payment_provider_configs (admin only)
CREATE POLICY "Admins can manage payment provider configs" ON public.payment_provider_configs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 8. Add RLS policies for webhook_events (system only)  
CREATE POLICY "System can manage webhook events" ON public.webhook_events
    FOR ALL USING (true);

-- 9. Create input validation function for restaurant data
CREATE OR REPLACE FUNCTION public.validate_restaurant_input()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- 10. Create trigger for restaurant input validation
DROP TRIGGER IF EXISTS validate_restaurant_input_trigger ON public.restaurants;
CREATE TRIGGER validate_restaurant_input_trigger
    BEFORE INSERT OR UPDATE ON public.restaurants
    FOR EACH ROW EXECUTE FUNCTION public.validate_restaurant_input();

-- 11. Create audit log for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,  
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.security_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- 12. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log critical operations
  IF TG_TABLE_NAME IN ('user_roles', 'payment_records', 'subscriptions') THEN
    INSERT INTO public.security_audit_log (
      table_name,
      operation,
      user_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 13. Create security audit triggers
CREATE TRIGGER security_audit_user_roles_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

CREATE TRIGGER security_audit_payment_records_trigger  
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_records
    FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

CREATE TRIGGER security_audit_subscriptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions  
    FOR EACH ROW EXECUTE FUNCTION public.log_security_event();