-- Add is_accompaniment column to menu_items table
-- This allows menu items to be flagged as available for use as accompaniments

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_accompaniment BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.is_accompaniment IS 'Indicates if this menu item can be used as an accompaniment/extra for other items';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_is_accompaniment 
ON menu_items(is_accompaniment) 
WHERE is_accompaniment = true;
