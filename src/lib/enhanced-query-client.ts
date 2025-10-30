import { QueryClient, DefaultOptions } from '@tanstack/react-query';

// Enhanced query client with advanced caching strategies
export const createEnhancedQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Aggressive caching for better performance
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Network mode for offline support
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 1,
        networkMode: 'offlineFirst',
      },
    },
  });

  // Simple localStorage persistence without external dependencies
  const persistCache = () => {
    if (typeof window !== 'undefined') {
      try {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        const serializedQueries = queries.map(query => ({
          queryKey: query.queryKey,
          state: query.state,
        }));
        localStorage.setItem('menuforest-cache', JSON.stringify(serializedQueries));
      } catch (error) {
      }
    }
  };

  // Restore cache from localStorage
  const restoreCache = () => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('menuforest-cache');
        if (cached) {
          const queries = JSON.parse(cached);
          queries.forEach((query: any) => {
            if (query.state.data) {
              queryClient.setQueryData(query.queryKey, query.state.data);
            }
          });
        }
      } catch (error) {
      }
    }
  };

  // Auto-persist on query success
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.query.state.status === 'success') {
      persistCache();
    }
  });

  // Restore cache on initialization
  restoreCache();

  // Prefetch critical data
  queryClient.prefetchQuery({
    queryKey: ['restaurant-settings'],
    queryFn: () => null, // Will be replaced by actual query
    staleTime: 10 * 60 * 1000,
  });

  return queryClient;
};

// Query key factory for consistent cache management
export const queryKeys = {
  restaurants: {
    all: ['restaurants'] as const,
    byId: (id: string) => [...queryKeys.restaurants.all, id] as const,
    bySlug: (slug: string) => [...queryKeys.restaurants.all, 'slug', slug] as const,
    settings: (id: string) => [...queryKeys.restaurants.byId(id), 'settings'] as const,
  },
  menu: {
    all: ['menu'] as const,
    categories: (restaurantId: string) => [...queryKeys.menu.all, 'categories', restaurantId] as const,
    items: (restaurantId: string) => [...queryKeys.menu.all, 'items', restaurantId] as const,
    variations: (itemId: string) => [...queryKeys.menu.all, 'variations', itemId] as const,
    accompaniments: (itemId: string) => [...queryKeys.menu.all, 'accompaniments', itemId] as const,
  },
  tables: {
    all: ['tables'] as const,
    byRestaurant: (restaurantId: string) => [...queryKeys.tables.all, restaurantId] as const,
  },
} as const;

// Cache invalidation utilities
export const cacheUtils = {
  invalidateRestaurant: (queryClient: QueryClient, restaurantId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.byId(restaurantId) });
  },
  invalidateMenu: (queryClient: QueryClient, restaurantId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.categories(restaurantId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.menu.items(restaurantId) });
  },
  prefetchMenuData: async (queryClient: QueryClient, restaurantId: string) => {
    // Prefetch related data for better UX
    await Promise.all([
      queryClient.prefetchQuery({ queryKey: queryKeys.menu.categories(restaurantId) }),
      queryClient.prefetchQuery({ queryKey: queryKeys.menu.items(restaurantId) }),
    ]);
  },
};
