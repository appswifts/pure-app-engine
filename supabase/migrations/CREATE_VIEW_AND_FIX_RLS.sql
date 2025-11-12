-- =====================================================
-- CREATE VIEW AND FIX RLS POLICIES
-- Maps subscription_plans to subscription_packages
-- =====================================================

-- ============================================
-- 1. CREATE VIEW: subscription_packages
-- ============================================
DROP VIEW IF EXISTS public.subscription_packages;

CREATE VIEW public.subscription_packages AS
SELECT 
  id::uuid as id,
  created_at,
  updated_at,
  name,
  description,
  price,
  currency,
  billing_interval as billing_period,
  features,
  max_menu_items,
  max_tables as max_restaurants,
  is_active
FROM public.subscription_plans;

-- Grant permissions
GRANT SELECT ON public.subscription_packages TO authenticated;
GRANT SELECT ON public.subscription_packages TO anon;

-- ============================================
-- 2. FIX stripe_config RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Allow authenticated users to read active stripe config" ON public.stripe_config;
DROP POLICY IF EXISTS "Allow admins to manage stripe config" ON public.stripe_config;

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
-- 3. UPDATE manual_payments RLS (use profiles)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all payments" ON public.manual_payments;
DROP POLICY IF EXISTS "Admins can update all payments" ON public.manual_payments;

CREATE POLICY "Admins can view all payments"
  ON public.manual_payments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update all payments"
  ON public.manual_payments FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- ============================================
-- 4. UPDATE manual_subscriptions RLS (use profiles)
-- ============================================
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.manual_subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.manual_subscriptions;

CREATE POLICY "Admins can view all subscriptions"
  ON public.manual_subscriptions FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can manage all subscriptions"
  ON public.manual_subscriptions FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- =====================================================
-- COMPLETE! ✅
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ subscription_packages view created';
  RAISE NOTICE '✅ stripe_config RLS policies fixed';
  RAISE NOTICE '✅ manual_payments RLS policies updated';
  RAISE NOTICE '✅ manual_subscriptions RLS policies updated';
  RAISE NOTICE '🎉 All compatibility fixes applied!';
END $$;
