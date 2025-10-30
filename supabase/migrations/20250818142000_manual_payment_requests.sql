-- Create payment_requests table and correct RLS/policies for manual payments
-- This migration also adds last_payment_date to subscriptions used by the manual payment approval flow

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create payment_requests table to support manual payment flows
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'RWF',
  description TEXT,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('bank_transfer','mobile_money')),
  reference_number TEXT,
  payment_proof_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','pending_approval','approved','rejected')),
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  grace_period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  verified_by TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_payment_requests_restaurant_id ON public.payment_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_subscription_id ON public.payment_requests(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_created_at ON public.payment_requests(created_at DESC);

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to payment_requests
DROP TRIGGER IF EXISTS trg_payment_requests_set_updated_at ON public.payment_requests;
CREATE TRIGGER trg_payment_requests_set_updated_at
  BEFORE UPDATE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Drop any previous policies that may conflict
DROP POLICY IF EXISTS "Restaurants can view their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Restaurants can update their own payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Admins can manage all payment requests" ON public.payment_requests;
DROP POLICY IF EXISTS "Restaurants can insert their own payment requests" ON public.payment_requests;

-- Owner restaurant can read their requests
CREATE POLICY "Restaurants can view their own payment_requests"
ON public.payment_requests
FOR SELECT
USING (restaurant_id = auth.uid());

-- Owner restaurant can insert requests only for self
CREATE POLICY "Restaurants can insert their own payment_requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (restaurant_id = auth.uid());

-- Owner restaurant can update their requests (e.g., submit proof)
CREATE POLICY "Restaurants can update their own payment_requests"
ON public.payment_requests
FOR UPDATE
USING (restaurant_id = auth.uid());

-- Admins can manage all requests
CREATE POLICY "Admins can manage all payment_requests"
ON public.payment_requests
FOR ALL
USING (
  public.has_system_role(auth.uid(), 'admin') OR public.has_system_role(auth.uid(), 'super_admin')
);

-- Add last_payment_date to subscriptions for manual approval flow
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
