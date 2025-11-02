-- Migration: Create restaurant_tables and migrate existing data (FIXED)
-- This version handles existing policies

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

-- Enable Row Level Security
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active tables" ON public.restaurant_tables;
DROP POLICY IF EXISTS "Restaurant owners can manage their tables" ON public.restaurant_tables;

-- Create RLS policies
CREATE POLICY "Public can view active tables" 
ON public.restaurant_tables FOR SELECT USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their tables" 
ON public.restaurant_tables FOR ALL 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE user_id = auth.uid()));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_restaurant_id ON public.restaurant_tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_table_number ON public.restaurant_tables(table_number);

-- Migrate existing data from old "tables" table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tables') THEN
    -- Copy data from old tables to new restaurant_tables
    INSERT INTO public.restaurant_tables (
      id,
      restaurant_id,
      table_number,
      table_name,
      qr_code_data,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      id,
      restaurant_id,
      COALESCE(slug, name, 'table-' || id::text) as table_number,
      name as table_name,
      COALESCE(slug, name, 'table-' || id::text) as qr_code_data,
      COALESCE(is_active, true) as is_active,
      COALESCE(created_at, now()) as created_at,
      COALESCE(updated_at, now()) as updated_at
    FROM public.tables
    ON CONFLICT (restaurant_id, table_number) DO NOTHING;
    
    RAISE NOTICE 'Migrated existing tables from old "tables" table';
  END IF;
END $$;
