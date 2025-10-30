-- First, add admin user manually to user_roles table for the current authenticated user
-- This needs to be done first so you can access admin features

-- Create a system admin role for your user (replace with your actual user ID from auth.users)
-- You'll need to get your user ID from Supabase dashboard -> Authentication -> Users
-- INSERT INTO public.user_roles (user_id, role) VALUES ('your-user-id-here', 'admin');

-- Update tables schema to use slug instead of ID in QR links
-- Add slug to restaurants if not exists (check if this column is missing)
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update restaurants table to ensure all have slugs
UPDATE public.restaurants 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '--', '-'))
WHERE slug IS NULL OR slug = '';

-- Make slug unique and not null
ALTER TABLE public.restaurants 
ALTER COLUMN slug SET NOT NULL;

-- Add unique constraint for slug
ALTER TABLE public.restaurants 
ADD CONSTRAINT restaurants_slug_unique UNIQUE (slug);

-- Add slug to tables if not exists
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update tables to have slugs based on name
UPDATE public.tables 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '--', '-'))
WHERE slug IS NULL OR slug = '';

-- Make table slug not null
ALTER TABLE public.tables 
ALTER COLUMN slug SET NOT NULL;

-- Update QR generation to be one-time only (already implemented in code)
-- QR codes will not regenerate if qr_code_url already exists

-- Enhanced subscription system with flexible packages
-- Add package pricing and features columns if missing
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add trial and grace period columns to restaurants
ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_end_date TIMESTAMP WITH TIME ZONE;

-- Update packages to have default values
UPDATE public.packages 
SET trial_days = 14, grace_period_days = 7, is_active = true
WHERE trial_days IS NULL;