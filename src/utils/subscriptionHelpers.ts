import { supabase } from '@/integrations/supabase/client';

/**
 * Updates all restaurants to be active when a user has an active subscription
 * @param userId The user ID to update restaurants for
 * @returns Promise with operation result and error if any
 */
export const activateRestaurantMenus = async (userId: string) => {
  try {
    // Update all restaurants for this user to is_menu_active = true
    const { data, error } = await (supabase as any)
      .from('restaurants')
      .update({ is_menu_active: true })
      .eq('user_id', userId)
      .select('id, name');

    if (error) {
      console.error('Error activating restaurant menus:', error);
      return { success: false, error, data: null };
    }

    console.log(`✅ Activated ${data?.length || 0} restaurant menus for user ${userId}`);
    return { success: true, error: null, data };
  } catch (error: any) {
    console.error('Exception when activating restaurant menus:', error);
    return { success: false, error, data: null };
  }
};

/**
 * Updates subscription status and activates restaurant menus if status is active
 * @param subscriptionId The subscription ID to update
 * @param newStatus The new status to set
 * @param userId The user ID associated with the subscription
 * @returns Promise with operation result
 */
export const updateSubscriptionAndActivateMenus = async (
  subscriptionId: string, 
  newStatus: 'active' | 'pending' | 'expired' | 'cancelled',
  userId: string
) => {
  try {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // If approving, set started_at to now
    if (newStatus === 'active') {
      updateData.started_at = new Date().toISOString();
      updateData.notes = 'Subscription activated';
    } else if (newStatus === 'cancelled') {
      updateData.notes = 'Subscription cancelled';
    }

    // Update the subscription status
    const { error } = await (supabase as any)
      .from('user_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId);

    if (error) {
      return { success: false, error };
    }
    
    // If activating, also activate all restaurant menus
    if (newStatus === 'active') {
      const result = await activateRestaurantMenus(userId);
      return { 
        success: result.success, 
        error: result.error,
        message: `Subscription ${newStatus} and ${result.success ? 'menus activated' : 'menu activation failed'}` 
      };
    }

    return { 
      success: true, 
      error: null,
      message: `Subscription ${newStatus} successfully` 
    };
  } catch (error: any) {
    console.error('Error updating subscription and menus:', error);
    return { 
      success: false, 
      error,
      message: error.message || `Failed to update subscription` 
    };
  }
};
