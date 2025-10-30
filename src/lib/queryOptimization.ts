import { useState, useCallback } from 'react';
import { QueryClient } from '@tanstack/react-query';

// Enhanced query client with optimized defaults
export const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache queries for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep queries in cache for 10 minutes  
      gcTime: 10 * 60 * 1000,
      // Don't refetch on window focus by default
      refetchOnWindowFocus: false,
      // Don't refetch on reconnect unless stale
      refetchOnReconnect: 'always',
      // Retry failed queries 1 time instead of 3
      retry: 1,
      // Use background refetching
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Background query prefetcher
export const useQueryPrefetcher = () => {
  const [prefetchQueue, setPrefetchQueue] = useState<string[]>([]);

  const addToPrefetchQueue = useCallback((queryKey: string) => {
    setPrefetchQueue(prev => {
      if (!prev.includes(queryKey)) {
        return [...prev, queryKey];
      }
      return prev;
    });
  }, []);

  const clearPrefetchQueue = useCallback(() => {
    setPrefetchQueue([]);
  }, []);

  return {
    prefetchQueue,
    addToPrefetchQueue,
    clearPrefetchQueue,
  };
};

// Query invalidation utilities
export const createQueryInvalidator = (queryClient: QueryClient) => ({
  invalidateAuth: () => {
    queryClient.invalidateQueries({ queryKey: ['admin_status'] });
    queryClient.invalidateQueries({ queryKey: ['restaurant'] });
  },
  
  invalidateAdminData: () => {
    queryClient.invalidateQueries({ queryKey: ['admin_restaurants'] });
    queryClient.invalidateQueries({ queryKey: ['admin_user_roles'] });
    queryClient.invalidateQueries({ queryKey: ['subscription_packages'] });
  },
  
  invalidateRestaurantData: (restaurantId: string) => {
    queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['menu_items', restaurantId] });
    queryClient.invalidateQueries({ queryKey: ['categories', restaurantId] });
  },
  
  prefetchAdminData: () => {
    queryClient.prefetchQuery({
      queryKey: ['admin_restaurants'],
      staleTime: 1 * 60 * 1000,
    });
  },
});
