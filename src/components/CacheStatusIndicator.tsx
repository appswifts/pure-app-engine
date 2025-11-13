import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';
import { supabaseCache } from '@/lib/supabaseCache';
import { cacheDebugger } from '@/utils/cacheDebugger';

interface CacheStatusIndicatorProps {
  restaurantSlug?: string;
  showOnlyInDev?: boolean;
}

const CacheStatusIndicator: React.FC<CacheStatusIndicatorProps> = ({ 
  restaurantSlug,
  showOnlyInDev = true 
}) => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show only in development or when debug=true in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isDev = process.env.NODE_ENV === 'development';
    const isDebug = urlParams.get('debug') === 'true' || urlParams.get('cache') === 'true';
    
    if (!showOnlyInDev || isDev || isDebug) {
      setIsVisible(true);
      loadCacheStats();
      
      // Update stats every 5 seconds
      const interval = setInterval(loadCacheStats, 5000);
      return () => clearInterval(interval);
    }
  }, [showOnlyInDev]);

  const loadCacheStats = () => {
    const stats = supabaseCache.getStats();
    setCacheStats(stats);
  };

  const handleClearCache = async () => {
    try {
      if (restaurantSlug) {
        cacheDebugger.clearRestaurant(restaurantSlug);
      } else {
        await cacheDebugger.clearAll();
      }
      loadCacheStats();
      // Reload the page after clearing cache
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  if (!isVisible || !cacheStats) {
    return null;
  }

  const hasCache = cacheStats.totalEntries > 0;
  const restaurantCacheEntries = restaurantSlug 
    ? cacheStats.entries.filter((entry: any) => entry.key.includes(restaurantSlug)).length
    : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Cache Status</span>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div>Total entries: {cacheStats.totalEntries}</div>
          {restaurantSlug && (
            <div>Restaurant entries: {restaurantCacheEntries}</div>
          )}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${hasCache ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{hasCache ? 'Cache active' : 'No cache'}</span>
          </div>
        </div>

        <div className="flex gap-1 mt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleClearCache}
            className="text-xs h-6 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="text-xs h-6 px-2"
          >
            Reload
          </Button>
        </div>

        {!hasCache && (
          <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
            <AlertCircle className="h-3 w-3" />
            <span>Menu may load slowly</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CacheStatusIndicator;
