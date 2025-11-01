import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRestaurant = () => {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurantId();
  }, []);

  const loadRestaurantId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Try to get existing restaurant with retry logic for conflicts
      let restaurant = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries && !restaurant) {
        // Fetch all restaurants and take the first one (handles duplicates)
        const { data, error } = await supabase
          .from("restaurants")
          .select("id")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error && error.code !== '409') {
          throw error;
        }

        // Take the first restaurant if any exist
        if (data && data.length > 0) {
          restaurant = data[0];
          // Silently handle duplicates - using oldest entry by created_at
          break;
        }

        // If no restaurant found and this is the first attempt, try to create one
        if (!data && retryCount === 0) {
          const defaultSlug = `restaurant-${user.id.slice(0, 8)}`;
          const { data: newRestaurant, error: createError } = await supabase
            .from("restaurants")
            .insert({
              user_id: user.id,
              name: "My Restaurant",
              email: user.email || "",
              phone: "",
              whatsapp_number: "",
              slug: defaultSlug,
              brand_color: "#000000",
              font_family: "Inter",
              background_style: "solid",
              background_color: "#ffffff"
            })
            .select("id")
            .single();

          // If creation resulted in conflict (409), restaurant was created by another request
          // Retry fetching in next iteration
          if (createError && (createError.code === '409' || createError.code === '23505')) {
            console.log('Restaurant creation conflict detected, retrying fetch...');
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
            continue;
          }

          if (createError) {
            throw createError;
          }

          restaurant = newRestaurant;
        } else {
          // Wait before retrying
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
        }
      }

      if (!restaurant) {
        throw new Error('Failed to load or create restaurant after multiple attempts');
      }

      setRestaurantId(restaurant.id);
    } catch (error: any) {
      console.error('Restaurant load error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load restaurant data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return { restaurantId, loading };
};
