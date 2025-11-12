import { supabase } from '@/integrations/supabase/client';

/**
 * Smart caching layer for Supabase to reduce API calls and improve performance
 * Caches data at the browser level with configurable TTL
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SupabaseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get data from cache or fetch from Supabase
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Return cached if still valid
    if (cached && cached.expiresAt > now) {
      console.log(`✅ Cache HIT: ${key} (${Math.round((cached.expiresAt - now) / 1000)}s remaining)`);
      return cached.data as T;
    }

    // Fetch fresh data
    console.log(`❌ Cache MISS: ${key} - Fetching from Supabase...`);
    const data = await fetcher();

    // Store in cache
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });

    return data;
  }

  /**
   * Invalidate cache entries
   */
  invalidate(keyPattern?: string) {
    if (!keyPattern) {
      console.log('🗑️ Clearing entire cache');
      this.cache.clear();
      return;
    }

    // Invalidate matching keys
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    console.log(`🗑️ Invalidated ${count} cache entries matching: ${keyPattern}`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const stats = {
      totalEntries: this.cache.size,
      entries: [] as Array<{ key: string; age: number; ttl: number }>
    };

    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      stats.entries.push({
        key,
        age: Math.round((now - entry.timestamp) / 1000),
        ttl: Math.round((entry.expiresAt - now) / 1000)
      });
    }

    return stats;
  }

  /**
   * Preload commonly accessed data for a restaurant
   */
  async preloadRestaurant(slug: string) {
    console.log(`🚀 Preloading data for restaurant: ${slug}`);
    const start = performance.now();

    try {
      // Get restaurant first
      const restaurant = await this.getRestaurant(slug);
      
      // Then preload related data in parallel
      await Promise.all([
        this.getMenuItems(restaurant.id),
        this.getCategories(restaurant.id),
        this.getMenuGroups(restaurant.id)
      ]);

      const duration = Math.round(performance.now() - start);
      console.log(`✅ Preload complete in ${duration}ms`);
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }

  /**
   * Get restaurant by slug (10 min cache)
   */
  async getRestaurant(slug: string) {
    return this.getOrFetch(
      `restaurant:${slug}`,
      async () => {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        return data;
      },
      10 * 60 * 1000 // 10 minutes - restaurants rarely change
    );
  }

  /**
   * Get menu items for a restaurant (5 min cache)
   */
  async getMenuItems(restaurantId: string, options?: { includeUnavailable?: boolean }) {
    const key = `menu_items:${restaurantId}:${options?.includeUnavailable ? 'all' : 'available'}`;
    
    return this.getOrFetch(
      key,
      async () => {
        let query = supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('display_order');
        
        if (!options?.includeUnavailable) {
          query = query.eq('is_available', true);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      5 * 60 * 1000 // 5 minutes
    );
  }

  /**
   * Get categories for a restaurant (10 min cache)
   */
  async getCategories(restaurantId: string) {
    return this.getOrFetch(
      `categories:${restaurantId}`,
      async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('display_order');
        
        if (error) throw error;
        return data || [];
      },
      10 * 60 * 1000 // 10 minutes
    );
  }

  /**
   * Get menu groups for a restaurant (10 min cache)
   */
  async getMenuGroups(restaurantId: string) {
    return this.getOrFetch(
      `menu_groups:${restaurantId}`,
      async () => {
        const { data, error } = await supabase
          .from('menu_groups')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        return data || [];
      },
      10 * 60 * 1000 // 10 minutes
    );
  }

  /**
   * Get variations for menu items (10 min cache)
   */
  async getVariations() {
    return this.getOrFetch(
      'item_variations',
      async () => {
        const { data, error } = await supabase
          .from('item_variations')
          .select('*')
          .order('display_order');
        
        if (error) throw error;
        return data || [];
      },
      10 * 60 * 1000 // 10 minutes
    );
  }

  /**
   * Get accompaniments (10 min cache)
   */
  async getAccompaniments() {
    return this.getOrFetch(
      'accompaniments',
      async () => {
        const { data, error } = await supabase
          .from('accompaniments')
          .select('*')
          .order('display_order');
        
        if (error) throw error;
        return data || [];
      },
      10 * 60 * 1000 // 10 minutes
    );
  }
}

// Export singleton instance
export const supabaseCache = new SupabaseCache();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).supabaseCache = supabaseCache;
}

export default supabaseCache;
