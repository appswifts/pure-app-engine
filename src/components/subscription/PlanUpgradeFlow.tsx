import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Crown, 
  CheckCircle, 
  ArrowUpCircle, 
  ArrowDownCircle,
  TrendingUp,
  Zap,
  Info,
  AlertTriangle
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
  features: string[];
  max_menu_items: number;
  max_tables: number;
  is_popular?: boolean;
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_interval: string;
  current_period_end: string;
}

interface Props {
  currentSubscription: CurrentSubscription | null;
  onUpgradeComplete?: () => void;
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const PlanUpgradeFlow: React.FC<Props> = ({ currentSubscription, onUpgradeComplete }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Failed to load plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription plans',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProration = (newPlan: Plan): number => {
    if (!currentSubscription) return newPlan.price;

    const now = new Date();
    const periodEnd = new Date(currentSubscription.current_period_end);
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = currentSubscription.billing_interval === 'monthly' ? 30 : 365;
    
    // Calculate unused credit from current plan
    const unusedCredit = (currentSubscription.amount / totalDays) * daysRemaining;
    
    // Calculate prorated charge for new plan
    const proratedCharge = (newPlan.price / totalDays) * daysRemaining;
    
    // Net amount to charge
    return Math.max(0, proratedCharge - unusedCredit);
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const confirmPlanChange = async () => {
    if (!selectedPlan || !currentSubscription) return;

    try {
      setProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!restaurant) throw new Error('Restaurant not found');

      // Calculate proration
      const proratedAmount = calculateProration(selectedPlan);

      // Create new subscription record (or update existing)
      const now = new Date();
      const periodEnd = new Date(currentSubscription.current_period_end);

      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: selectedPlan.id,
          amount: selectedPlan.price,
          status: 'active',
          updated_at: now.toISOString(),
        })
        .eq('id', currentSubscription.id);

      if (subError) throw subError;

      // Create payment record for proration
      if (proratedAmount > 0) {
        const { error: paymentError } = await supabase
          .from('payment_records')
          .insert({
            subscription_id: currentSubscription.id,
            amount: proratedAmount,
            currency: selectedPlan.currency,
            payment_method: 'upgrade_proration',
            status: 'pending',
            payment_date: now.toISOString(),
          });

        if (paymentError) console.error('Payment record error:', paymentError);
      }

      toast({
        title: 'Success!',
        description: `Your plan has been ${selectedPlan.price > currentSubscription.amount ? 'upgraded' : 'downgraded'} to ${selectedPlan.name}`,
      });

      setShowConfirmDialog(false);
      onUpgradeComplete?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change plan',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPlanComparison = (plan: Plan): 'current' | 'upgrade' | 'downgrade' => {
    if (!currentSubscription) return 'upgrade';
    if (plan.id === currentSubscription.plan_id) return 'current';
    return plan.price > currentSubscription.amount ? 'upgrade' : 'downgrade';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-96 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const comparison = getPlanComparison(plan);
          const isCurrent = comparison === 'current';
          const isUpgrade = comparison === 'upgrade';

          return (
            <Card 
              key={plan.id}
              className={`relative ${
                isCurrent ? 'border-2 border-blue-500 shadow-lg' : 
                plan.is_popular ? 'border-2 border-yellow-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.is_popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {plan.name}
                    {plan.name.toLowerCase().includes('premium') && (
                      <Crown className="h-5 w-5 text-yellow-600" />
                    )}
                  </span>
                </CardTitle>
                {plan.description && (
                  <CardDescription className="text-sm mt-2">
                    {plan.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Pricing */}
                <div>
                  <div className="text-4xl font-bold">
                    {formatCurrency(plan.price, plan.currency)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {plan.billing_interval}
                  </div>
                  {plan.trial_days > 0 && !isCurrent && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      {plan.trial_days} days free trial
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Features:</div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limits */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Menu Items:</span>
                    <span className="font-medium">
                      {plan.max_menu_items === -1 ? 'Unlimited' : plan.max_menu_items}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tables/QR Codes:</span>
                    <span className="font-medium">
                      {plan.max_tables === -1 ? 'Unlimited' : plan.max_tables}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full ${
                        isUpgrade 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
                          : ''
                      }`}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      {isUpgrade ? (
                        <>
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Upgrade to {plan.name}
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="h-4 w-4 mr-2" />
                          Downgrade to {plan.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedPlan && currentSubscription && selectedPlan.price > currentSubscription.amount ? (
                <>
                  <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                  Confirm Plan Upgrade
                </>
              ) : (
                <>
                  <ArrowDownCircle className="h-5 w-5 text-orange-600" />
                  Confirm Plan Downgrade
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedPlan && currentSubscription && (
            <div className="space-y-4">
              {/* Plan Change Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <span className="font-medium">{currentSubscription.plan_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">New Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">New Monthly Price:</span>
                  <span className="font-bold">
                    {formatCurrency(selectedPlan.price, selectedPlan.currency)}
                  </span>
                </div>
              </div>

              {/* Proration Info */}
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>Prorated Charge:</strong> {formatCurrency(calculateProration(selectedPlan), selectedPlan.currency)}
                  <p className="mt-1 text-xs">
                    You'll be charged a prorated amount for the remainder of your current billing period.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Warning for Downgrades */}
              {selectedPlan.price < currentSubscription.amount && (
                <Alert className="bg-orange-50 border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 text-sm">
                    <strong>Note:</strong> Downgrading may limit access to some features. Changes take effect immediately.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={confirmPlanChange}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Confirm Change'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanUpgradeFlow;
