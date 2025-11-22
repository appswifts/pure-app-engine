import { supabase } from '@/integrations/supabase/client';

/**
 * Smart caching layer for Supabase to reduce API calls and improve performance
 * Caches data at the browser level with configurable TTL
 * Persists to localStorage for faster subsequent page loads
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PersistedCache {
  version: number;
  timestamp: number;
  entries: Record<string, CacheEntry<any>>;
}

class SupabaseCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  private readonly CACHE_VERSION = 1; // Increment when cache structure changes
  private readonly STORAGE_KEY = 'menuforest-supabase-cache';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

  constructor() {
    // Restore cache from localStorage on initialization
    this.restoreFromLocalStorage();
  }

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

    // Persist to localStorage in background
    this.persistToLocalStorage();

    return data;
  }

  /**
   * Persist cache to localStorage with compression and quota handling
   */
  private persistToLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return; // Skip if not in browser environment
    }

    try {
      // Convert Map to plain object
      const entries: Record<string, CacheEntry<any>> = {};
      const now = Date.now();

      // Only persist non-expired entries
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt > now) {
          entries[key] = entry;
        }
      }

      const persistedCache: PersistedCache = {
        version: this.CACHE_VERSION,
        timestamp: now,
        entries
      };

      const serialized = JSON.stringify(persistedCache);

      // Check size before saving
      if (serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('⚠️ Cache too large for localStorage, pruning old entries...');
        this.pruneCache();
        return; // Retry will happen on next persist call
      }

      localStorage.setItem(this.STORAGE_KEY, serialized);
      console.log(`💾 Cache persisted: ${Object.keys(entries).length} entries, ${(serialized.length / 1024).toFixed(1)}KB`);
    } catch (error: any) {
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('⚠️ localStorage quota exceeded, clearing old cache...');
        localStorage.removeItem(this.STORAGE_KEY);
        this.pruneCache();
      } else {
        console.error('Failed to persist cache:', error);
      }
    }
  }

  /**
   * Restore cache from localStorage on initialization
   */
  private restoreFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        console.log('📦 No cached data found in localStorage');
        return;
      }

      const persistedCache: PersistedCache = JSON.parse(stored);

      // Check version compatibility
      if (persistedCache.version !== this.CACHE_VERSION) {
        console.log('🔄 Cache version mismatch, clearing old cache');
        localStorage.removeItem(this.STORAGE_KEY);
        return;
      }

      const now = Date.now();
      let restoredCount = 0;
      let expiredCount = 0;

      // Restore non-expired entries
      for (const [key, entry] of Object.entries(persistedCache.entries)) {
        if (entry.expiresAt > now) {
          this.cache.set(key, entry);
          restoredCount++;
        } else {
          expiredCount++;
        }
      }

      const cacheAge = Math.round((now - persistedCache.timestamp) / 1000);
      console.log(`✅ Cache restored: ${restoredCount} entries (${expiredCount} expired, cache age: ${cacheAge}s)`);

      // If we had expired entries, update localStorage
      if (expiredCount > 0) {
        this.persistToLocalStorage();
      }
    } catch (error) {
      console.error('Failed to restore cache from localStorage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Prune cache by removing oldest entries
   */
  private pruneCache() {
    const entries = Array.from(this.cache.entries());

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 30% of entries
    const removeCount = Math.ceil(entries.length * 0.3);
    for (let i = 0; i < removeCount; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`🗑️ Pruned ${removeCount} oldest cache entries`);
    this.persistToLocalStorage();
  }

  /**
   * Invalidate cache entries
   */
  invalidate(keyPattern?: string) {
    if (!keyPattern) {
      console.log('🗑️ Clearing entire cache');
      this.cache.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.STORAGE_KEY);
      }
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

    // Update localStorage
    if (count > 0) {
      this.persistToLocalStorage();
    }
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
        console.log('Menu groups loaded with currency:', data);
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
