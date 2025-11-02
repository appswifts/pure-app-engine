-- Create saved_qr_codes table for QR code library
CREATE TABLE IF NOT EXISTS public.saved_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  custom_name TEXT,
  category TEXT,
  type TEXT NOT NULL CHECK (type IN ('single', 'multi', 'full')),
  url TEXT NOT NULL,
  qr_code_data TEXT NOT NULL, -- base64 encoded QR code
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  table_name TEXT,
  group_ids UUID[],
  group_names TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_saved_qr_codes_restaurant_id 
ON public.saved_qr_codes(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_saved_qr_codes_table_id 
ON public.saved_qr_codes(table_id);

CREATE INDEX IF NOT EXISTS idx_saved_qr_codes_type 
ON public.saved_qr_codes(type);

CREATE INDEX IF NOT EXISTS idx_saved_qr_codes_category 
ON public.saved_qr_codes(category);

CREATE INDEX IF NOT EXISTS idx_saved_qr_codes_created_at 
ON public.saved_qr_codes(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view saved QR codes for their restaurants"
ON public.saved_qr_codes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = saved_qr_codes.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert saved QR codes for their restaurants"
ON public.saved_qr_codes FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = saved_qr_codes.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update saved QR codes for their restaurants"
ON public.saved_qr_codes FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = saved_qr_codes.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = saved_qr_codes.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete saved QR codes for their restaurants"
ON public.saved_qr_codes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE restaurants.id = saved_qr_codes.restaurant_id 
    AND restaurants.user_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_saved_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saved_qr_codes_updated_at
BEFORE UPDATE ON public.saved_qr_codes
FOR EACH ROW
EXECUTE FUNCTION update_saved_qr_codes_updated_at();

-- Comment
COMMENT ON TABLE public.saved_qr_codes IS 'Stores organized library of generated QR codes for restaurants';
