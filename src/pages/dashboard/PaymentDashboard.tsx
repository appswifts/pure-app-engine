import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ManualPaymentFlow } from '@/components/ManualPaymentFlow';
import { manualPaymentService } from '@/services/manualPaymentService';
import { 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Receipt,
  DollarSign
} from 'lucide-react';

interface PaymentRequest {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  due_date: string;
  created_at: string;
  reference_number?: string;
  admin_notes?: string;
}

interface Subscription {
  id: string;
  status: string;
  amount: number;
  currency: string;
  billing_interval: string;
  trial_end?: string;
  current_period_end?: string;
  subscription_plans?: {
    name: string;
    description: string;
  };
}

const PaymentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (restaurantError || !restaurantData) {
        console.log('No restaurant found for user');
        return;
      }

      setRestaurant(restaurantData);

      // Load restaurant's subscription
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans(name, description)
        `)
        .eq('restaurant_id', restaurantData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      setSubscription(subscriptionData);

      // Load payment requests
      if (restaurantData.id) {
        const requests = await manualPaymentService.getPaymentRequests(restaurantData.id);
        setPaymentRequests(requests);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success border-success"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trialing':
        return <Badge className="bg-primary/10 text-primary border-primary"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'pending_payment':
        return <Badge className="bg-warning/10 text-warning border-warning"><AlertTriangle className="h-3 w-3 mr-1" />Pending Payment</Badge>;
      case 'expired':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'pending_approval':
        return <Badge className="bg-warning/10 text-warning border-warning">Awaiting Approval</Badge>;
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (showPaymentFlow && subscription) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentFlow(false)}
              className="mb-4"
            >
              ← Back to Payment Dashboard
            </Button>
          </div>
          <ManualPaymentFlow
            subscriptionId={subscription.id}
            amount={subscription.amount}
            currency={subscription.currency}
            onPaymentSuccess={() => {
              setShowPaymentFlow(false);
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Payment Dashboard</h1>
          <p className="text-muted-foreground">Manage your restaurant subscription and payments</p>
        </div>

        {/* Subscription Status */}
        {subscription ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </div>
                {getStatusBadge(subscription.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold">{subscription.subscription_plans?.name || 'Unknown Plan'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(subscription.amount, subscription.currency)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billing</p>
                  <p className="text-lg font-semibold">{subscription.billing_interval}</p>
                </div>
              </div>

              {subscription.trial_end && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm text-primary">
                      <strong>Trial ends:</strong> {new Date(subscription.trial_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {subscription.status === 'pending_payment' && (
                <div className="pt-4">
                  <Button 
                    onClick={() => setShowPaymentFlow(true)}
                    className="w-full sm:w-auto"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Make Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">You don't have an active subscription yet.</p>
              <Button onClick={() => navigate('/dashboard/subscription')}>
                Choose a Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {paymentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{request.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(request.amount, request.currency)} • 
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.reference_number && (
                        <p className="text-sm text-muted-foreground">
                          Ref: {request.reference_number}
                        </p>
                      )}
                      {request.admin_notes && (
                        <p className="text-sm text-primary bg-primary/5 p-2 rounded">
                          Admin: {request.admin_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {getPaymentStatusBadge(request.status)}
                      {request.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {new Date(request.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentDashboard;