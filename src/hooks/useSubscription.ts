import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPackage {
  id: string;
  name: string;
  max_restaurants: number | null;
  max_menu_items: number | null;
  feature_whatsapp_orders: boolean;
  feature_custom_branding: boolean;
  feature_analytics: boolean;
  feature_api_access: boolean;
  feature_priority_support: boolean;
  feature_multiple_restaurants: boolean;
  feature_qr_codes: boolean;
  feature_public_menu_access: boolean;
}

interface UserSubscription {
  id: string;
  package_name: string;
  status: string;
  expires_at: string | null;
  package?: SubscriptionPackage;
}

interface SubscriptionLimits {
  maxRestaurants: number;
  maxMenuItems: number;
  currentRestaurants: number;
  currentMenuItems: number;
}

interface SubscriptionFeatures {
  whatsappOrders: boolean;
  customBranding: boolean;
  analytics: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  multipleRestaurants: boolean;
  qrCodes: boolean;
  publicMenuAccess: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [features, setFeatures] = useState<SubscriptionFeatures>({
    whatsappOrders: false,
    customBranding: false,
    analytics: false,
    apiAccess: false,
    prioritySupport: false,
    multipleRestaurants: false,
    qrCodes: false,
    publicMenuAccess: false,
  });
  const [limits, setLimits] = useState<SubscriptionLimits>({
    maxRestaurants: 1, // Free tier: 1 restaurant
    maxMenuItems: 50,  // Free tier: 50 menu items
    currentRestaurants: 0,
    currentMenuItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Load active subscription
      const { data: subscriptionData, error: subError } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          package:subscription_packages!user_subscriptions_package_name_fkey(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;

      // Load current usage
      const { data: restaurants, error: restError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id);

      if (restError) throw restError;

      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id')
        .in('restaurant_id', restaurants?.map(r => r.id) || []);

      if (menuError) throw menuError;

      // Set subscription and features
      if (subscriptionData?.package) {
        setSubscription(subscriptionData);
        setFeatures({
          whatsappOrders: subscriptionData.package.feature_whatsapp_orders,
          customBranding: subscriptionData.package.feature_custom_branding,
          analytics: subscriptionData.package.feature_analytics,
          apiAccess: subscriptionData.package.feature_api_access,
          prioritySupport: subscriptionData.package.feature_priority_support,
          multipleRestaurants: subscriptionData.package.feature_multiple_restaurants,
          qrCodes: subscriptionData.package.feature_qr_codes,
          publicMenuAccess: subscriptionData.package.feature_public_menu_access,
        });
        setLimits({
          maxRestaurants: subscriptionData.package.max_restaurants || 999,
          maxMenuItems: subscriptionData.package.max_menu_items || 999,
          currentRestaurants: restaurants?.length || 0,
          currentMenuItems: menuItems?.length || 0,
        });
      } else {
        // No active subscription - free tier
        setSubscription(null);
        setFeatures({
          whatsappOrders: false,
          customBranding: false,
          analytics: false,
          apiAccess: false,
          prioritySupport: false,
          multipleRestaurants: false,
          qrCodes: true, // Basic QR codes allowed on free tier
          publicMenuAccess: true, // Basic menu access allowed
        });
        setLimits({
          maxRestaurants: 1,
          maxMenuItems: 50,
          currentRestaurants: restaurants?.length || 0,
          currentMenuItems: menuItems?.length || 0,
        });
      }

    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFeatureAccess = (feature: keyof SubscriptionFeatures): boolean => {
    return features[feature];
  };

  const checkLimitAccess = (type: 'restaurants' | 'menuItems', requestedCount: number = 1): boolean => {
    if (type === 'restaurants') {
      return limits.currentRestaurants + requestedCount <= limits.maxRestaurants;
    } else {
      return limits.currentMenuItems + requestedCount <= limits.maxMenuItems;
    }
  };

  const showUpgradePrompt = (featureName: string) => {
    toast({
      title: "Upgrade Required",
      description: `${featureName} is only available with a paid subscription. Please upgrade your plan to access this feature.`,
      variant: "destructive",
    });
  };

  const showLimitPrompt = (limitType: string, current: number, max: number) => {
    toast({
      title: "Limit Reached",
      description: `You've reached your ${limitType} limit (${current}/${max}). Please upgrade your plan to add more.`,
      variant: "destructive",
    });
  };

  const hasActiveSubscription = (): boolean => {
    return subscription !== null && subscription.status === 'active';
  };

  const getSubscriptionStatus = (): 'active' | 'expired' | 'none' => {
    if (!subscription) return 'none';
    
    if (subscription.expires_at) {
      const expiryDate = new Date(subscription.expires_at);
      const now = new Date();
      if (expiryDate < now) return 'expired';
    }
    
    return subscription.status === 'active' ? 'active' : 'none';
  };

  return {
    subscription,
    features,
    limits,
    loading,
    checkFeatureAccess,
    checkLimitAccess,
    showUpgradePrompt,
    showLimitPrompt,
    hasActiveSubscription,
    getSubscriptionStatus,
    refreshSubscription: loadSubscriptionData,
  };
};
