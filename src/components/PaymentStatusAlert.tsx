import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  Zap,
  ExternalLink,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PaymentStatusAlertProps {
  accessInfo: any;
  restaurant: any;
  onPaymentClick?: () => void;
}

export const PaymentStatusAlert: React.FC<PaymentStatusAlertProps> = ({
  accessInfo,
  restaurant,
  onPaymentClick
}) => {
  if (!accessInfo || accessInfo.hasAccess) {
    return null; // Don't show alert if user has access
  }

  const getAlertVariant = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
      case 'past_due':
        return 'destructive';
      case 'trial_expired':
        return 'destructive';
      case 'trial':
        return 'default';
      case 'no_subscription':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
        return <CreditCard className="h-5 w-5" />;
      case 'past_due':
        return <AlertTriangle className="h-5 w-5" />;
      case 'trial_expired':
        return <Clock className="h-5 w-5" />;
      case 'trial':
        return <Zap className="h-5 w-5" />;
      case 'canceled':
        return <XCircle className="h-5 w-5" />;
      case 'no_subscription':
        return <Zap className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getStatusColor = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
        return 'bg-orange-500';
      case 'past_due':
        return 'bg-red-500';
      case 'trial_expired':
        return 'bg-red-500';
      case 'trial':
        return 'bg-blue-500';
      case 'canceled':
        return 'bg-gray-500';
      case 'no_subscription':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getButtonText = () => {
    switch (accessInfo.paymentAction) {
      case 'complete_payment':
        return 'Complete Payment Now';
      case 'retry_payment':
        return 'Retry Payment';
      case 'upgrade':
        return 'Upgrade to Paid Plan';
      case 'reactivate':
        return 'Reactivate Subscription';
      case 'subscribe':
      default:
        return 'Subscribe Now';
    }
  };

  const handlePaymentClick = () => {
    const paymentUrl = `${window.location.origin}/pricing?restaurant_id=${restaurant.id}&action=${accessInfo.paymentAction}`;
    
    if (onPaymentClick) {
      onPaymentClick();
    } else {
      window.open(paymentUrl, '_blank');
    }
  };

  const getUrgencyMessage = () => {
    switch (accessInfo.status) {
      case 'pending_payment':
        return 'Your payment is pending confirmation. Complete your payment to access all features.';
      case 'past_due':
        return 'Your payment is overdue. Please update your payment method immediately to avoid service interruption.';
      case 'trial_expired':
        return 'Your free trial has ended. Subscribe now to continue using MenuForest.';
      case 'trial':
        return `You have ${accessInfo.daysRemaining || 0} days remaining in your free trial.`;
      case 'canceled':
        return 'Your subscription has been canceled. Reactivate to continue using MenuForest.';
      case 'no_subscription':
        return 'Subscribe to MenuForest to unlock all features and start accepting orders.';
      default:
        return 'Please complete your subscription setup to access all features.';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Status Alert */}
      <Alert variant={getAlertVariant()} className="border-2">
        {getIcon()}
        <AlertTitle className="flex items-center gap-2">
          <Badge className={`${getStatusColor()} text-white px-2 py-1 text-xs`}>
            {accessInfo.status.replace('_', ' ').toUpperCase()}
          </Badge>
          Payment Action Required
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <p className="text-sm">
            {getUrgencyMessage()}
          </p>
          
          {/* Trial Progress Bar */}
          {accessInfo.status === 'trial' && accessInfo.daysRemaining !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Trial Progress</span>
                <span>{Math.max(0, 14 - accessInfo.daysRemaining)}/14 days used</span>
              </div>
              <Progress 
                value={(Math.max(0, 14 - accessInfo.daysRemaining) / 14) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Action Button */}
          {accessInfo.showPaymentButton && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handlePaymentClick}
                className={`flex-1 ${accessInfo.urgent ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {getButtonText()}
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
              
              {accessInfo.status === 'trial' && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/subscription', '_blank')}
                  className="flex-1 sm:flex-none"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>
          )}

          {/* Additional Information */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>Manual payments only: Bank transfer or Mobile Money</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span>After payment, upload proof or contact admin to activate your subscription</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Feature Restrictions Notice */}
      {!accessInfo.hasAccess && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Limited Access</AlertTitle>
          <AlertDescription className="text-yellow-700 text-sm">
            Some features may be restricted until payment is completed. Your public menu is currently unavailable to customers.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentStatusAlert;
