import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, AlertTriangle } from 'lucide-react';

interface SubscriptionGuardProps {
  feature?: keyof ReturnType<typeof useSubscription>['features'];
  limitType?: 'restaurants' | 'menuItems';
  requestedCount?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeCard?: boolean;
}

const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  feature,
  limitType,
  requestedCount = 1,
  children,
  fallback,
  showUpgradeCard = true
}) => {
  const { 
    features, 
    limits, 
    loading, 
    checkFeatureAccess, 
    checkLimitAccess, 
    hasActiveSubscription,
    showUpgradePrompt,
    showLimitPrompt
  } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check feature access
  if (feature && !checkFeatureAccess(feature)) {
    if (fallback) return <>{fallback}</>;
    
    if (!showUpgradeCard) {
      return null;
    }

    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Lock className="h-5 w-5" />
            Premium Feature
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-orange-700 mb-4">
            This feature is only available with a paid subscription plan. Upgrade to unlock advanced functionality and grow your restaurant business.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => showUpgradePrompt(getFeatureName(feature))}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Zap className="h-4 w-4 mr-1" />
              Upgrade Now
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('/dashboard', '_self')}
            >
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check limit access
  if (limitType && !checkLimitAccess(limitType, requestedCount)) {
    if (fallback) return <>{fallback}</>;
    
    if (!showUpgradeCard) {
      return null;
    }

    const current = limitType === 'restaurants' ? limits.currentRestaurants : limits.currentMenuItems;
    const max = limitType === 'restaurants' ? limits.maxRestaurants : limits.maxMenuItems;

    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Limit Reached
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {current}/{max} {limitType}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 mb-4">
            You've reached your {limitType} limit ({current}/{max}). 
            {hasActiveSubscription() 
              ? ' Contact support to increase your limits.' 
              : ' Upgrade to a paid plan to add more.'
            }
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => showLimitPrompt(limitType, current, max)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Crown className="h-4 w-4 mr-1" />
              {hasActiveSubscription() ? 'Contact Support' : 'Upgrade Plan'}
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open('/dashboard', '_self')}
            >
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Access granted - render children
  return <>{children}</>;
};

const getFeatureName = (feature: string): string => {
  const featureNames: Record<string, string> = {
    whatsappOrders: 'WhatsApp Orders',
    customBranding: 'Custom Branding',
    analytics: 'Analytics Dashboard',
    apiAccess: 'API Access',
    prioritySupport: 'Priority Support',
    multipleRestaurants: 'Multiple Restaurants',
    qrCodes: 'QR Code Generation',
    publicMenuAccess: 'Public Menu Access',
  };
  return featureNames[feature] || 'Premium Feature';
};

export default SubscriptionGuard;
