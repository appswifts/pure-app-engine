import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Search,
  Eye
} from 'lucide-react';

interface PendingSubscription {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: string;
  amount: number;
  currency: string;
  billing_interval: string;
  trial_end: string;
  created_at: string;
  restaurants: {
    name: string;
    email: string;
    phone: string;
    subscription_status: string;
  };
  subscription_plans: {
    name: string;
    description: string;
  };
  payment_requests: Array<{
    id: string;
    status: string;
    payment_method: string;
    reference_number: string;
    amount: number;
    currency: string;
    created_at: string;
  }>;
}

export const SubscriptionActivationManager = () => {
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPendingSubscriptions();
  }, []);

  const loadPendingSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          restaurants!inner(name, email, phone, subscription_status),
          subscription_plans(name, description)
        `)
        .in('status', ['trialing', 'pending_payment'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load payment requests separately to avoid complex join issues
      const subscriptionsWithPayments = await Promise.all(
        (data || []).map(async (sub) => {
          const { data: paymentRequests } = await supabase
            .from('payment_requests')
            .select('id, status, payment_method, reference_number, amount, currency, created_at')
            .eq('subscription_id', sub.id);
          
          return {
            ...sub,
            payment_requests: paymentRequests || []
          };
        })
      );

      setPendingSubscriptions(subscriptionsWithPayments as any);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load pending subscriptions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activateSubscription = async (subscription: PendingSubscription) => {
    try {
      setProcessing(subscription.id);

      // Calculate new subscription period
      const now = new Date();
      const endDate = new Date(now);
      if (subscription.billing_interval === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update subscription status
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: endDate.toISOString(),
          last_payment_date: now.toISOString(),
          next_billing_date: endDate.toISOString()
        })
        .eq('id', subscription.id);

      if (subError) throw subError;

      // Update restaurant status
      const { error: restError } = await supabase
        .from('restaurants')
        .update({
          subscription_status: 'active',
          subscription_start_date: now.toISOString(),
          subscription_end_date: endDate.toISOString(),
          last_payment_date: now.toISOString()
        })
        .eq('id', subscription.restaurant_id);

      if (restError) throw restError;

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          subscription_id: subscription.id,
          amount: subscription.amount,
          currency: subscription.currency,
          status: 'confirmed',
          payment_method: 'manual',
          admin_notes: adminNotes[subscription.id] || 'Manually activated by admin',
          verified_at: now.toISOString()
        });

      if (paymentError) throw paymentError;

      toast({
        title: 'Success',
        description: `${subscription.restaurants?.name} subscription activated successfully`,
      });

      loadPendingSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to activate subscription',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectSubscription = async (subscription: PendingSubscription) => {
    try {
      setProcessing(subscription.id);

      // Update subscription status
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: adminNotes[subscription.id] || 'Rejected by admin'
        })
        .eq('id', subscription.id);

      if (subError) throw subError;

      // Update restaurant status
      const { error: restError } = await supabase
        .from('restaurants')
        .update({
          subscription_status: 'inactive'
        })
        .eq('id', subscription.restaurant_id);

      if (restError) throw restError;

      toast({
        title: 'Success',
        description: `${subscription.restaurants?.name} subscription rejected`,
      });

      loadPendingSubscriptions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject subscription',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'trialing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Trial Period</Badge>;
      case 'pending_payment':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Pending Payment</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredSubscriptions = pendingSubscriptions.filter(sub =>
    sub.restaurants?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.restaurants?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Activation</h2>
          <p className="text-muted-foreground">Activate or reject pending restaurant subscriptions</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Trial Period</p>
                <p className="text-2xl font-bold">
                  {pendingSubscriptions.filter(s => s.status === 'trialing').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Pending Payment</p>
                <p className="text-2xl font-bold">
                  {pendingSubscriptions.filter(s => s.status === 'pending_payment').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Pending</p>
                <p className="text-2xl font-bold">{pendingSubscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Subscriptions */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground">No pending subscriptions to review.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSubscriptions.map((subscription) => (
            <Card key={subscription.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {subscription.restaurants?.name}
                  </CardTitle>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Plan:</span>
                    <p>{subscription.subscription_plans?.name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p>{subscription.amount.toLocaleString()} {subscription.currency}/{subscription.billing_interval}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trial Ends:</span>
                    <p>{new Date(subscription.trial_end).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <p>{new Date(subscription.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="font-medium">Contact:</span>
                  <p>{subscription.restaurants?.email} • {subscription.restaurants?.phone}</p>
                </div>

                {Array.isArray(subscription.payment_requests) && subscription.payment_requests.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Payment Requests:</span>
                    <div className="mt-2 space-y-1">
                      {subscription.payment_requests.map((req) => (
                        <div key={req.id} className="text-sm bg-muted p-2 rounded">
                          <div className="flex items-center justify-between">
                            <span>{req.payment_method} - {req.amount} {req.currency}</span>
                            <Badge variant={req.status === 'pending_approval' ? 'outline' : 'secondary'}>
                              {req.status}
                            </Badge>
                          </div>
                          {req.reference_number && (
                            <p className="text-muted-foreground">Ref: {req.reference_number}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`notes-${subscription.id}`}>Admin Notes</Label>
                  <Textarea
                    id={`notes-${subscription.id}`}
                    placeholder="Add notes about this subscription activation..."
                    value={adminNotes[subscription.id] || ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({
                        ...prev,
                        [subscription.id]: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => activateSubscription(subscription)}
                    disabled={processing === subscription.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === subscription.id ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Activate Subscription
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectSubscription(subscription)}
                    disabled={processing === subscription.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionActivationManager;