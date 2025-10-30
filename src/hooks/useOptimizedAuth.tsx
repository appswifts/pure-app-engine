import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Optimized auth hook with caching and reduced redundant calls
export const useOptimizedAuth = () => {
  const { user, session, loading } = useAuth();
  const queryClient = useQueryClient();

  // Cache admin status with 5 minute stale time
  const { data: isAdmin, isLoading: isAdminLoading } = useQuery({
    queryKey: ['admin_status', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc('is_admin', { 
        _user_id: user.id 
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Cache restaurant data
  const { data: restaurant, isLoading: isRestaurantLoading } = useQuery({
    queryKey: ['restaurant', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          id, name, email, phone, whatsapp_number, 
          subscription_status, subscription_id, trial_end_date,
          package_id, subscription_start_date, subscription_end_date,
          last_payment_date, slug, brand_color, font_family,
          background_style, background_color, logo_url
        `)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Prefetch related data when user logs in
  const prefetchData = () => {
    if (user?.id && isAdmin) {
      // Prefetch admin data
      queryClient.prefetchQuery({
        queryKey: ['admin_restaurants'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('restaurants')
            .select('id, email, name, created_at, subscription_status')
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (error) throw error;
          return data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute
      });

      queryClient.prefetchQuery({
        queryKey: ['admin_user_roles'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          return data;
        },
        staleTime: 1 * 60 * 1000,
      });
    }
  };

  return {
    user,
    session,
    loading: loading || isAdminLoading || isRestaurantLoading,
    isAdmin: isAdmin || false,
    restaurant,
    prefetchData,
    // Quick cache invalidation methods
    invalidateAuth: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_status'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant'] });
    }
  };
};