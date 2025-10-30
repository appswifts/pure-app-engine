import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { subscriptionService, SubscriptionPlan, Subscription } from '@/services/subscriptionService';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Gift,
  AlertTriangle,
  ExternalLink,
  Phone,
  Building2
} from 'lucide-react';

interface PaymentInstructions {
  bank_name: string;
  account_number: string;
  account_name: string;
  mobile_money_numbers: Array<{ provider: string; number: string }>;
  payment_instructions: string;
}

interface RestaurantSubscriptionFlowProps {
  restaurantId: string;
}

const RestaurantSubscriptionFlow: React.FC<RestaurantSubscriptionFlowProps> = ({ restaurantId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<PaymentInstructions | null>(null);
  const [step, setStep] = useState<'plans' | 'payment' | 'confirmation'>('plans');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [plansData, subscriptionData, instructionsData] = await Promise.all([
        subscriptionService.getSubscriptionPlans(),
        subscriptionService.getRestaurantSubscription(restaurantId),
        loadPaymentInstructions(),
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setPaymentInstructions(instructionsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load subscription data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentInstructions = async (): Promise<PaymentInstructions> => {
    const { data, error } = await supabase
      .from('manual_payment_instructions')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        bank_name: 'Bank of Kigali',
        account_number: '1234567890123',
        account_name: 'MenuForest Ltd',
        mobile_money_numbers: [
          { provider: 'MTN', number: '+250788123456' },
          { provider: 'Airtel', number: '+250732123456' }
        ],
        payment_instructions: 'Please make payment and contact support with proof.'
      };
    }

    return {
      bank_name: data.bank_name || '',
      account_number: data.account_number || '',
      account_name: data.account_name || '',
      mobile_money_numbers: Array.isArray(data.mobile_money_numbers) ? 
        data.mobile_money_numbers.filter((item): item is { provider: string; number: string } => 
          typeof item === 'object' && item !== null && 
          'provider' in item && 'number' in item
        ) : [],
      payment_instructions: data.payment_instructions || ''
    };
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setStep('payment');
  };

  const handlePaymentConfirmation = async () => {
    try {
      // Create payment record
      const { data, error } = await supabase
        .from('payment_records')
        .insert({
          subscription_id: currentSubscription?.id,
          amount: selectedPlan?.price || 0,
          currency: selectedPlan?.currency || 'RWF',
          payment_method: 'manual',
          reference_number: paymentReference,
          status: 'pending',
          payment_date: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment confirmation submitted. We'll review it within 24 hours.",
      });

      setStep('confirmation');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment confirmation",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading subscription options...</p>
        </div>
      </div>
    );
  }

  // Show current subscription status if active
  if (currentSubscription && ['active', 'trial'].includes(currentSubscription.status)) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Current Subscription</h2>
          <p className="text-muted-foreground">Your restaurant subscription is active.</p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{currentSubscription.plan?.name}</CardTitle>
                <CardDescription>{currentSubscription.plan?.description}</CardDescription>
              </div>
              <Badge className={`${
                currentSubscription.status === 'active' ? 'bg-green-500' : 'bg-blue-500'
              } text-white`}>
                {currentSubscription.status === 'active' ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <Gift className="h-4 w-4 mr-1" />
                )}
                <span className="capitalize">{currentSubscription.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Amount</div>
                <div className="font-medium">{formatPrice(currentSubscription.amount, currentSubscription.currency)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Billing</div>
                <div className="font-medium capitalize">{currentSubscription.billing_interval}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Current Period</div>
                <div className="font-medium">
                  {formatDate(currentSubscription.current_period_start)} - {formatDate(currentSubscription.current_period_end)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Next Billing</div>
                <div className="font-medium">{formatDate(currentSubscription.next_billing_date)}</div>
              </div>
            </div>
            
            {currentSubscription.plan?.features && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Plan Features:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentSubscription.plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 1: Plan Selection
  if (step === 'plans') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Choose Your Plan</h2>
          <p className="text-muted-foreground">Select a subscription plan to get started with MenuForest.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="shadow-sm relative">
              {plan.name.toLowerCase() === 'professional' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-4">
                  <div className="text-3xl font-bold">{formatPrice(plan.price, plan.currency)}</div>
                  <div className="text-muted-foreground">per {plan.billing_interval}</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-sm text-primary">
                    <Gift className="h-4 w-4" />
                    {plan.trial_days} days free trial
                  </div>
                  
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectPlan(plan)}
                    variant={plan.name.toLowerCase() === 'professional' ? 'default' : 'outline'}
                  >
                    Start {plan.trial_days}-Day Trial
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Payment Instructions
  if (step === 'payment' && selectedPlan && paymentInstructions) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Instructions</h2>
          <p className="text-muted-foreground">Complete your payment to activate your subscription.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Selected Plan Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium">{selectedPlan.name} Plan</div>
                  <div className="text-sm text-muted-foreground">{selectedPlan.description}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatPrice(selectedPlan.price, selectedPlan.currency)}</div>
                  <div className="text-sm text-muted-foreground">per {selectedPlan.billing_interval}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Gift className="h-4 w-4" />
                  {selectedPlan.trial_days} days free trial included
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Choose your preferred payment method below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Transfer */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Bank Transfer</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div><strong>Bank:</strong> {paymentInstructions.bank_name}</div>
                  <div><strong>Account:</strong> {paymentInstructions.account_number}</div>
                  <div><strong>Name:</strong> {paymentInstructions.account_name}</div>
                </div>
              </div>

              {/* Mobile Money */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Mobile Money</h4>
                </div>
                <div className="space-y-2">
                  {paymentInstructions.mobile_money_numbers.map((momo, index) => (
                    <div key={index} className="text-sm">
                      <strong>{momo.provider}:</strong> {momo.number}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Confirmation */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Confirm Your Payment</CardTitle>
            <CardDescription>
              After making your payment, please provide the transaction reference below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="payment_ref" className="text-sm font-medium">
                Transaction Reference Number *
              </label>
              <input
                id="payment_ref"
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter your transaction reference"
                className="w-full p-3 border rounded-lg"
                required
              />
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-primary mb-1">Important:</p>
                  <div className="text-muted-foreground space-y-1">
                    <p>• {paymentInstructions.payment_instructions}</p>
                    <p>• We'll verify your payment within 24 hours</p>
                    <p>• Your subscription will be activated once payment is confirmed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('plans')}
                className="flex-1"
              >
                Back to Plans
              </Button>
              <Button 
                onClick={handlePaymentConfirmation}
                disabled={!paymentReference.trim()}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Submit Payment Proof
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 'confirmation') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight mb-2">Payment Submitted Successfully!</h2>
          <p className="text-muted-foreground">Thank you for submitting your payment proof.</p>
        </div>

        <Card className="shadow-sm max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div>
                <div className="font-medium">Plan: {selectedPlan?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(selectedPlan?.price || 0, selectedPlan?.currency)}
                </div>
              </div>
              <div>
                <div className="font-medium">Reference: {paymentReference}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg text-sm">
                <Clock className="h-4 w-4 mx-auto mb-2 text-blue-500" />
                <p>Our team will verify your payment within 24 hours and activate your subscription.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button onClick={() => window.location.reload()}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default RestaurantSubscriptionFlow;