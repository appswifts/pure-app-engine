import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Crown, Zap, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionProtectedRouteProps {
  feature?: keyof ReturnType<typeof useSubscription>['features'];
  limitType?: 'restaurants' | 'menuItems';
  requestedCount?: number;
  children: React.ReactNode;
  redirectTo?: string;
}

const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({
  feature,
  limitType,
  requestedCount = 1,
  children,
  redirectTo = '/dashboard'
}) => {
  const navigate = useNavigate();
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Check feature access
  if (feature && !checkFeatureAccess(feature)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-200 bg-orange-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-orange-800">
              Premium Feature Required
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 mx-auto">
              <Crown className="h-3 w-3 mr-1" />
              Upgrade Required
            </Badge>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-orange-700">
              <strong>{getFeatureName(feature)}</strong> is only available with a paid subscription plan. 
              Upgrade to unlock this feature and grow your restaurant business.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/dashboard')}
              >
                <Zap className="h-4 w-4 mr-2" />
                View Subscription Plans
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(redirectTo)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check limit access
  if (limitType && !checkLimitAccess(limitType, requestedCount)) {
    const current = limitType === 'restaurants' ? limits.currentRestaurants : limits.currentMenuItems;
    const max = limitType === 'restaurants' ? limits.maxRestaurants : limits.maxMenuItems;

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">
              Limit Reached
            </CardTitle>
            <Badge variant="secondary" className="bg-red-100 text-red-800 mx-auto">
              {current}/{max} {limitType}
            </Badge>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-red-700">
              You've reached your {limitType} limit ({current}/{max}). 
              {hasActiveSubscription() 
                ? ' Contact support to increase your limits.' 
                : ' Upgrade to a paid plan to add more.'
              }
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/dashboard')}
              >
                <Crown className="h-4 w-4 mr-2" />
                {hasActiveSubscription() ? 'Contact Support' : 'Upgrade Plan'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(redirectTo)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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

export default SubscriptionProtectedRoute;
