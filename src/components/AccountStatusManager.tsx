import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface AccountStatusManagerProps {
  restaurantId: string;
  onStatusChange?: (status: string) => void;
}

interface SubscriptionStatus {
  status: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  trial_end_date?: string;
  plan?: {
    name: string;
    price: number;
    currency: string;
  };
  payment_requests?: Array<{
    id: string;
    status: string;
    amount: number;
    due_date: string;
    created_at: string;
  }>;
}

const AccountStatusManager: React.FC<AccountStatusManagerProps> = ({ 
  restaurantId, 
  onStatusChange 
}) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadAccountStatus();
    const interval = setInterval(loadAccountStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [restaurantId]);

  const loadAccountStatus = async () => {
    try {
      // Get restaurant status
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select(`
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          trial_end_date
        `)
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      // Get active subscription with plan details
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (name, price, currency)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get pending payment requests
      const { data: paymentRequests, error: paymentError } = await supabase
        .from('payment_requests')
        .select('id, status, amount, due_date, created_at')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'pending_approval'])
        .order('created_at', { ascending: false });

      if (paymentError) throw paymentError;

      const statusData: SubscriptionStatus = {
        status: restaurant.subscription_status,
        subscription_start_date: restaurant.subscription_start_date,
        subscription_end_date: restaurant.subscription_end_date,
        trial_end_date: restaurant.trial_end_date,
        plan: subscription?.subscription_plans,
        payment_requests: paymentRequests || []
      };

      setStatus(statusData);
      onStatusChange?.(restaurant.subscription_status);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load account status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusConfig = {
      active: {
        color: 'bg-success text-success-foreground',
        icon: CheckCircle,
        title: 'Active',
        description: 'Your subscription is active and your menu is visible to customers'
      },
      trial: {
        color: 'bg-primary text-primary-foreground',
        icon: Clock,
        title: 'Trial Period',
        description: 'You\'re in your free trial period'
      },
      pending: {
        color: 'bg-warning text-warning-foreground',
        icon: AlertTriangle,
        title: 'Payment Pending',
        description: 'Waiting for payment confirmation'
      },
      expired: {
        color: 'bg-destructive text-destructive-foreground',
        icon: XCircle,
        title: 'Expired',
        description: 'Your subscription has expired'
      },
      inactive: {
        color: 'bg-muted text-muted-foreground',
        icon: XCircle,
        title: 'Inactive',
        description: 'No active subscription'
      }
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
  };

  const getDaysRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatCurrency = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleRenewSubscription = () => {
    navigate('/subscription');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading status...</span>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="text-center p-6">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Status Unavailable</h3>
          <p className="text-muted-foreground">Unable to load account status</p>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(status.status);
  const Icon = statusInfo.icon;

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Icon className="h-6 w-6" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{statusInfo.title}</h3>
                  <Badge className={statusInfo.color}>
                    {status.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {statusInfo.description}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Period Alert */}
      {status.status === 'trial' && status.trial_end_date && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your free trial ends in {getDaysRemaining(status.trial_end_date)} days
            ({new Date(status.trial_end_date).toLocaleDateString()}). 
            Subscribe now to continue using all features.
          </AlertDescription>
        </Alert>
      )}

      {/* Expired Alert */}
      {status.status === 'expired' && (
        <Alert className="border-destructive">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription>
            <strong>Subscription Expired:</strong> Your menu is no longer visible to customers. 
            Renew your subscription to reactivate your account.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Info */}
      {status.plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{status.plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {status.subscription_end_date && (
                    `Valid until ${new Date(status.subscription_end_date).toLocaleDateString()}`
                  )}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {formatCurrency(status.plan.price, status.plan.currency)}
                </div>
                <div className="text-sm text-muted-foreground">per month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payment Requests */}
      {status.payment_requests && status.payment_requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Payments</CardTitle>
            <CardDescription>Complete these payments to activate your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.payment_requests.map((request) => (
                <div key={request.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      Payment Due: {formatCurrency(request.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {new Date(request.due_date).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={request.status === 'pending_approval' ? 'secondary' : 'outline'}>
                    {request.status === 'pending_approval' ? 'Under Review' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        {(status.status === 'expired' || status.status === 'inactive' || status.status === 'trial') && (
          <Button onClick={handleRenewSubscription} className="flex-1">
            <Calendar className="w-4 h-4 mr-2" />
            {status.status === 'trial' ? 'Subscribe Now' : 'Renew Subscription'}
          </Button>
        )}
        
        <Button variant="outline" onClick={loadAccountStatus}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  );
};

export default AccountStatusManager;