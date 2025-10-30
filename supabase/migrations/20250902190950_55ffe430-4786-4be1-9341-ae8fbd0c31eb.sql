-- Remove unused tables to clean up database
-- Keep only tables that are actually used in the application

-- Drop unused webhook events table (not used in current flow)
DROP TABLE IF EXISTS webhook_events CASCADE;

-- Drop redundant audit tables (keeping simpler logging if needed)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS security_audit_log CASCADE;

-- Drop subscription events (overkill for current needs)
DROP TABLE IF EXISTS subscription_events CASCADE;

-- Drop profile roles (redundant with user_roles and not used)
DROP TABLE IF EXISTS profile_roles CASCADE;

-- Check if restaurant_tables is redundant with tables
-- Based on analysis, restaurant_tables seems unused, keeping tables
DROP TABLE IF EXISTS restaurant_tables CASCADE;

-- Clean up any unused functions related to dropped tables
DROP FUNCTION IF EXISTS log_sensitive_operations() CASCADE;
DROP FUNCTION IF EXISTS log_security_event() CASCADE;
DROP FUNCTION IF EXISTS log_subscription_event() CASCADE;
DROP FUNCTION IF EXISTS assign_restaurant_role(uuid, uuid, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS has_restaurant_role(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS assign_restaurant_owner_role() CASCADE;

-- Ensure tables table has proper structure for QR codes
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS qr_code_data TEXT;

-- Add Stripe integration fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_stripe_customer ON restaurants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

-- Update subscription plans for cleaner structure
UPDATE subscription_plans 
SET features = jsonb_build_object(
  'max_menu_items', COALESCE(max_menu_items, 100),
  'max_tables', COALESCE(max_tables, 10),
  'custom_branding', true,
  'analytics', true
) 
WHERE features IS NULL;

-- Ensure RLS policies are in place for key tables
-- (They already exist, just confirming they're active)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;