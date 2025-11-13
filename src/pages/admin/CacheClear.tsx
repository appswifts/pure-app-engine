import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Trash2, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Globe, 
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { supabaseCache } from '@/lib/supabaseCache';
import { useQueryClient } from '@tanstack/react-query';

interface CacheStats {
  supabaseCache: {
    totalEntries: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  };
  localStorage: {
    totalSize: number;
    menuforestCache: boolean;
    otherKeys: string[];
  };
  reactQuery: {
    totalQueries: number;
    activeQueries: number;
  };
  browserCache: {
    supported: boolean;
  };
}

const CacheClear: React.FC = () => {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCleared, setLastCleared] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    loadCacheStats();
    
    // Auto-refresh stats every 10 seconds
    const interval = setInterval(loadCacheStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheStats = async () => {
    try {
      // Get Supabase cache stats
      const supabaseCacheStats = supabaseCache.getStats();

      // Get localStorage stats
      let localStorageStats = {
        totalSize: 0,
        menuforestCache: false,
        otherKeys: [] as string[]
      };

      if (typeof window !== 'undefined') {
        try {
          let totalSize = 0;
          const otherKeys: string[] = [];
          
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const value = localStorage.getItem(key) || '';
              totalSize += key.length + value.length;
              
              if (key === 'menuforest-cache') {
                localStorageStats.menuforestCache = true;
              } else {
                otherKeys.push(key);
              }
            }
          }
          
          localStorageStats.totalSize = totalSize;
          localStorageStats.otherKeys = otherKeys;
        } catch (error) {
          console.error('Error reading localStorage:', error);
        }
      }

      // Get React Query stats
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      const activeQueries = allQueries.filter(q => q.state.status === 'success');

      setStats({
        supabaseCache: supabaseCacheStats,
        localStorage: localStorageStats,
        reactQuery: {
          totalQueries: allQueries.length,
          activeQueries: activeQueries.length
        },
        browserCache: {
          supported: 'caches' in window
        }
      });
    } catch (error) {
      console.error('Error loading cache stats:', error);
    }
  };

  const clearSupabaseCache = async () => {
    setLoading(true);
    try {
      supabaseCache.invalidate(); // Clear all
      await loadCacheStats();
      setLastCleared('Supabase Cache');
      toast({
        title: "Success",
        description: "Supabase cache cleared successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear Supabase cache",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearReactQueryCache = async () => {
    setLoading(true);
    try {
      queryClient.clear();
      await loadCacheStats();
      setLastCleared('React Query Cache');
      toast({
        title: "Success",
        description: "React Query cache cleared successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear React Query cache",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = async () => {
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        // Clear only our app's localStorage items
        const keysToRemove = ['menuforest-cache'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
      }
      await loadCacheStats();
      setLastCleared('Local Storage');
      toast({
        title: "Success",
        description: "Local storage cleared successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear local storage",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearBrowserCache = async () => {
    setLoading(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        setLastCleared('Browser Cache');
        toast({
          title: "Success",
          description: "Browser cache cleared successfully",
        });
      } else {
        toast({
          title: "Warning",
          description: "Browser cache API not supported",
          variant: "destructive",
        });
      }
      await loadCacheStats();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear browser cache",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllCaches = async () => {
    setLoading(true);
    try {
      // Clear all caches in parallel
      await Promise.all([
        supabaseCache.invalidate(),
        queryClient.clear(),
        typeof window !== 'undefined' ? localStorage.removeItem('menuforest-cache') : Promise.resolve(),
        'caches' in window ? caches.keys().then(names => 
          Promise.all(names.map(name => caches.delete(name)))
        ) : Promise.resolve()
      ]);

      await loadCacheStats();
      setLastCleared('All Caches');
      toast({
        title: "Success",
        description: "All caches cleared successfully! Public menus should now load fresh data.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to clear all caches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <RefreshCw className="h-8 w-8" />
          Cache Management
        </h1>
        <p className="text-muted-foreground">Loading cache statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <RefreshCw className="h-8 w-8" />
            Cache Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Clear caches to resolve public menu viewing issues
          </p>
        </div>
        <Button 
          onClick={clearAllCaches} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Caches
        </Button>
      </div>

      {/* Last Cleared Info */}
      {lastCleared && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">
                Last cleared: <strong>{lastCleared}</strong> at {new Date().toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Supabase Cache */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Supabase Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.supabaseCache.totalEntries}</div>
              <div className="text-xs text-muted-foreground">entries cached</div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearSupabaseCache}
                disabled={loading}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* React Query Cache */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              React Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{stats.reactQuery.totalQueries}</div>
              <div className="text-xs text-muted-foreground">
                {stats.reactQuery.activeQueries} active queries
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearReactQueryCache}
                disabled={loading}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Local Storage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Local Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{formatBytes(stats.localStorage.totalSize)}</div>
              <div className="text-xs text-muted-foreground">
                {stats.localStorage.menuforestCache ? '✅ Has cache' : '❌ No cache'}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearLocalStorage}
                disabled={loading}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Browser Cache */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Browser Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {stats.browserCache.supported ? '✅' : '❌'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.browserCache.supported ? 'Supported' : 'Not supported'}
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearBrowserCache}
                disabled={loading || !stats.browserCache.supported}
                className="w-full"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cache Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supabase Cache Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supabase Cache Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.supabaseCache.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cached entries</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {stats.supabaseCache.entries.map((entry, index) => (
                  <div key={index} className="flex justify-between items-center text-sm border-b pb-1">
                    <span className="font-mono text-xs truncate flex-1">{entry.key}</span>
                    <span className="text-muted-foreground ml-2">
                      {entry.ttl > 0 ? `${entry.ttl}s left` : 'Expired'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Troubleshooting Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Troubleshooting Guide
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <strong>Public menu not loading?</strong>
                <p className="text-muted-foreground">
                  Try clearing all caches first, then check if restaurant has active subscription.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <strong>Menu data outdated?</strong>
                <p className="text-muted-foreground">
                  Clear Supabase cache to force fresh data from database.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <strong>After clearing caches:</strong>
                <p className="text-muted-foreground">
                  Refresh the public menu page to see if issues are resolved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => supabaseCache.invalidate('restaurant:')}
              disabled={loading}
            >
              Clear Restaurant Data
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => supabaseCache.invalidate('menu_items:')}
              disabled={loading}
            >
              Clear Menu Items
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => supabaseCache.invalidate('menu_groups:')}
              disabled={loading}
            >
              Clear Menu Groups
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadCacheStats}
              disabled={loading}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheClear;
