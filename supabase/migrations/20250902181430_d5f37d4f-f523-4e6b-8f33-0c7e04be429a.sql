-- Create restaurant_tables table for QR code functionality
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  table_number TEXT NOT NULL,
  table_name TEXT,
  qr_code_data TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_restaurant_table UNIQUE (restaurant_id, table_number)
);

-- Enable RLS for restaurant_tables
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for restaurant_tables
CREATE POLICY "Public can view tables for menu access" 
ON public.restaurant_tables 
FOR SELECT 
USING (true);

CREATE POLICY "Restaurant owners can manage their tables" 
ON public.restaurant_tables 
FOR ALL 
USING (restaurant_id IN (
  SELECT id FROM restaurants WHERE user_id = auth.uid()
));

-- Add missing columns to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create trigger for updated_at on restaurant_tables
CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();