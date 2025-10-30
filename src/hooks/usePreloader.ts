import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/enhanced-query-client';

interface PreloadOptions {
  priority?: 'high' | 'low';
  delay?: number;
}

export const usePreloader = () => {
  const queryClient = useQueryClient();

  // Preload critical routes
  const preloadRoute = useCallback(async (routePath: string, options: PreloadOptions = {}) => {
    const { priority = 'low', delay = 0 } = options;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      // Dynamic import with priority
      const importPromise = (() => {
        switch (routePath) {
          case '/dashboard':
            return import('../pages/Dashboard');
          case '/menu':
            return import('../pages/PublicMenu');
          case '/settings':
            return import('../pages/RestaurantSettings');
          case '/admin':
            return import('../pages/AdminDashboard');
          default:
            return null;
        }
      })();

      if (importPromise) {
        if (priority === 'high') {
          await importPromise;
        } else {
          // Low priority - don't await
          importPromise.catch(() => {});
        }
      }
    } catch (error) {
      // Silently fail preloading
    }
  }, []);

  // Preload data based on user behavior
  const preloadData = useCallback(async (dataType: string, params: any = {}) => {
    try {
      switch (dataType) {
        case 'menu-data':
          if (params.restaurantId) {
            await Promise.all([
              queryClient.prefetchQuery({
                queryKey: queryKeys.menu.categories(params.restaurantId),
                staleTime: 5 * 60 * 1000,
              }),
              queryClient.prefetchQuery({
                queryKey: queryKeys.menu.items(params.restaurantId),
                staleTime: 5 * 60 * 1000,
              }),
            ]);
          }
          break;
        case 'restaurant-settings':
          if (params.restaurantId) {
            queryClient.prefetchQuery({
              queryKey: queryKeys.restaurants.settings(params.restaurantId),
              staleTime: 10 * 60 * 1000,
            });
          }
          break;
      }
    } catch (error) {
      // Silently fail data preloading
    }
  }, [queryClient]);

  // Intelligent preloading based on user interactions
  const setupIntelligentPreloading = useCallback(() => {
    // Preload on hover (for desktop)
    const handleMouseEnter = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          preloadRoute(href, { priority: 'low', delay: 100 });
        }
      }
    };

    // Preload on touch start (for mobile)
    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
          preloadRoute(href, { priority: 'high' });
        }
      }
    };

    // Add event listeners
    document.addEventListener('mouseenter', handleMouseEnter, { capture: true, passive: true });
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, [preloadRoute]);

  return {
    preloadRoute,
    preloadData,
    setupIntelligentPreloading,
  };
};

// Hook for intersection-based preloading
export const useIntersectionPreloader = (
  ref: React.RefObject<HTMLElement>,
  onIntersect: () => void,
  options: IntersectionObserverInit = {}
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onIntersect();
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, onIntersect, options]);
};
