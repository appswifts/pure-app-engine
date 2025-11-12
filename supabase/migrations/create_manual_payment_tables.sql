-- Create manual_payments table
CREATE TABLE IF NOT EXISTS manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  customer_email TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  metadata JSONB,
  proof_of_payment_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create manual_subscriptions table
CREATE TABLE IF NOT EXISTS manual_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  next_payment_due TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_manual_payments_payment_id ON manual_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_restaurant_id ON manual_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_manual_payments_customer_email ON manual_payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_subscription_id ON manual_subscriptions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_customer_id ON manual_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_manual_subscriptions_status ON manual_subscriptions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_manual_payment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER manual_payments_updated_at
  BEFORE UPDATE ON manual_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_payment_updated_at();

CREATE TRIGGER manual_subscriptions_updated_at
  BEFORE UPDATE ON manual_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_payment_updated_at();

-- Enable Row Level Security
ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_payments
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON manual_payments
  FOR SELECT
  USING (customer_email = auth.jwt() ->> 'email');

-- Users can create payments
CREATE POLICY "Users can create payments" ON manual_payments
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON manual_payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can update payment status
CREATE POLICY "Admins can update payments" ON manual_payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for manual_subscriptions
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON manual_subscriptions
  FOR SELECT
  USING (customer_id = auth.uid()::text);

-- Users can create subscriptions
CREATE POLICY "Users can create subscriptions" ON manual_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON manual_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions" ON manual_subscriptions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

COMMENT ON TABLE manual_payments IS 'Stores manual payment records (bank transfer, mobile money, cash) that require verification';
COMMENT ON TABLE manual_subscriptions IS 'Stores manual subscription records that require recurring manual payments';
