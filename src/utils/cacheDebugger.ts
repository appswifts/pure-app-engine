import { supabaseCache } from '@/lib/supabaseCache';

/**
 * Global cache debugging utilities
 * Available in browser console as window.cacheDebugger
 */
export const cacheDebugger = {
  /**
   * Clear all caches
   */
  clearAll: async () => {
    console.log('🧹 Clearing all caches...');
    
    // Clear Supabase cache
    supabaseCache.invalidate();
    console.log('✅ Supabase cache cleared');
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('menuforest-cache');
      console.log('✅ Local storage cleared');
    }
    
    // Clear browser cache if supported
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Browser cache cleared');
      } catch (error) {
        console.warn('⚠️ Browser cache clear failed:', error);
      }
    }
    
    console.log('🎉 All caches cleared! Refresh the page to see changes.');
  },

  /**
   * Clear only restaurant-related caches
   */
  clearRestaurant: (slug?: string) => {
    if (slug) {
      supabaseCache.invalidate(`restaurant:${slug}`);
      supabaseCache.invalidate(`menu_items:${slug}`);
      supabaseCache.invalidate(`menu_groups:${slug}`);
      console.log(`✅ Cleared cache for restaurant: ${slug}`);
    } else {
      supabaseCache.invalidate('restaurant:');
      supabaseCache.invalidate('menu_items:');
      supabaseCache.invalidate('menu_groups:');
      console.log('✅ Cleared all restaurant caches');
    }
  },

  /**
   * Get cache statistics
   */
  getStats: () => {
    const stats = supabaseCache.getStats();
    console.log('📊 Cache Statistics:', stats);
    
    if (typeof window !== 'undefined') {
      const localStorageSize = JSON.stringify(localStorage).length;
      console.log(`💾 Local Storage Size: ${(localStorageSize / 1024).toFixed(2)} KB`);
    }
    
    return stats;
  },

  /**
   * Test public menu loading for a restaurant
   */
  testPublicMenu: async (restaurantSlug: string) => {
    console.log(`🧪 Testing public menu for: ${restaurantSlug}`);
    
    try {
      // Clear cache for this restaurant first
      cacheDebugger.clearRestaurant(restaurantSlug);
      
      // Try to load restaurant data
      const restaurant = await supabaseCache.getRestaurant(restaurantSlug);
      console.log('✅ Restaurant loaded:', restaurant);
      
      // Load menu data
      const menuItems = await supabaseCache.getMenuItems(restaurant.id);
      console.log(`✅ Menu items loaded: ${menuItems.length} items`);
      
      const menuGroups = await supabaseCache.getMenuGroups(restaurant.id);
      console.log(`✅ Menu groups loaded: ${menuGroups.length} groups`);
      
      console.log('🎉 Public menu test completed successfully!');
      return { restaurant, menuItems, menuGroups };
    } catch (error) {
      console.error('❌ Public menu test failed:', error);
      throw error;
    }
  },

  /**
   * Preload data for a restaurant
   */
  preload: async (restaurantSlug: string) => {
    console.log(`🚀 Preloading data for: ${restaurantSlug}`);
    try {
      await supabaseCache.preloadRestaurant(restaurantSlug);
      console.log('✅ Preload completed');
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }
};

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).cacheDebugger = cacheDebugger;
  console.log('🔧 Cache debugger available at window.cacheDebugger');
  console.log('Available methods:');
  console.log('  - cacheDebugger.clearAll()');
  console.log('  - cacheDebugger.clearRestaurant(slug?)');
  console.log('  - cacheDebugger.getStats()');
  console.log('  - cacheDebugger.testPublicMenu(slug)');
  console.log('  - cacheDebugger.preload(slug)');
}

export default cacheDebugger;
