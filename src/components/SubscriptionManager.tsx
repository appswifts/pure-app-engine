import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StripeCheckoutButton from './StripeCheckoutButton';
import { 
  CreditCard, 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Calendar,
  Crown
} from 'lucide-react';

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  subscription_tier: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  features: any;
  billing_interval: string;
  trial_days: number;
  is_active: boolean;
}

const SubscriptionManager: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSubscriptionStatus(),
        loadPlans()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      // Try Stripe Edge Function first
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.warn('Stripe check failed, falling back to database:', error);
        // Fallback to direct database check
        await loadSubscriptionFromDatabase();
        return;
      }
      
      setSubscription(data);
    } catch (error: any) {
      console.error('Subscription check error:', error);
      // Try fallback before showing error
      try {
        await loadSubscriptionFromDatabase();
      } catch (fallbackError) {
        toast({
          title: 'Error',
          description: 'Failed to check subscription status',
          variant: 'destructive'
        });
      }
    }
  };

  const loadSubscriptionFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get restaurant for this user
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('id, subscription_status, trial_end_date, subscription_end_date')
        .eq('user_id', user.id)
        .single();

      if (restError) throw restError;

      // Get subscription details
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(name, description)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subsError && subsError.code !== 'PGRST116') {
        throw subsError;
      }

      // Map to SubscriptionData format
      const subscriptionData: SubscriptionData = {
        subscribed: subsData?.status === 'active' || subsData?.status === 'trial' || subsData?.status === 'trialing',
        status: subsData?.status || restaurant.subscription_status || 'inactive',
        subscription_tier: subsData?.subscription_plans?.name || null,
        subscription_end: subsData?.current_period_end || restaurant.subscription_end_date || null,
        trial_end: subsData?.trial_end || restaurant.trial_end_date || null,
      };

      setSubscription(subscriptionData);
    } catch (error: any) {
      console.error('Database fallback error:', error);
      throw error;
    }
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Plans loading error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive'
      });
    }
  };

  const refreshSubscription = async () => {
    try {
      setRefreshing(true);
      await loadSubscriptionStatus();
      toast({
        title: 'Success',
        description: 'Subscription status refreshed',
      });
    } catch (error) {
      // Error already handled in loadSubscriptionStatus
    } finally {
      setRefreshing(false);
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Customer portal error:', error);
      toast({
        title: 'Error',
        description: 'Failed to open customer portal',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trial':
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'past_due':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>;
      case 'canceled':
      case 'cancelled':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'inactive':
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </div>
            <div className="flex items-center gap-2">
              {subscription && getStatusBadge(subscription.status)}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshSubscription}
                disabled={refreshing}
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.subscribed ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    {subscription.subscription_tier || 'Active Plan'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {subscription.status === 'trial' || subscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing'}
                  </p>
                  <p className="text-lg font-semibold">
                    {subscription.trial_end && (subscription.status === 'trial' || subscription.status === 'trialing') 
                      ? new Date(subscription.trial_end).toLocaleDateString()
                      : subscription.subscription_end 
                        ? new Date(subscription.subscription_end).toLocaleDateString()
                        : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {subscription.trial_end && (subscription.status === 'trial' || subscription.status === 'trialing') && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Free trial active!</strong> Your trial ends on {new Date(subscription.trial_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={openCustomerPortal} variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">Choose a plan below to get started with your restaurant subscription.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${
              subscription?.subscription_tier?.toLowerCase() === plan.name.toLowerCase() 
                ? 'border-primary bg-primary/5' 
                : ''
            }`}>
              {subscription?.subscription_tier?.toLowerCase() === plan.name.toLowerCase() && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.name}</span>
                  {plan.name.toLowerCase() === 'premium' && (
                    <Crown className="h-5 w-5 text-yellow-600" />
                  )}
                </CardTitle>
                <div className="text-3xl font-bold">
                  {plan.price.toLocaleString()} {plan.currency}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.billing_interval}
                  </span>
                </div>
                {plan.description && (
                  <p className="text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.trial_days > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>{plan.trial_days} days free trial</strong>
                    </p>
                  </div>
                )}

                {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Features:</p>
                    <ul className="space-y-1">
                      {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4">
                  {subscription?.subscription_tier?.toLowerCase() === plan.name.toLowerCase() ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <StripeCheckoutButton
                      planId={plan.id}
                      planName={plan.name}
                      amount={plan.price}
                      currency={plan.currency}
                      billingInterval={plan.billing_interval as 'monthly' | 'yearly'}
                      className="w-full"
                    >
                      {subscription?.subscribed ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                    </StripeCheckoutButton>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;