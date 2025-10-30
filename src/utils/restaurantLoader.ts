import { supabase } from '@/integrations/supabase/client';

interface RestaurantLoadResult {
  restaurant: any | null;
  error: Error | null;
  isLoading: boolean;
}

export class RestaurantLoader {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // Start with 1 second

  static async loadRestaurantWithRetry(userId: string): Promise<RestaurantLoadResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Add a small delay before retrying (exponential backoff)
        if (attempt > 0) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Try to fetch restaurant (handle duplicates by getting the first one)
        const { data: restaurants, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: true });

        const restaurant = restaurants && restaurants.length > 0 ? restaurants[0] : null;
        
        if (restaurants && restaurants.length > 1) {
          console.warn(`Found ${restaurants.length} duplicate restaurants for user ${userId}, using the oldest one`);
        }

        // Handle 409 conflict specifically
        if (error?.code === '409' || error?.message?.includes('conflict')) {
          console.log(`Attempt ${attempt + 1}: Conflict detected, retrying...`);
          lastError = error;
          continue;
        }

        if (error) {
          throw error;
        }

        // Success - return the restaurant
        return {
          restaurant,
          error: null,
          isLoading: false
        };

      } catch (error: any) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error;
        
        // If it's not a retryable error, break immediately
        if (error?.code && !['409', 'PGRST301', 'PGRST116'].includes(error.code)) {
          break;
        }
      }
    }

    // All retries failed
    return {
      restaurant: null,
      error: lastError,
      isLoading: false
    };
  }

  static async createRestaurantWithRetry(userId: string, userEmail: string): Promise<RestaurantLoadResult> {
    // First, check if restaurant already exists
    const existingResult = await this.loadRestaurantWithRetry(userId);
    if (existingResult.restaurant) {
      console.log('Restaurant already exists, returning existing restaurant');
      return existingResult;
    }

    const defaultSlug = `restaurant-${userId.slice(0, 8)}`;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const { data: newRestaurant, error: createError } = await supabase
          .from("restaurants")
          .insert({
            user_id: userId,
            name: "My Restaurant",
            email: userEmail || "",
            phone: "",
            whatsapp_number: "",
            slug: defaultSlug,
            brand_color: "#000000",
            font_family: "Inter",
            background_style: "solid",
            background_color: "#ffffff"
          })
          .select()
          .single();

        // If conflict, restaurant was created by another request - fetch it
        if (createError?.code === '409' || createError?.code === '23505' || createError?.message?.includes('conflict') || createError?.message?.includes('duplicate')) {
          console.log(`Create attempt ${attempt + 1}: Conflict detected, fetching existing restaurant...`);
          // Wait a bit and try to fetch the existing restaurant
          await new Promise(resolve => setTimeout(resolve, 500));
          const fetchResult = await this.loadRestaurantWithRetry(userId);
          if (fetchResult.restaurant) {
            return fetchResult;
          }
          continue;
        }

        if (createError) {
          throw createError;
        }

        return {
          restaurant: newRestaurant,
          error: null,
          isLoading: false
        };

      } catch (error: any) {
        console.error(`Create attempt ${attempt + 1} failed:`, error);
        
        // For duplicate key errors, try to fetch the existing restaurant
        if (error?.code === '23505' || error?.code === '409') {
          console.log('Duplicate detected in catch block, fetching existing...');
          const fetchResult = await this.loadRestaurantWithRetry(userId);
          if (fetchResult.restaurant) {
            return fetchResult;
          }
        } else if (error?.code && !['409', '23505'].includes(error.code)) {
          // Non-retryable error
          return {
            restaurant: null,
            error,
            isLoading: false
          };
        }
      }
    }

    // Final attempt to fetch if all creation attempts failed
    const finalFetch = await this.loadRestaurantWithRetry(userId);
    if (finalFetch.restaurant) {
      return finalFetch;
    }

    return {
      restaurant: null,
      error: new Error('Failed to create restaurant after multiple attempts'),
      isLoading: false
    };
  }
}
