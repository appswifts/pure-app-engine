-- Create comprehensive manual payment system tables

-- Create subscription_plans table if not exists (enhanced)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RWF',
    billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
    trial_days INTEGER DEFAULT 14,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    max_menu_items INTEGER DEFAULT 100,
    max_tables INTEGER DEFAULT 10,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table if not exists (enhanced for manual payments)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'pending', -- pending, trial, active, expired, cancelled
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    next_billing_date TIMESTAMPTZ,
    last_payment_date TIMESTAMPTZ,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RWF',
    billing_interval TEXT NOT NULL DEFAULT 'monthly',
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    notes TEXT, -- Admin notes
    created_by UUID, -- Admin who created/approved
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_records table for tracking all payments
CREATE TABLE IF NOT EXISTS payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'RWF',
    payment_method TEXT NOT NULL DEFAULT 'manual', -- manual, bank_transfer, mobile_money, etc.
    reference_number TEXT,
    payment_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    verified_by UUID, -- Admin who verified
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription tracking to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive', -- inactive, trial, active, expired
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMPTZ;

-- Create manual_payment_instructions table
CREATE TABLE IF NOT EXISTS manual_payment_instructions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT,
    account_number TEXT,
    account_name TEXT,
    mobile_money_numbers JSONB DEFAULT '[]'::jsonb, -- Array of {provider, number}
    payment_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price, currency, billing_interval, trial_days, features, max_menu_items, max_tables, display_order) VALUES
('starter', 'Starter Plan', 'Perfect for small restaurants getting started', 15000, 'RWF', 'monthly', 14, 
 '["Up to 50 menu items", "Basic customization", "QR code menu", "WhatsApp ordering", "Email support"]'::jsonb, 50, 5, 1),
('professional', 'Professional Plan', 'Ideal for growing restaurants', 25000, 'RWF', 'monthly', 14, 
 '["Up to 200 menu items", "Advanced customization", "QR code menu", "WhatsApp ordering", "Analytics dashboard", "Priority support"]'::jsonb, 200, 15, 2),
('enterprise', 'Enterprise Plan', 'Complete solution for large establishments', 40000, 'RWF', 'monthly', 30, 
 '["Unlimited menu items", "Full customization", "QR code menu", "WhatsApp ordering", "Advanced analytics", "Multiple locations", "API access", "Dedicated support"]'::jsonb, 9999, 100, 3)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    max_menu_items = EXCLUDED.max_menu_items,
    max_tables = EXCLUDED.max_tables;

-- Insert default payment instructions
INSERT INTO manual_payment_instructions (bank_name, account_number, account_name, mobile_money_numbers, payment_instructions, is_active) VALUES
('Bank of Kigali', '1234567890123', 'MenuForest Ltd', 
 '[{"provider": "MTN", "number": "+250788123456"}, {"provider": "Airtel", "number": "+250732123456"}]'::jsonb,
 'Please make payment using one of the methods above and send proof to admin@menuforest.com. Include your restaurant name and reference number.',
 true)
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_payment_instructions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Restaurants can view their own subscriptions" ON subscriptions
    FOR SELECT USING (
        restaurant_id IN (SELECT id FROM restaurants WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
    FOR ALL USING (
        has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin')
    );

-- RLS Policies for payment_records
CREATE POLICY "Restaurants can view their payment records" ON payment_records
    FOR SELECT USING (
        subscription_id IN (
            SELECT s.id FROM subscriptions s 
            JOIN restaurants r ON s.restaurant_id = r.id 
            WHERE r.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all payment records" ON payment_records
    FOR ALL USING (
        has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin')
    );

-- RLS Policies for manual_payment_instructions
CREATE POLICY "Everyone can view payment instructions" ON manual_payment_instructions
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage payment instructions" ON manual_payment_instructions
    FOR ALL USING (
        has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin')
    );

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at BEFORE UPDATE ON payment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_manual_payment_instructions_updated_at BEFORE UPDATE ON manual_payment_instructions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check subscription access
CREATE OR REPLACE FUNCTION check_restaurant_subscription_access(restaurant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    restaurant_record RECORD;
BEGIN
    SELECT subscription_status, trial_end_date, subscription_end_date, grace_period_end_date
    INTO restaurant_record
    FROM restaurants
    WHERE id = restaurant_id;

    -- If no record found, deny access
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check subscription status
    CASE restaurant_record.subscription_status
        WHEN 'active' THEN
            -- Active subscription - check if not expired
            RETURN restaurant_record.subscription_end_date IS NULL OR restaurant_record.subscription_end_date > NOW();
        WHEN 'trial' THEN
            -- Trial period - check if not expired
            RETURN restaurant_record.trial_end_date IS NULL OR restaurant_record.trial_end_date > NOW();
        WHEN 'expired' THEN
            -- Expired but check grace period
            RETURN restaurant_record.grace_period_end_date IS NOT NULL AND restaurant_record.grace_period_end_date > NOW();
        ELSE
            -- inactive, cancelled, etc.
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;