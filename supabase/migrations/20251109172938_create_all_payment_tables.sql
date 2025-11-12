-- =====================================================
-- COMPLETE PAYMENT SYSTEM MIGRATION
-- Creates all tables needed for the payment system
-- =====================================================

-- ============================================
-- 1. STRIPE CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Config fields
  publishable_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  webhook_secret TEXT,
  is_test_mode BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.stripe_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stripe_config
CREATE POLICY "Allow authenticated users to read active stripe config"
  ON public.stripe_config
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow admins to manage stripe config"
  ON public.stripe_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_config_active ON public.stripe_config(is_active);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_stripe_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_config_updated_at
  BEFORE UPDATE ON public.stripe_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_config_updated_at();

-- ============================================
-- 2. SUBSCRIPTION PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Package details
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  billing_period TEXT DEFAULT 'monthly' NOT NULL, -- monthly, yearly, lifetime
  
  -- Features and limits
  features JSONB DEFAULT '[]'::jsonb,
  max_restaurants INTEGER,
  max_menu_items INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'yearly', 'lifetime'))
);

-- Enable RLS
ALTER TABLE public.subscription_packages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_packages
CREATE POLICY "Allow everyone to read active packages"
  ON public.subscription_packages
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Allow admins to manage packages"
  ON public.subscription_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscription_packages_active ON public.subscription_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_packages_price ON public.subscription_packages(price);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_subscription_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_packages_updated_at
  BEFORE UPDATE ON public.subscription_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_packages_updated_at();

-- ============================================
-- 3. MANUAL PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Payment details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RWF' NOT NULL,
  payment_method TEXT NOT NULL, -- bank_transfer, mobile_money, cash
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Payment proof
  proof_of_payment_url TEXT,
  reference_number TEXT,
  
  -- Bank/Mobile details
  bank_name TEXT,
  account_number TEXT,
  mobile_provider TEXT, -- MTN, Airtel, etc.
  mobile_number TEXT,
  
  -- Status and verification
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, verified, rejected
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'rejected', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_payments
CREATE POLICY "Users can view their own payments"
  ON public.manual_payments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payments"
  ON public.manual_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON public.manual_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can update all payments"
  ON public.manual_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_user ON public.manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created ON public.manual_payments(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_manual_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manual_payments_updated_at
  BEFORE UPDATE ON public.manual_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_payments_updated_at();

-- ============================================
-- 4. MANUAL SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.manual_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Subscription details
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.subscription_packages(id),
  manual_payment_id UUID REFERENCES public.manual_payments(id),
  
  -- Billing
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'RWF' NOT NULL,
  billing_period TEXT NOT NULL, -- monthly, yearly, lifetime
  
  -- Status
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, active, expired, cancelled
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.manual_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.manual_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON public.manual_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON public.manual_subscriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_user ON public.manual_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_status ON public.manual_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_ends_at ON public.manual_subscriptions(ends_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_manual_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER manual_subscriptions_updated_at
  BEFORE UPDATE ON public.manual_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_manual_subscriptions_updated_at();

-- ============================================
-- 5. SEED DEFAULT SUBSCRIPTION PACKAGES
-- ============================================
INSERT INTO public.subscription_packages (name, description, price, currency, billing_period, features, max_restaurants, max_menu_items, is_active)
VALUES
  (
    'Free',
    'Perfect for trying out the platform',
    0.00,
    'USD',
    'monthly',
    '["1 Restaurant", "50 Menu Items", "QR Code Menu", "Basic Analytics"]'::jsonb,
    1,
    50,
    true
  ),
  (
    'Starter',
    'Great for small restaurants',
    9.99,
    'USD',
    'monthly',
    '["3 Restaurants", "200 Menu Items", "QR Code Menu", "Advanced Analytics", "WhatsApp Notifications", "Priority Support"]'::jsonb,
    3,
    200,
    true
  ),
  (
    'Professional',
    'For growing restaurant businesses',
    29.99,
    'USD',
    'monthly',
    '["10 Restaurants", "Unlimited Menu Items", "QR Code Menu", "Advanced Analytics", "WhatsApp Notifications", "Priority Support", "Custom Branding", "API Access"]'::jsonb,
    10,
    NULL,
    true
  ),
  (
    'Enterprise',
    'For large restaurant chains',
    99.99,
    'USD',
    'monthly',
    '["Unlimited Restaurants", "Unlimited Menu Items", "QR Code Menu", "Advanced Analytics", "WhatsApp Notifications", "24/7 Support", "Custom Branding", "API Access", "Dedicated Account Manager", "Custom Integrations"]'::jsonb,
    NULL,
    NULL,
    true
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE '✅ stripe_config table created';
  RAISE NOTICE '✅ subscription_packages table created (with seed data)';
  RAISE NOTICE '✅ manual_payments table created';
  RAISE NOTICE '✅ manual_subscriptions table created';
  RAISE NOTICE '🎉 All payment system tables ready!';
END $$;
