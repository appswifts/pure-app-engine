-- Enable RLS on the categories table if it's not already enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh, if they exist
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage categories" ON public.categories;

-- Policy: Allow public read access to all categories
-- This is necessary for the public-facing menu to display categories.
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
USING (true);

-- Policy: Allow restaurant owners to perform all actions (INSERT, UPDATE, DELETE) on their own categories.
-- This policy checks that the user's ID matches the restaurant_id on the category.
CREATE POLICY "Restaurant owners can manage categories"
ON public.categories
FOR ALL
USING (auth.uid() = restaurant_id)
WITH CHECK (auth.uid() = restaurant_id);
