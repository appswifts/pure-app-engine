-- Add restaurant customization fields
ALTER TABLE public.restaurants 
ADD COLUMN slug TEXT UNIQUE,
ADD COLUMN brand_color TEXT DEFAULT '#3B82F6',
ADD COLUMN font_family TEXT DEFAULT 'Inter',
ADD COLUMN background_style TEXT DEFAULT 'gradient',
ADD COLUMN background_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN logo_url TEXT;

-- Add image fields to variations and accompaniments
ALTER TABLE public.item_variations 
ADD COLUMN image_url TEXT;

ALTER TABLE public.accompaniments 
ADD COLUMN image_url TEXT;

-- Create unique slugs for existing restaurants (based on name)
UPDATE public.restaurants 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE slug IS NULL;

-- Make slug required after setting values
ALTER TABLE public.restaurants 
ALTER COLUMN slug SET NOT NULL;

-- Update tables to use restaurant slug for QR generation
ALTER TABLE public.tables 
ADD COLUMN slug TEXT;

-- Generate table slugs based on name
UPDATE public.tables 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''));

-- Make table slug required
ALTER TABLE public.tables 
ALTER COLUMN slug SET NOT NULL;

-- Create unique constraint for table slugs within restaurant
ALTER TABLE public.tables 
ADD CONSTRAINT tables_restaurant_slug_unique UNIQUE (restaurant_id, slug);

-- Add indexes for better performance
CREATE INDEX idx_restaurants_slug ON public.restaurants (slug);
CREATE INDEX idx_tables_slug ON public.tables (restaurant_id, slug);