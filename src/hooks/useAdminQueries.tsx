import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Optimized admin queries with proper caching
export const useAdminQueries = () => {
  // Restaurants query with optimized selection
  const restaurantsQuery = useQuery({
    queryKey: ['admin_restaurants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, email, name, created_at, subscription_status,
          subscription_start_date, subscription_end_date, 
          trial_end_date, plan, currency
        `)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // User roles query
  const userRolesQuery = useQuery({
    queryKey: ['admin_user_roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at')
        .order('created_at', { ascending: false })
        .limit(100); // Limit to reduce payload
      
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Subscription packages query
  const subscriptionPackagesQuery = useQuery({
    queryKey: ['subscription_packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - packages don't change often
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Combined loading state
  const isLoading = restaurantsQuery.isLoading || 
                   userRolesQuery.isLoading || 
                   subscriptionPackagesQuery.isLoading;

  const isError = restaurantsQuery.error || 
                 userRolesQuery.error || 
                 subscriptionPackagesQuery.error;

  return {
    restaurants: restaurantsQuery.data || [],
    userRoles: userRolesQuery.data || [],
    subscriptionPackages: subscriptionPackagesQuery.data || [],
    isLoading,
    isError,
    refetch: () => {
      restaurantsQuery.refetch();
      userRolesQuery.refetch();
      subscriptionPackagesQuery.refetch();
    }
  };
};