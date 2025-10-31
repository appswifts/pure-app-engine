-- Create menu_groups table for cuisine types
CREATE TABLE IF NOT EXISTS public.menu_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add menu_group_id to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS menu_group_id UUID REFERENCES public.menu_groups(id) ON DELETE CASCADE;

-- Create index for menu_groups
CREATE INDEX IF NOT EXISTS idx_menu_groups_restaurant_id ON public.menu_groups(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_groups_display_order ON public.menu_groups(restaurant_id, display_order);
CREATE INDEX IF NOT EXISTS idx_categories_menu_group_id ON public.categories(menu_group_id);

-- Enable RLS on menu_groups
ALTER TABLE public.menu_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for menu_groups
CREATE POLICY "Public can view active menu groups"
ON public.menu_groups FOR SELECT
USING (is_active = true);

CREATE POLICY "Restaurant owners can manage their menu groups"
ON public.menu_groups FOR ALL
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants WHERE user_id = auth.uid()
  )
);

-- Update existing categories to have a default menu group
-- First, create a default menu group for each restaurant that has categories
INSERT INTO public.menu_groups (restaurant_id, name, description, display_order, is_active)
SELECT DISTINCT 
  c.restaurant_id, 
  'Main Menu' as name,
  'Default menu group' as description,
  0 as display_order,
  true as is_active
FROM public.categories c
WHERE NOT EXISTS (
  SELECT 1 FROM public.menu_groups mg WHERE mg.restaurant_id = c.restaurant_id
)
ON CONFLICT DO NOTHING;

-- Link existing categories to their restaurant's default menu group
UPDATE public.categories c
SET menu_group_id = (
  SELECT mg.id 
  FROM public.menu_groups mg 
  WHERE mg.restaurant_id = c.restaurant_id 
  ORDER BY mg.display_order ASC 
  LIMIT 1
)
WHERE menu_group_id IS NULL;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_menu_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_menu_groups_timestamp
BEFORE UPDATE ON public.menu_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_groups_updated_at();