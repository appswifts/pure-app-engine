-- Enable RLS for menu_items table
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Restaurant owners can manage their menu items" ON public.menu_items;

-- Policy: Allow public read access to all menu items
-- This is necessary for the public-facing menu to display items
CREATE POLICY "Public can view menu items"
ON public.menu_items
FOR SELECT
USING (true);

-- Policy: Allow restaurant owners to perform all actions on their own menu items
-- This policy checks that the user's ID matches the restaurant_id on the menu item
CREATE POLICY "Restaurant owners can manage their menu items"
ON public.menu_items
FOR ALL
USING (
  auth.uid() IN (
    SELECT restaurant_id FROM public.categories 
    WHERE id = menu_items.category_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT restaurant_id FROM public.categories 
    WHERE id = menu_items.category_id
  )
);

-- Additional policy for direct restaurant ownership check
CREATE POLICY "Restaurant owners can directly manage menu items"
ON public.menu_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = menu_items.category_id
    AND c.restaurant_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.categories c
    WHERE c.id = menu_items.category_id
    AND c.restaurant_id = auth.uid()
  )
);
