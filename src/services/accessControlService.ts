/**
 * Access Control Service
 * Manages feature access based on subscription plans
 */

import { supabase } from '@/integrations/supabase/client';

// Define all available features in the system
export const AVAILABLE_FEATURES = {
  // Menu Management
  UNLIMITED_MENU_ITEMS: 'unlimited_menu_items',
  MENU_CATEGORIES: 'menu_categories',
  MENU_VARIATIONS: 'menu_variations',
  MENU_ACCOMPANIMENTS: 'menu_accompaniments',
  MENU_IMAGES: 'menu_images',
  
  // QR Code & Tables
  UNLIMITED_TABLES: 'unlimited_tables',
  QR_CODE_GENERATION: 'qr_code_generation',
  TABLE_MANAGEMENT: 'table_management',
  
  // Branding & Customization
  CUSTOM_BRANDING: 'custom_branding',
  CUSTOM_COLORS: 'custom_colors',
  CUSTOM_LOGO: 'custom_logo',
  REMOVE_WATERMARK: 'remove_watermark',
  
  // Orders & Notifications
  ORDER_NOTIFICATIONS: 'order_notifications',
  EMAIL_NOTIFICATIONS: 'email_notifications',
  SMS_NOTIFICATIONS: 'sms_notifications',
  WHATSAPP_INTEGRATION: 'whatsapp_integration',
  
  // Analytics & Reports
  BASIC_ANALYTICS: 'basic_analytics',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  EXPORT_REPORTS: 'export_reports',
  SALES_REPORTS: 'sales_reports',
  
  // Support & Priority
  EMAIL_SUPPORT: 'email_support',
  PRIORITY_SUPPORT: 'priority_support',
  PHONE_SUPPORT: 'phone_support',
  DEDICATED_ACCOUNT_MANAGER: 'dedicated_account_manager',
  
  // Advanced Features
  API_ACCESS: 'api_access',
  WEBHOOK_INTEGRATION: 'webhook_integration',
  MULTIPLE_LOCATIONS: 'multiple_locations',
  STAFF_MANAGEMENT: 'staff_management',
  MULTI_LANGUAGE: 'multi_language',
  CUSTOM_DOMAIN: 'custom_domain',
  
  // Payment & Billing
  ONLINE_PAYMENTS: 'online_payments',
  INVOICE_GENERATION: 'invoice_generation',
  SPLIT_BILLS: 'split_bills',
} as const;

export type FeatureKey = typeof AVAILABLE_FEATURES[keyof typeof AVAILABLE_FEATURES];

// Feature display information
export const FEATURE_INFO: Record<FeatureKey, { name: string; description: string; category: string }> = {
  // Menu Management
  [AVAILABLE_FEATURES.UNLIMITED_MENU_ITEMS]: {
    name: 'Unlimited Menu Items',
    description: 'Add unlimited items to your menu',
    category: 'Menu Management',
  },
  [AVAILABLE_FEATURES.MENU_CATEGORIES]: {
    name: 'Menu Categories',
    description: 'Organize menu into categories',
    category: 'Menu Management',
  },
  [AVAILABLE_FEATURES.MENU_VARIATIONS]: {
    name: 'Menu Variations',
    description: 'Add size variations to menu items',
    category: 'Menu Management',
  },
  [AVAILABLE_FEATURES.MENU_ACCOMPANIMENTS]: {
    name: 'Menu Accompaniments',
    description: 'Add extras and add-ons to items',
    category: 'Menu Management',
  },
  [AVAILABLE_FEATURES.MENU_IMAGES]: {
    name: 'Menu Images',
    description: 'Upload images for menu items',
    category: 'Menu Management',
  },
  
  // QR Code & Tables
  [AVAILABLE_FEATURES.UNLIMITED_TABLES]: {
    name: 'Unlimited Tables',
    description: 'Create unlimited QR code tables',
    category: 'QR Code & Tables',
  },
  [AVAILABLE_FEATURES.QR_CODE_GENERATION]: {
    name: 'QR Code Generation',
    description: 'Generate QR codes for tables',
    category: 'QR Code & Tables',
  },
  [AVAILABLE_FEATURES.TABLE_MANAGEMENT]: {
    name: 'Table Management',
    description: 'Manage table orders and status',
    category: 'QR Code & Tables',
  },
  
  // Branding & Customization
  [AVAILABLE_FEATURES.CUSTOM_BRANDING]: {
    name: 'Custom Branding',
    description: 'Full branding customization',
    category: 'Branding',
  },
  [AVAILABLE_FEATURES.CUSTOM_COLORS]: {
    name: 'Custom Colors',
    description: 'Customize menu colors',
    category: 'Branding',
  },
  [AVAILABLE_FEATURES.CUSTOM_LOGO]: {
    name: 'Custom Logo',
    description: 'Upload your restaurant logo',
    category: 'Branding',
  },
  [AVAILABLE_FEATURES.REMOVE_WATERMARK]: {
    name: 'Remove Watermark',
    description: 'Remove platform branding',
    category: 'Branding',
  },
  
  // Orders & Notifications
  [AVAILABLE_FEATURES.ORDER_NOTIFICATIONS]: {
    name: 'Order Notifications',
    description: 'Get notified of new orders',
    category: 'Orders & Notifications',
  },
  [AVAILABLE_FEATURES.EMAIL_NOTIFICATIONS]: {
    name: 'Email Notifications',
    description: 'Receive alerts via email',
    category: 'Orders & Notifications',
  },
  [AVAILABLE_FEATURES.SMS_NOTIFICATIONS]: {
    name: 'SMS Notifications',
    description: 'Receive alerts via SMS',
    category: 'Orders & Notifications',
  },
  [AVAILABLE_FEATURES.WHATSAPP_INTEGRATION]: {
    name: 'WhatsApp Integration',
    description: 'Send orders via WhatsApp',
    category: 'Orders & Notifications',
  },
  
  // Analytics & Reports
  [AVAILABLE_FEATURES.BASIC_ANALYTICS]: {
    name: 'Basic Analytics',
    description: 'View basic order statistics',
    category: 'Analytics',
  },
  [AVAILABLE_FEATURES.ADVANCED_ANALYTICS]: {
    name: 'Advanced Analytics',
    description: 'Detailed insights and trends',
    category: 'Analytics',
  },
  [AVAILABLE_FEATURES.EXPORT_REPORTS]: {
    name: 'Export Reports',
    description: 'Export data to CSV/Excel',
    category: 'Analytics',
  },
  [AVAILABLE_FEATURES.SALES_REPORTS]: {
    name: 'Sales Reports',
    description: 'Detailed sales analytics',
    category: 'Analytics',
  },
  
  // Support & Priority
  [AVAILABLE_FEATURES.EMAIL_SUPPORT]: {
    name: 'Email Support',
    description: 'Standard email support',
    category: 'Support',
  },
  [AVAILABLE_FEATURES.PRIORITY_SUPPORT]: {
    name: 'Priority Support',
    description: 'Get faster response times',
    category: 'Support',
  },
  [AVAILABLE_FEATURES.PHONE_SUPPORT]: {
    name: 'Phone Support',
    description: 'Direct phone support line',
    category: 'Support',
  },
  [AVAILABLE_FEATURES.DEDICATED_ACCOUNT_MANAGER]: {
    name: 'Dedicated Account Manager',
    description: 'Personal account representative',
    category: 'Support',
  },
  
  // Advanced Features
  [AVAILABLE_FEATURES.API_ACCESS]: {
    name: 'API Access',
    description: 'Use our REST API',
    category: 'Advanced',
  },
  [AVAILABLE_FEATURES.WEBHOOK_INTEGRATION]: {
    name: 'Webhook Integration',
    description: 'Connect with external systems',
    category: 'Advanced',
  },
  [AVAILABLE_FEATURES.MULTIPLE_LOCATIONS]: {
    name: 'Multiple Locations',
    description: 'Manage multiple restaurant branches',
    category: 'Advanced',
  },
  [AVAILABLE_FEATURES.STAFF_MANAGEMENT]: {
    name: 'Staff Management',
    description: 'Add and manage staff accounts',
    category: 'Advanced',
  },
  [AVAILABLE_FEATURES.MULTI_LANGUAGE]: {
    name: 'Multi-Language',
    description: 'Menu in multiple languages',
    category: 'Advanced',
  },
  [AVAILABLE_FEATURES.CUSTOM_DOMAIN]: {
    name: 'Custom Domain',
    description: 'Use your own domain name',
    category: 'Advanced',
  },
  
  // Payment & Billing
  [AVAILABLE_FEATURES.ONLINE_PAYMENTS]: {
    name: 'Online Payments',
    description: 'Accept online payments',
    category: 'Payments',
  },
  [AVAILABLE_FEATURES.INVOICE_GENERATION]: {
    name: 'Invoice Generation',
    description: 'Auto-generate invoices',
    category: 'Payments',
  },
  [AVAILABLE_FEATURES.SPLIT_BILLS]: {
    name: 'Split Bills',
    description: 'Allow customers to split bills',
    category: 'Payments',
  },
};

interface UserAccess {
  plan_id: string;
  plan_name: string;
  status: string;
  features: FeatureKey[];
  limits: {
    max_menu_items: number;
    max_tables: number;
    max_staff: number;
    max_locations: number;
  };
  trial_active: boolean;
  days_remaining: number;
}

/**
 * Get user's current access level and permissions
 */
export async function getUserAccess(userId?: string): Promise<UserAccess | null> {
  try {
    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return null;

    // Get user's restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, subscription_status')
      .eq('user_id', uid)
      .single();

    if (!restaurant) return null;

    // Get active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_plans(
          id,
          name,
          features,
          max_menu_items,
          max_tables
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .in('status', ['active', 'trial', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription) {
      // No active subscription - return limited access
      return {
        plan_id: 'free',
        plan_name: 'Free Trial Expired',
        status: 'inactive',
        features: [],
        limits: {
          max_menu_items: 5,
          max_tables: 2,
          max_staff: 1,
          max_locations: 1,
        },
        trial_active: false,
        days_remaining: 0,
      };
    }

    const plan = subscription.subscription_plans as any;
    const isTrial = subscription.status === 'trial' || subscription.status === 'trialing';
    const endDate = isTrial ? subscription.trial_end : subscription.current_period_end;
    const daysRemaining = endDate 
      ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      plan_id: plan.id,
      plan_name: plan.name,
      status: subscription.status,
      features: plan.features || [],
      limits: {
        max_menu_items: plan.max_menu_items || -1,
        max_tables: plan.max_tables || -1,
        max_staff: 5, // Default
        max_locations: 1, // Default
      },
      trial_active: isTrial,
      days_remaining: daysRemaining,
    };
  } catch (error) {
    console.error('Failed to get user access:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(feature: FeatureKey, userId?: string): Promise<boolean> {
  const access = await getUserAccess(userId);
  if (!access) return false;
  
  return access.features.includes(feature);
}

/**
 * Check if user can perform an action based on limits
 */
export async function canPerformAction(
  action: 'add_menu_item' | 'add_table' | 'add_staff' | 'add_location',
  userId?: string
): Promise<{ allowed: boolean; reason?: string; current?: number; limit?: number }> {
  try {
    const access = await getUserAccess(userId);
    if (!access) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return { allowed: false, reason: 'Not authenticated' };

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', uid)
      .single();

    if (!restaurant) return { allowed: false, reason: 'Restaurant not found' };

    switch (action) {
      case 'add_menu_item': {
        if (access.limits.max_menu_items === -1) {
          return { allowed: true }; // Unlimited
        }
        
        const { count } = await supabase
          .from('menu_items')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);

        const current = count || 0;
        if (current >= access.limits.max_menu_items) {
          return {
            allowed: false,
            reason: `Menu item limit reached. Upgrade to add more items.`,
            current,
            limit: access.limits.max_menu_items,
          };
        }
        return { allowed: true, current, limit: access.limits.max_menu_items };
      }

      case 'add_table': {
        if (access.limits.max_tables === -1) {
          return { allowed: true }; // Unlimited
        }
        
        const { count } = await (supabase as any)
          .from('qr_codes')
          .select('id', { count: 'exact', head: true })
          .eq('restaurant_id', restaurant.id);

        const current = count || 0;
        if (current >= access.limits.max_tables) {
          return {
            allowed: false,
            reason: `Table limit reached. Upgrade to add more tables.`,
            current,
            limit: access.limits.max_tables,
          };
        }
        return { allowed: true, current, limit: access.limits.max_tables };
      }

      case 'add_staff':
      case 'add_location':
        // Implement when these features are added
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Unknown action' };
    }
  } catch (error) {
    console.error('Failed to check action permission:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}

/**
 * Get usage statistics for current plan
 */
export async function getUsageStats(userId?: string): Promise<{
  menu_items: { current: number; limit: number };
  tables: { current: number; limit: number };
} | null> {
  try {
    const access = await getUserAccess(userId);
    if (!access) return null;

    const uid = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return null;

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', uid)
      .single();

    if (!restaurant) return null;

    const [menuItemsCount, tablesCount] = await Promise.all([
      supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id),
      (supabase as any)
        .from('qr_codes')
        .select('id', { count: 'exact', head: true })
        .eq('restaurant_id', restaurant.id),
    ]);

    return {
      menu_items: {
        current: menuItemsCount.count || 0,
        limit: access.limits.max_menu_items,
      },
      tables: {
        current: tablesCount.count || 0,
        limit: access.limits.max_tables,
      },
    };
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return null;
  }
}

/**
 * Block access to a feature with upgrade prompt
 */
export function getUpgradeMessage(feature: FeatureKey): string {
  const info = FEATURE_INFO[feature];
  return `${info.name} is not available in your current plan. Upgrade to unlock this feature!`;
}

/**
 * Get all features grouped by category
 */
export function getFeaturesByCategory(): Record<string, Array<{ key: FeatureKey; info: typeof FEATURE_INFO[FeatureKey] }>> {
  const grouped: Record<string, Array<{ key: FeatureKey; info: typeof FEATURE_INFO[FeatureKey] }>> = {};
  
  Object.entries(FEATURE_INFO).forEach(([key, info]) => {
    if (!grouped[info.category]) {
      grouped[info.category] = [];
    }
    grouped[info.category].push({
      key: key as FeatureKey,
      info,
    });
  });
  
  return grouped;
}

export default {
  getUserAccess,
  hasFeatureAccess,
  canPerformAction,
  getUsageStats,
  getUpgradeMessage,
  getFeaturesByCategory,
  AVAILABLE_FEATURES,
  FEATURE_INFO,
};
