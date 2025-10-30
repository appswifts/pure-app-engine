-- Add missing slug field to restaurants table if it doesn't exist
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update slug for existing restaurants that don't have one
UPDATE public.restaurants 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', ''))
WHERE slug IS NULL OR slug = '';

-- Make slug unique and not null after populating
ALTER TABLE public.restaurants 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint on slug
ALTER TABLE public.restaurants
ADD CONSTRAINT restaurants_slug_unique UNIQUE (slug);

-- Update tables to use slug instead of id for easier table identification
-- Add table slug field if not exists
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing tables with proper slugs
UPDATE public.tables 
SET slug = LOWER(REPLACE(name, ' ', '-'))
WHERE slug IS NULL OR slug = '';

-- Make table slug not null and add unique constraint per restaurant
ALTER TABLE public.tables 
ALTER COLUMN slug SET NOT NULL;

-- Create unique constraint for table slug within a restaurant
ALTER TABLE public.tables
ADD CONSTRAINT tables_restaurant_slug_unique UNIQUE (restaurant_id, slug);