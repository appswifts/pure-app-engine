-- =====================================================
-- FIX PAYMENT SYSTEM COMPATIBILITY
-- Creates missing tables/views for payment system
-- =====================================================

-- ============================================
-- 1. CREATE VIEW: subscription_packages
-- Maps existing subscription_plans to expected subscription_packages
-- ============================================
CREATE OR REPLACE VIEW public.subscription_packages AS
SELECT 
  id::uuid,
  created_at,
  updated_at,
  name,
  description,
  price,
  currency,
  billing_interval as billing_period,
  features,
  max_menu_items,
  NULL::integer as max_restaurants, -- Add if needed
  is_active
FROM public.subscription_plans;

-- Grant permissions on view
GRANT SELECT ON public.subscription_packages TO authenticated;

-- ============================================
-- 2. FIX stripe_config RLS POLICIES
-- Update to use profiles table instead of users
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read active stripe config" ON public.stripe_config;
DROP POLICY IF EXISTS "Allow admins to manage stripe config" ON public.stripe_config;

-- Create new policies using profiles table
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
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- 3. CREATE manual_payments TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.manual_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'RWF' NOT NULL,
  payment_method text NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text,
  proof_of_payment_url text,
  reference_number text,
  bank_name text,
  account_number text,
  mobile_provider text,
  mobile_number text,
  status text DEFAULT 'pending' NOT NULL,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamp with time zone,
  admin_notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('bank_transfer', 'mobile_money', 'cash')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'rejected', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.manual_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Users can create their own payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.manual_payments;

CREATE POLICY "Users can view their own payments"
  ON public.manual_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own payments"
  ON public.manual_payments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON public.manual_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can update all payments"
  ON public.manual_payments FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_user ON public.manual_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON public.manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_created ON public.manual_payments(created_at DESC);

-- ============================================
-- 4. CREATE manual_subscriptions TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS public.manual_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text REFERENCES public.subscription_plans(id),
  manual_payment_id uuid REFERENCES public.manual_payments(id),
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'RWF' NOT NULL,
  billing_period text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT valid_billing_period CHECK (billing_period IN ('monthly', 'yearly', 'lifetime')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'expired', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.manual_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.manual_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.manual_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.manual_subscriptions;

CREATE POLICY "Users can view their own subscriptions"
  ON public.manual_subscriptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all subscriptions"
  ON public.manual_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

CREATE POLICY "Admins can manage all subscriptions"
  ON public.manual_subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_user ON public.manual_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_status ON public.manual_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_ends_at ON public.manual_subscriptions(ends_at);

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ subscription_packages view created (maps to subscription_plans)';
  RAISE NOTICE '✅ stripe_config RLS policies fixed';
  RAISE NOTICE '✅ manual_payments table created';
  RAISE NOTICE '✅ manual_subscriptions table created';
  RAISE NOTICE '🎉 Payment system compatibility fixed!';
END $$;
