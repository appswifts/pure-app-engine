-- Create manual payment configuration table
CREATE TABLE IF NOT EXISTS public.manual_payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled BOOLEAN DEFAULT false NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  mobile_money_provider TEXT,
  mobile_money_number TEXT,
  payment_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.manual_payment_config ENABLE ROW LEVEL SECURITY;

-- Create policies for manual payment config
CREATE POLICY "Anyone can view manual payment config"
  ON public.manual_payment_config
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update manual payment config"
  ON public.manual_payment_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can insert manual payment config"
  ON public.manual_payment_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Insert default configuration
INSERT INTO public.manual_payment_config (
  enabled,
  payment_instructions
) VALUES (
  false,
  'Please make payment to the provided account and upload proof of payment.'
) ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_manual_payment_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_manual_payment_config_updated_at
  BEFORE UPDATE ON public.manual_payment_config
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_payment_config_updated_at();
