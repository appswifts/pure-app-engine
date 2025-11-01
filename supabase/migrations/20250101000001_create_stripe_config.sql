-- Create Stripe Configuration Table
CREATE TABLE IF NOT EXISTS stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment TEXT NOT NULL CHECK (environment IN ('test', 'live')),
  publishable_key TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stripe_config ENABLE ROW LEVEL SECURITY;

-- Admin only policy - Only admins can view and modify Stripe config
CREATE POLICY "Admin only access to stripe_config"
  ON stripe_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_app_meta_data->>'role' = 'admin' 
           OR auth.users.raw_app_meta_data->>'is_admin' = 'true')
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_stripe_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stripe_config_updated_at
  BEFORE UPDATE ON stripe_config
  FOR EACH ROW
  EXECUTE FUNCTION update_stripe_config_updated_at();

-- Add comment
COMMENT ON TABLE stripe_config IS 'Stores Stripe API configuration for payment processing';

-- Create index for active config lookup
CREATE INDEX idx_stripe_config_active ON stripe_config(is_active) WHERE is_active = true;
