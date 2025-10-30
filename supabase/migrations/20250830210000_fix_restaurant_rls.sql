-- This migration fixes the missing RLS policies for the restaurants table.

BEGIN;

-- Enable RLS on the restaurants table if it's not already enabled.
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure a clean slate (optional, but good practice)
DROP POLICY IF EXISTS "Restaurant owners can view their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update their own restaurant" ON public.restaurants;
DROP POLICY IF EXISTS "Admins can manage all restaurants" ON public.restaurants;

-- 1. Policy for restaurant owners to view their own data
CREATE POLICY "Restaurant owners can view their own restaurant" ON public.restaurants
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Policy for restaurant owners to update their own data
CREATE POLICY "Restaurant owners can update their own restaurant" ON public.restaurants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Policy for admins to have full access
CREATE POLICY "Admins can manage all restaurants" ON public.restaurants
  FOR ALL
  USING (public.is_admin(auth.uid()));

COMMIT;
