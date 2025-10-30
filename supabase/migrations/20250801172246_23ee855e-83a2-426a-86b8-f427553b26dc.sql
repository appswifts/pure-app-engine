-- Add Row Level Security policies for financial tables

-- Enable RLS on payment_requests table
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Payment requests policies - restaurants can only access their own
CREATE POLICY "Restaurants can view their own payment requests" 
ON public.payment_requests 
FOR SELECT 
USING (restaurant_id = auth.uid());

CREATE POLICY "Restaurants can update their own payment requests" 
ON public.payment_requests 
FOR UPDATE 
USING (restaurant_id = auth.uid());

-- Admin can manage all payment requests
CREATE POLICY "Admins can manage all payment requests" 
ON public.payment_requests 
FOR ALL 
USING (public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin'));

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies - restaurants can only access their own
CREATE POLICY "Restaurants can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (restaurant_id = auth.uid());

CREATE POLICY "Restaurants can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (restaurant_id = auth.uid());

-- Admin can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin'));

-- Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies - read-only for authenticated users, admin can manage
CREATE POLICY "Authenticated users can view subscription plans" 
ON public.subscription_plans 
FOR SELECT 
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" 
ON public.subscription_plans 
FOR ALL 
USING (public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin'));

-- Add constraint to prevent self-role elevation
-- Create a trigger function to validate role assignments
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_assignment();