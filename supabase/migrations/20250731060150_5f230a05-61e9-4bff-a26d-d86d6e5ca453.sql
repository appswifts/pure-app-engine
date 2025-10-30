-- First, let's clean up and update the existing tables to match our requirements

-- Update restaurants table structure
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS package_id UUID,
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RWF',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Create packages table for subscription tiers
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_menu_items INTEGER DEFAULT 50,
  max_tables INTEGER DEFAULT 10,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default packages
INSERT INTO public.packages (name, description, price, max_menu_items, max_tables, features) VALUES
('Basic', 'Perfect for small restaurants', 0, 25, 5, '["Basic menu management", "QR code generation", "WhatsApp integration"]'::jsonb),
('Premium', 'For growing restaurants', 2500, 100, 20, '["Advanced menu management", "Multiple locations", "Analytics", "Priority support"]'::jsonb),
('Enterprise', 'For restaurant chains', 5000, 500, 100, '["Unlimited items", "Multi-location management", "Advanced analytics", "Custom branding", "API access"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create user_roles table for admin access
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin', 'restaurant')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Packages are public readable
CREATE POLICY "Packages are publicly readable" ON public.packages
FOR SELECT USING (true);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (user_id = auth.uid());

-- Admin policies for user_roles
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Create trigger for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update existing policies and add new ones for better access control

-- Update restaurants policy to be more specific
DROP POLICY IF EXISTS "Restaurants can view own data" ON public.restaurants;
CREATE POLICY "Restaurants can manage own data" ON public.restaurants
FOR ALL USING (auth.uid()::text = id::text);

-- Public can view restaurant basic info for menu display
CREATE POLICY "Public can view restaurant info for menus" ON public.restaurants
FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON public.restaurants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions for subscription checking
CREATE OR REPLACE FUNCTION public.check_subscription_access(_restaurant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
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

-- Create helper function for admin checks
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Create helper function for role checks
CREATE OR REPLACE FUNCTION public.has_system_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;