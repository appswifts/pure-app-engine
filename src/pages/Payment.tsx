import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ManualPaymentFlow } from '@/components/ManualPaymentFlow';
import PaymentLinkGenerator from '@/components/PaymentLinkGenerator';
import { useAuth } from '@/hooks/useAuth';
import { 
  CreditCard, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Link2
} from 'lucide-react';

const Payment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [restaurant, setRestaurant] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's restaurant first
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id, name, email')
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
          subscription_plans(*)
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
      const { data: requestsData, error: reqError } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (reqError) {
        throw reqError;
      }

      setPaymentRequests(requestsData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'pending_payment':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Pending Payment</Badge>;
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
        return <Badge className="bg-orange-100 text-orange-800">Awaiting Approval</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
              ← Back to Subscription
            </Button>
          </div>
          <ManualPaymentFlow
            subscriptionId={subscription.id}
            amount={subscription.amount}
            currency={subscription.currency}
            onPaymentSuccess={() => {
              setShowPaymentFlow(false);
              loadSubscriptionData();
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
          <h1 className="text-3xl font-bold mb-2">Subscription & Payment</h1>
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
                  <p className="text-lg font-semibold">{subscription.amount?.toLocaleString()} {subscription.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Billing</p>
                  <p className="text-lg font-semibold">{subscription.billing_interval}</p>
                </div>
              </div>

              {subscription.trial_end && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Trial ends:</strong> {new Date(subscription.trial_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Link Section */}
              <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Payment Link</h4>
                    <p className="text-sm text-muted-foreground">Share this link to receive payments</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const paymentUrl = `${window.location.origin}/payment?restaurant=${subscription.restaurant_id || user?.id}`;
                      navigator.clipboard.writeText(paymentUrl);
                      toast({
                        title: "Copied!",
                        description: "Payment link copied to clipboard"
                      });
                    }}
                  >
                    Copy Link
                  </Button>
                </div>
                <div className="mt-2 p-2 bg-muted rounded text-sm font-mono break-all">
                  {`${window.location.origin}/payment?restaurant=${subscription.restaurant_id || 'your-restaurant-id'}`}
                </div>
              </div>

              {subscription.status === 'pending_payment' && (
                <div className="pt-4">
                  <Button 
                    onClick={() => setShowPaymentFlow(true)}
                    className="w-full sm:w-auto"
                  >
                    Make Payment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-4">You don't have an active subscription yet.</p>
              <Button onClick={() => navigate('/restaurant-signup')}>
                Choose a Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Link Generator */}
        {restaurant && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Payment Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentLinkGenerator restaurantId={restaurant.id} />
            </CardContent>
          </Card>
        )}

        {/* Payment History */}
        {paymentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{request.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.amount?.toLocaleString()} {request.currency} • 
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.reference_number && (
                        <p className="text-sm text-muted-foreground">
                          Ref: {request.reference_number}
                        </p>
                      )}
                      {request.admin_notes && (
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          Admin: {request.admin_notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {getPaymentStatusBadge(request.status)}
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

export default Payment;