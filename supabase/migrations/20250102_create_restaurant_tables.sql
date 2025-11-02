-- Migration: Create restaurant_tables table
-- Description: Creates the restaurant_tables table for managing restaurant tables and QR codes

-- Create restaurant_tables table
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  table_name TEXT,
  qr_code_data TEXT NOT NULL,
  qr_code_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_restaurant_table UNIQUE (restaurant_id, table_number)
);

-- Add comment
COMMENT ON TABLE public.restaurant_tables IS 'Stores restaurant tables for QR code generation and table management';

-- Enable Row Level Security
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant owners can manage their tables" ON public.restaurant_tables;

-- Create RLS policy for public viewing (read-only for QR code scanning)
CREATE POLICY "Public can view active tables" 
ON public.restaurant_tables 
FOR SELECT 
USING (is_active = true);

-- Create RLS policy for restaurant owners (full CRUD)
CREATE POLICY "Restaurant owners can manage their tables" 
ON public.restaurant_tables 
FOR ALL 
USING (restaurant_id IN (
  SELECT id FROM public.restaurants WHERE user_id = auth.uid()
));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id 
ON public.restaurant_tables(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_table_number 
ON public.restaurant_tables(table_number);

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_active 
ON public.restaurant_tables(is_active) 
WHERE is_active = true;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at column
DROP TRIGGER IF EXISTS handle_restaurant_tables_updated_at ON public.restaurant_tables;
CREATE TRIGGER handle_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
