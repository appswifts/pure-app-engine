import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Clock,
  AlertTriangle,
  Package,
  Zap,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

interface RestrictedMenuViewProps {
  restaurant: any;
  accessInfo: any;
}

export const RestrictedMenuView: React.FC<RestrictedMenuViewProps> = ({ 
  restaurant, 
  accessInfo 
}) => {
  const getStatusIcon = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
        return <CreditCard className="h-6 w-6 text-orange-500" />;
      case 'trial_expired':
      case 'expired':
        return <Clock className="h-6 w-6 text-red-500" />;
      case 'past_due':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'plan_limitation':
        return <Package className="h-6 w-6 text-purple-500" />;
      case 'canceled':
        return <Package className="h-6 w-6 text-gray-500" />;
      case 'no_subscription':
        return <Zap className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
        return 'bg-orange-500';
      case 'trial_expired':
      case 'expired':
      case 'past_due':
        return 'bg-red-500';
      case 'plan_limitation':
        return 'bg-purple-500';
      case 'canceled':
        return 'bg-gray-500';
      case 'no_subscription':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentButtonText = () => {
    switch (accessInfo.paymentAction) {
      case 'complete_payment':
        return 'Complete Payment';
      case 'retry_payment':
        return 'Retry Payment';
      case 'upgrade':
        return 'Upgrade Now';
      case 'reactivate':
        return 'Reactivate Subscription';
      case 'subscribe':
      default:
        return 'Subscribe Now';
    }
  };

  const handlePaymentClick = () => {
    const paymentUrl = `${window.location.origin}/pricing?restaurant_id=${restaurant.id}&action=${accessInfo.paymentAction}`;
    window.open(paymentUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Restaurant Logo and Name */}
        <div className="text-center space-y-4">
          {restaurant.logo_url ? (
            <div className="flex justify-center">
              <img 
                src={restaurant.logo_url} 
                alt={`${restaurant.name} logo`}
                className="h-24 w-24 object-contain rounded-lg shadow-md bg-white p-2"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-md flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {restaurant.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-gray-900">
            {restaurant.name}
          </h1>
          
          <Badge className={`${getStatusColor()} text-white px-4 py-2 text-sm`}>
            {getStatusIcon()}
            <span className="ml-2">{accessInfo.message}</span>
          </Badge>
        </div>

        {/* Access Restriction Notice */}
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Package className="h-6 w-6 text-gray-600" />
              Digital Menu Access Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className={`border-2 ${accessInfo.urgent ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Menu Access Restricted</AlertTitle>
              <AlertDescription className="text-sm">
                {accessInfo.reason || 'This menu requires an active subscription'}. 
                {accessInfo.paymentAction === 'complete_payment' ? 
                  'Complete your subscription payment to view the full digital menu.' : 
                  accessInfo.paymentAction === 'reactivate' ? 
                    'Reactivate your subscription to view the full digital menu.' :
                    accessInfo.paymentAction === 'upgrade' ?
                      'Upgrade your subscription plan to include public menu access.' :
                      'Subscribe now to view the full digital menu.'
                }
              </AlertDescription>
            </Alert>

            {/* Payment Action Button */}
            {accessInfo.showPaymentButton && (
              <div className="text-center space-y-3">
                <Button 
                  onClick={handlePaymentClick}
                  size="lg"
                  className={`w-full ${accessInfo.urgent ? 'bg-orange-600 hover:bg-orange-700' : 
                    accessInfo.status === 'plan_limitation' ? 'bg-purple-600 hover:bg-purple-700' :
                    accessInfo.status === 'expired' || accessInfo.status === 'trial_expired' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  {getPaymentButtonText()}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                
                <p className="text-sm text-gray-600">
                  Manual payments only: Bank Transfer or Mobile Money. Upload proof or contact admin for activation.
                </p>
              </div>
            )}

            {/* Features Preview */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 text-center">
                What you'll get with a subscription:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Full digital menu access</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>QR code menu sharing</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Order management system</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Customer analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Menu customization</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>

            {/* Trial Information */}
            {accessInfo.status === 'trial' && accessInfo.daysRemaining && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4" />
                <AlertTitle>Free Trial Active</AlertTitle>
                <AlertDescription>
                  You have {accessInfo.daysRemaining} days remaining in your free trial.
                  Upgrade now to continue uninterrupted access.
                </AlertDescription>
              </Alert>
            )}

            {/* Contact Information */}
            <div className="text-center text-sm text-gray-500 border-t pt-4">
              <p>Need help? Contact MenuForest support</p>
              <p className="font-medium">support@menuforest.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400">
          <p>Powered by MenuForest - Digital Menu Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default RestrictedMenuView;
