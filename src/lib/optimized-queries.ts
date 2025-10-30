import { supabase } from '@/integrations/supabase/client';

// Optimized query builder with proper indexing hints
export class OptimizedQueries {
  // Single query to fetch all menu data with joins - using regular queries instead of RPC
  static async getCompleteMenuData(restaurantId: string) {
    // Fetch restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();
    
    if (restaurantError) throw restaurantError;

    // Fetch categories with items
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        *,
        menu_items!inner(
          *,
          item_variations(*),
          accompaniments(*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('menu_items.is_available', true)
      .order('display_order');
    
    if (categoriesError) throw categoriesError;
    
    return { restaurant, categories };
  }

  // Batch fetch with proper pagination
  static async getMenuItemsBatch(restaurantId: string, page = 0, limit = 50) {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        categories!inner(id, name, display_order),
        item_variations(id, name, price_modifier),
        accompaniments(id, name, price, is_required)
      `)
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .order('display_order')
      .range(page * limit, (page + 1) * limit - 1);

    if (error) throw error;
    return data;
  }

  // Optimized restaurant data with access control
  static async getRestaurantWithAccess(slug: string) {
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) throw error;
    
    // Check access based on subscription status
    const restaurantData = restaurant as any;
    const hasAccess = restaurant && (
      restaurantData.subscription_status === 'active' ||
      (restaurantData.trial_end_date && new Date(restaurantData.trial_end_date) > new Date()) ||
      (restaurantData.grace_period_end_date && new Date(restaurantData.grace_period_end_date) > new Date())
    );
    
    return {
      restaurant,
      hasAccess,
      status: restaurantData?.subscription_status
    };
  }

  // Cached category fetch with count
  static async getCategoriesWithItemCount(restaurantId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        menu_items!inner(count)
      `)
      .eq('restaurant_id', restaurantId)
      .order('display_order');

    if (error) throw error;
    return data;
  }

  // Optimized search with full-text search
  static async searchMenuItems(restaurantId: string, query: string) {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true)
      .textSearch('name', query, { type: 'websearch' })
      .limit(20);

    if (error) throw error;
    return data;
  }
}

// Database migration suggestions for better performance
export const performanceIndexes = `
-- Add these indexes to your Supabase database for better performance

-- Composite index for menu items by restaurant and availability
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_restaurant_available 
ON menu_items (restaurant_id, is_available, display_order);

-- Index for restaurant slug lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_slug 
ON restaurants (slug) WHERE slug IS NOT NULL;

-- Index for categories by restaurant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_restaurant_order 
ON categories (restaurant_id, display_order);

-- Index for variations by menu item
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_variations_menu_item 
ON item_variations (menu_item_id);

-- Index for accompaniments by menu item
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accompaniments_menu_item 
ON accompaniments (menu_item_id);

-- Partial index for active restaurants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_restaurants_active 
ON restaurants (id) WHERE subscription_status = 'active';
`;

// SQL functions for better performance
export const optimizedFunctions = `
-- Create this function in your Supabase database

CREATE OR REPLACE FUNCTION get_complete_menu_data(restaurant_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'restaurant', (
      SELECT row_to_json(r) FROM (
        SELECT * FROM restaurants WHERE id = restaurant_id
      ) r
    ),
    'categories', (
      SELECT json_agg(
        json_build_object(
          'id', c.id,
          'name', c.name,
          'display_order', c.display_order,
          'items', (
            SELECT json_agg(
              json_build_object(
                'id', mi.id,
                'name', mi.name,
                'description', mi.description,
                'base_price', mi.base_price,
                'image_url', mi.image_url,
                'display_order', mi.display_order,
                'variations', (
                  SELECT json_agg(row_to_json(iv)) 
                  FROM item_variations iv 
                  WHERE iv.menu_item_id = mi.id
                ),
                'accompaniments', (
                  SELECT json_agg(row_to_json(a)) 
                  FROM accompaniments a 
                  WHERE a.menu_item_id = mi.id
                )
              ) ORDER BY mi.display_order
            )
            FROM menu_items mi 
            WHERE mi.category_id = c.id 
            AND mi.is_available = true
          )
        ) ORDER BY c.display_order
      )
      FROM categories c 
      WHERE c.restaurant_id = get_complete_menu_data.restaurant_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function for restaurant access check
CREATE OR REPLACE FUNCTION get_restaurant_with_access_check(restaurant_slug TEXT)
RETURNS JSON AS $$
DECLARE
  restaurant_data JSON;
  access_status TEXT;
BEGIN
  SELECT json_build_object(
    'restaurant', row_to_json(r),
    'hasAccess', (
      CASE 
        WHEN r.subscription_status = 'active' THEN true
        WHEN r.trial_end_date > NOW() THEN true
        WHEN r.grace_period_end_date > NOW() THEN true
        ELSE false
      END
    ),
    'status', r.subscription_status
  )
  INTO restaurant_data
  FROM restaurants r
  WHERE r.slug = restaurant_slug;
  
  RETURN restaurant_data;
END;
$$ LANGUAGE plpgsql STABLE;
`;
