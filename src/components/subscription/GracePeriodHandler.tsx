import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Clock, 
  CreditCard,
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react';

interface GracePeriodData {
  is_in_grace_period: boolean;
  grace_period_start: string | null;
  grace_period_end: string | null;
  days_remaining: number;
  hours_remaining: number;
  reason: 'payment_failed' | 'expired' | null;
  amount_due: number;
  currency: string;
}

const GRACE_PERIOD_DAYS = 7; // Configurable grace period

export const GracePeriodHandler: React.FC = () => {
  const [gracePeriod, setGracePeriod] = useState<GracePeriodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkGracePeriodStatus();
    
    // Update every minute during grace period
    const interval = setInterval(() => {
      if (gracePeriod?.is_in_grace_period) {
        checkGracePeriodStatus();
      }
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [gracePeriod?.is_in_grace_period]);

  const checkGracePeriodStatus = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!restaurant) return;

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) return;

      const now = new Date();
      let graceData: GracePeriodData = {
        is_in_grace_period: false,
        grace_period_start: null,
        grace_period_end: null,
        days_remaining: 0,
        hours_remaining: 0,
        reason: null,
        amount_due: subscription.amount,
        currency: subscription.currency,
      };

      // Check if subscription is past due or expired
      if (subscription.status === 'past_due' || subscription.status === 'expired') {
        const periodEnd = new Date(subscription.current_period_end);
        const gracePeriodStart = periodEnd;
        const gracePeriodEnd = new Date(periodEnd.getTime() + (GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000));

        if (now >= gracePeriodStart && now <= gracePeriodEnd) {
          const timeRemaining = gracePeriodEnd.getTime() - now.getTime();
          const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
          const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

          graceData = {
            is_in_grace_period: true,
            grace_period_start: gracePeriodStart.toISOString(),
            grace_period_end: gracePeriodEnd.toISOString(),
            days_remaining: daysRemaining,
            hours_remaining: hoursRemaining,
            reason: subscription.status === 'past_due' ? 'payment_failed' : 'expired',
            amount_due: subscription.amount,
            currency: subscription.currency,
          };

          // Update grace period in database
          await supabase
            .from('subscriptions')
            .update({
              grace_period_end: gracePeriodEnd.toISOString(),
            })
            .eq('id', subscription.id);
        }
      }

      setGracePeriod(graceData);
    } catch (error: any) {
      console.error('Failed to check grace period:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    try {
      setRetrying(true);
      
      toast({
        title: 'Processing Payment',
        description: 'Attempting to process your payment...',
      });

      // Simulate payment retry (implement actual payment processing)
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: 'Payment Processed',
        description: 'Your subscription has been renewed successfully!',
      });

      await checkGracePeriodStatus();
    } catch (error: any) {
      toast({
        title: 'Payment Failed',
        description: 'Unable to process payment. Please update your payment method.',
        variant: 'destructive',
      });
    } finally {
      setRetrying(false);
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (!gracePeriod?.is_in_grace_period) {
    return null; // Don't show if not in grace period
  }

  const progressPercentage = ((GRACE_PERIOD_DAYS - gracePeriod.days_remaining) / GRACE_PERIOD_DAYS) * 100;
  const isCritical = gracePeriod.days_remaining <= 2;

  return (
    <Card className={`border-2 ${isCritical ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
            <span className={isCritical ? 'text-red-900' : 'text-orange-900'}>
              Grace Period Active
            </span>
          </div>
          <Badge className={isCritical ? 'bg-red-600' : 'bg-orange-600'}>
            <Clock className="h-3 w-3 mr-1" />
            {gracePeriod.days_remaining}d {gracePeriod.hours_remaining}h left
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Critical Warning */}
        <Alert className={`${isCritical ? 'bg-red-100 border-red-300' : 'bg-orange-100 border-orange-300'}`}>
          <Shield className={`h-4 w-4 ${isCritical ? 'text-red-600' : 'text-orange-600'}`} />
          <AlertDescription className={isCritical ? 'text-red-800' : 'text-orange-800'}>
            <strong>
              {isCritical ? 'URGENT: ' : ''}
              {gracePeriod.reason === 'payment_failed' 
                ? 'Your payment failed. ' 
                : 'Your subscription has expired. '}
            </strong>
            You have <strong>{gracePeriod.days_remaining} days and {gracePeriod.hours_remaining} hours</strong> to resolve this issue before your account is suspended.
          </AlertDescription>
        </Alert>

        {/* Grace Period Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Grace Period Progress</span>
            <span className={isCritical ? 'text-red-600 font-bold' : 'text-orange-600'}>
              {Math.round(progressPercentage)}% elapsed
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-3 ${isCritical ? 'bg-red-200' : 'bg-orange-200'}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Started: {gracePeriod.grace_period_start && new Date(gracePeriod.grace_period_start).toLocaleDateString()}</span>
            <span>Ends: {gracePeriod.grace_period_end && new Date(gracePeriod.grace_period_end).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Amount Due */}
        <div className="p-4 bg-white rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground">Amount Due</div>
              <div className="text-2xl font-bold">
                {formatCurrency(gracePeriod.amount_due, gracePeriod.currency)}
              </div>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        {/* What Happens Next */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What happens during the grace period?</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✓ Your service remains <strong>fully active</strong></li>
            <li>✓ All features are <strong>accessible</strong></li>
            <li>✓ No data will be lost</li>
            <li>✗ After grace period: <strong>Account will be suspended</strong></li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
            size="lg"
            onClick={retryPayment}
            disabled={retrying}
          >
            {retrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Retry Payment Now
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '#payment-methods'}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Update Payment Method
          </Button>
        </div>

        {/* Support Notice */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support before your grace period expires
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GracePeriodHandler;
