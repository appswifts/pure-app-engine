import { supabase } from '@/integrations/supabase/client';

/**
 * Simple payment access control that always allows public menu access
 * This removes complex subscription logic and focuses on basic functionality
 */
export class SimplePaymentAccessControl {
  /**
   * Check restaurant access by slug - always allows access for public menu
   */
  async checkRestaurantAccessBySlug(slug: string) {
    try {

      // Get restaurant by slug
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        throw error;
      }

      if (!restaurant) {
        return {
          hasAccess: false,
          restaurant: null,
          reason: 'Restaurant not found'
        };
      }

      
      // Check payment status - deny access if restaurant is blocked or unpaid
      const isPaidUp = await this.checkPaymentStatus(restaurant);
      
      if (!isPaidUp) {
        return {
          hasAccess: false,
          restaurant,
          status: 'payment_required',
          reason: 'Payment required to access menu'
        };
      }

      return {
        hasAccess: true,
        restaurant,
        status: 'paid_access',
        reason: 'Menu access granted'
      };
    } catch (error) {
      return {
        hasAccess: false,
        restaurant: null,
        reason: 'Access check failed'
      };
    }
  }

  /**
   * Check restaurant access by ID - always allows access
   */
  async checkRestaurantAccess(restaurantId: string) {
    try {

      // Get restaurant by ID
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) {
        throw error;
      }

      if (!restaurant) {
        return {
          hasAccess: false,
          restaurant: null,
          reason: 'Restaurant not found'
        };
      }

      
      // Check payment status - deny access if restaurant is blocked or unpaid
      const isPaidUp = await this.checkPaymentStatus(restaurant);
      
      if (!isPaidUp) {
        return {
          hasAccess: false,
          restaurant,
          status: 'payment_required',
          reason: 'Payment required to access restaurant'
        };
      }

      return {
        hasAccess: true,
        restaurant,
        status: 'paid_access',
        reason: 'Access granted'
      };
    } catch (error) {
      return {
        hasAccess: false,
        restaurant: null,
        reason: 'Access check failed'
      };
    }
  }

  /**
   * Check if restaurant has paid up or is within trial period
   */
  async checkPaymentStatus(restaurant: any): Promise<boolean> {
    try {
      // If restaurant status is active, allow access
      if (restaurant.subscription_status === 'active') {
        return true;
      }

      // Check if restaurant has an active subscription
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['active', 'trial'])
        .single();

      if (!error && subscription) {
        // Check if subscription is not expired
        if (subscription.status === 'active') {
          return subscription.current_period_end ? new Date(subscription.current_period_end) > new Date() : true;
        }
        if (subscription.status === 'trial') {
          return subscription.trial_end ? new Date(subscription.trial_end) > new Date() : true;
        }
      }

      // Check if there are any approved payment requests
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'approved')
        .gte('billing_period_end', new Date().toISOString())
        .order('billing_period_end', { ascending: false })
        .limit(1);

      if (!paymentsError && payments && payments.length > 0) {
        return true;
      }

      // Block access only if subscription status is explicitly 'inactive' or 'expired'
      if (restaurant.subscription_status === 'inactive' || restaurant.subscription_status === 'expired') {
        return false;
      }

      // For other statuses or undefined, allow access (backward compatibility)
      return true;
    } catch (error) {
      // In case of error, allow access to prevent service disruption
      return true;
    }
  }
}

// Export singleton instance
export const simplePaymentAccessControl = new SimplePaymentAccessControl();
export default simplePaymentAccessControl;