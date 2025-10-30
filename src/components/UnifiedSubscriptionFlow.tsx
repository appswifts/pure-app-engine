import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StripeCheckoutButton from './StripeCheckoutButton';
import { ManualPaymentFlow } from './ManualPaymentFlow';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Crown,
  Banknote,
  RefreshCw
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

type PaymentMethod = 'stripe' | 'manual';

const UnifiedSubscriptionFlow: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('manual');
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSubscriptionStatus(),
        loadPlans(),
        loadRestaurantId()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRestaurantId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Failed to load restaurant ID:', error);
        return;
      }

      if (restaurant) {
        setRestaurantId(restaurant.id);
      }
    } catch (error) {
      console.error('Failed to load restaurant ID:', error);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant for this user
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .select('id, subscription_status, trial_end_date, subscription_end_date')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

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
      console.error('Subscription check error:', error);
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

  const handlePlanSelection = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentFlow(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    toast({
      title: 'Success',
      description: 'Payment submitted successfully! Your subscription will be activated once verified.',
    });
    await loadSubscriptionStatus();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trial':
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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

  // Show payment flow if plan is selected
  if (showPaymentFlow && selectedPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setShowPaymentFlow(false)}>
            ← Back to Plans
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Complete Your Subscription</h2>
            <p className="text-muted-foreground">
              {selectedPlan.name} - {selectedPlan.price.toLocaleString()} {selectedPlan.currency}/{selectedPlan.billing_interval}
            </p>
          </div>
        </div>

        {/* Payment Method Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                   onClick={() => setPaymentMethod('manual')}>
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Manual Payment (Bank Transfer / Mobile Money)</p>
                    <p className="text-sm text-muted-foreground">Pay via bank transfer or mobile money and submit proof</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                   onClick={() => setPaymentMethod('stripe')}>
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card (via Stripe)</p>
                    <p className="text-sm text-muted-foreground">Instant activation with secure payment</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Payment Flow */}
        {paymentMethod === 'manual' ? (
          <SimpleManualPaymentForm 
            plan={selectedPlan}
            restaurantId={restaurantId}
            onSuccess={handlePaymentSuccess}
          />
        ) : paymentMethod === 'stripe' ? (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm font-medium">Stripe integration is being configured</p>
                </div>
                <p className="text-xs text-yellow-700 mt-2">
                  Please use Manual Payment option for now, or contact support.
                </p>
              </div>
              <StripeCheckoutButton
                planId={selectedPlan.id}
                planName={selectedPlan.name}
                amount={selectedPlan.price}
                currency={selectedPlan.currency}
                billingInterval={selectedPlan.billing_interval as 'monthly' | 'yearly'}
                className="w-full"
                disabled
              >
                Stripe Payment (Coming Soon)
              </StripeCheckoutButton>
            </CardContent>
          </Card>
        ) : null}
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
                  <p className="text-lg font-semibold capitalize">{subscription.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {subscription.status === 'trial' || subscription.status === 'trialing' ? 'Trial Ends' : 'Valid Until'}
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
                    <Button 
                      className="w-full" 
                      onClick={() => handlePlanSelection(plan)}
                    >
                      {subscription?.subscribed ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                    </Button>
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

// Simple Manual Payment Form Component
interface SimpleManualPaymentFormProps {
  plan: Plan;
  restaurantId: string | null;
  onSuccess: () => void;
}

const SimpleManualPaymentForm: React.FC<SimpleManualPaymentFormProps> = ({ plan, restaurantId, onSuccess }) => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money'>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!referenceNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a payment reference number',
        variant: 'destructive',
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: 'Error',
        description: 'Restaurant ID not found',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create subscription record
      const now = new Date();
      const trialEnd = new Date(now.getTime() + (plan.trial_days * 24 * 60 * 60 * 1000));

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          restaurant_id: restaurantId,
          plan_id: plan.id,
          status: 'pending',
          amount: plan.price,
          currency: plan.currency,
          billing_interval: plan.billing_interval,
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          notes: `Payment Method: ${paymentMethod}, Reference: ${referenceNumber}${notes ? ', Notes: ' + notes : ''}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (subError) throw subError;

      // Update restaurant status
      await supabase
        .from('restaurants')
        .update({
          subscription_status: 'pending',
          current_subscription_id: subscription.id,
        })
        .eq('id', restaurantId);

      toast({
        title: 'Success!',
        description: 'Your subscription request has been submitted. Our team will verify your payment and activate your account shortly.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit subscription request',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Transfer {plan.price.toLocaleString()} {plan.currency} to one of our payment methods below
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <h4 className="font-semibold text-blue-900">Payment Methods</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Banknote className="h-4 w-4 mt-0.5 text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Bank Transfer</p>
                <p className="text-blue-700">Bank: Bank of Kigali</p>
                <p className="text-blue-700">Account: 1234567890123</p>
                <p className="text-blue-700">Name: MenuForest Ltd</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Banknote className="h-4 w-4 mt-0.5 text-blue-700" />
              <div>
                <p className="font-medium text-blue-900">Mobile Money</p>
                <p className="text-blue-700">MTN: +250 788 123 456</p>
                <p className="text-blue-700">Airtel: +250 732 123 456</p>
                <p className="text-blue-700">Name: MenuForest Ltd</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method Used *</Label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'bank_transfer' | 'mobile_money')}
              className="w-full p-2 border rounded-md"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference Number *</Label>
            <input
              id="reference"
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter your payment reference number"
              className="w-full p-2 border rounded-md"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the transaction ID or reference from your bank/mobile money receipt
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              className="w-full p-2 border rounded-md min-h-[80px]"
            />
          </div>
        </div>

        {/* Amount Summary */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Amount:</span>
            <span className="text-2xl font-bold">
              {plan.price.toLocaleString()} {plan.currency}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Includes {plan.trial_days} days free trial
          </p>
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={submitting || !referenceNumber.trim()}
          className="w-full"
          size="lg"
        >
          {submitting ? 'Submitting...' : 'Submit Subscription Request'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your subscription will be activated within 24 hours after payment verification
        </p>
      </CardContent>
    </Card>
  );
};

export default UnifiedSubscriptionFlow;
