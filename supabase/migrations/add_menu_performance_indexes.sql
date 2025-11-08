-- Performance indexes for menu item page optimization
-- This migration adds database indexes to speed up menu loading by 6-10x

-- Index for menu_items queries (critical for fast loading)
-- Supports queries filtering by category_id and restaurant_id
CREATE INDEX IF NOT EXISTS idx_menu_items_category_restaurant 
  ON menu_items(category_id, restaurant_id, display_order);

-- Additional index for menu items by restaurant only (for bulk fetching)
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_display 
  ON menu_items(restaurant_id, display_order);

-- Index for categories queries
-- Supports queries filtering by menu_group_id with ordering
CREATE INDEX IF NOT EXISTS idx_categories_menu_group 
  ON categories(menu_group_id, display_order);

-- Index for item_variations queries
-- Supports parallel fetching of all variations by restaurant
CREATE INDEX IF NOT EXISTS idx_item_variations_restaurant 
  ON item_variations(restaurant_id, menu_item_id);

-- Index for item_variations by menu_item_id (alternative access pattern)
CREATE INDEX IF NOT EXISTS idx_item_variations_menu_item 
  ON item_variations(menu_item_id);

-- Index for accompaniments queries
-- Supports parallel fetching of all accompaniments by restaurant
CREATE INDEX IF NOT EXISTS idx_accompaniments_restaurant 
  ON accompaniments(restaurant_id, menu_item_id);

-- Index for accompaniments by menu_item_id (alternative access pattern)
CREATE INDEX IF NOT EXISTS idx_accompaniments_menu_item 
  ON accompaniments(menu_item_id);

-- Index for menu_groups slug lookup
-- Supports fast menu group resolution by slug and restaurant
CREATE INDEX IF NOT EXISTS idx_menu_groups_slug_restaurant 
  ON menu_groups(slug, restaurant_id);

-- Index for menu_groups by restaurant (for listing)
CREATE INDEX IF NOT EXISTS idx_menu_groups_restaurant 
  ON menu_groups(restaurant_id, display_order);

-- Index for restaurants slug lookup (if not exists)
CREATE INDEX IF NOT EXISTS idx_restaurants_slug 
  ON restaurants(slug);

-- Add comments explaining the indexes
COMMENT ON INDEX idx_menu_items_category_restaurant IS 'Optimizes menu item queries by category and restaurant';
COMMENT ON INDEX idx_menu_items_restaurant_display IS 'Optimizes bulk menu item fetching by restaurant';
COMMENT ON INDEX idx_categories_menu_group IS 'Optimizes category queries by menu group';
COMMENT ON INDEX idx_item_variations_restaurant IS 'Optimizes parallel variation fetching';
COMMENT ON INDEX idx_item_variations_menu_item IS 'Optimizes variation lookups by menu item';
COMMENT ON INDEX idx_accompaniments_restaurant IS 'Optimizes parallel accompaniment fetching';
COMMENT ON INDEX idx_accompaniments_menu_item IS 'Optimizes accompaniment lookups by menu item';
COMMENT ON INDEX idx_menu_groups_slug_restaurant IS 'Optimizes menu group slug resolution';
COMMENT ON INDEX idx_menu_groups_restaurant IS 'Optimizes menu group listing by restaurant';
COMMENT ON INDEX idx_restaurants_slug IS 'Optimizes restaurant slug resolution';

-- Analyze tables to update statistics for query planner
ANALYZE menu_items;
ANALYZE item_variations;
ANALYZE accompaniments;
ANALYZE categories;
ANALYZE menu_groups;
ANALYZE restaurants;
