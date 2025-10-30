-- Fix the manual payment system and database structure

-- First, update the existing subscription_plans table to use correct structure
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS billing_interval TEXT DEFAULT 'monthly';

-- Create payment_requests table for manual payments
CREATE TABLE IF NOT EXISTS payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    restaurant_id UUID NOT NULL,
    subscription_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RWF',
    billing_period_start TIMESTAMP,
    billing_period_end TIMESTAMP,
    due_date TIMESTAMP,
    grace_period_end TIMESTAMP,
    description TEXT,
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'mobile_money')),
    reference_number TEXT,
    payment_proof_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_approval', 'approved', 'rejected')),
    admin_notes TEXT,
    verified_by TEXT,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Enable RLS for payment_requests  
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_requests
CREATE POLICY "Users can view their own payment requests" ON payment_requests
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment requests" ON payment_requests  
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment requests" ON payment_requests
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payment requests" ON payment_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Fix subscriptions table RLS policies to work with current signup flow
DROP POLICY IF EXISTS "Users can insert subscriptions for their restaurants" ON subscriptions;
DROP POLICY IF EXISTS "Users can view their restaurant subscriptions" ON subscriptions;

CREATE POLICY "Users can create their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- Insert sample subscription plans with proper IDs
INSERT INTO subscription_plans (id, name, description, price, currency, billing_interval, trial_days, features, is_active, max_menu_items, max_tables) VALUES
('basic', 'Basic Plan', 'Perfect for small restaurants', 2500000, 'RWF', 'monthly', 7, 
 '["Up to 50 menu items", "Basic customization", "QR code menu", "Email support"]'::jsonb, true, 50, 10),

('premium', 'Premium Plan', 'Advanced features for growing restaurants', 4000000, 'RWF', 'monthly', 14, 
 '["Unlimited menu items", "Advanced customization", "Analytics dashboard", "Priority support"]'::jsonb, true, 999, 50),

('enterprise', 'Enterprise Plan', 'Complete solution for restaurant chains', 8000000, 'RWF', 'monthly', 30, 
 '["Everything in Premium", "White-label solution", "API access", "Custom integrations"]'::jsonb, true, 9999, 999)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  trial_days = EXCLUDED.trial_days,
  billing_interval = EXCLUDED.billing_interval,
  features = EXCLUDED.features;