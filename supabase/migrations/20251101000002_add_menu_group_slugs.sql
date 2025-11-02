-- Add slug column to menu_groups table
ALTER TABLE public.menu_groups 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate slugs for existing menu groups
UPDATE public.menu_groups
SET slug = generate_slug(name)
WHERE slug IS NULL;

-- Make slug required and unique per restaurant
ALTER TABLE public.menu_groups 
ALTER COLUMN slug SET NOT NULL;

-- Create unique index for slug per restaurant
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_groups_restaurant_slug 
ON public.menu_groups(restaurant_id, slug);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_menu_groups_slug ON public.menu_groups(slug);

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION set_menu_group_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_menu_group_slug
BEFORE INSERT OR UPDATE OF name ON public.menu_groups
FOR EACH ROW
EXECUTE FUNCTION set_menu_group_slug();

-- Comment
COMMENT ON COLUMN public.menu_groups.slug IS 'URL-friendly slug generated from name, unique per restaurant';
