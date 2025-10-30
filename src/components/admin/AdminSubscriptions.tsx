import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import SeedSubscriptionPlans from '@/components/SeedSubscriptionPlans';
import { 
  Users, 
  Plus,
  Search,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Eye,
  Edit
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  subscription_status: string;
  trial_end_date?: string;
  subscription_end_date?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
  trial_days: number;
}

interface Subscription {
  id: string;
  restaurant_id: string;
  status: string;
  trial_end?: string;
  current_period_end?: string;
  amount: number;
  currency: string;
  billing_interval: string;
  created_at: string;
  restaurant?: Restaurant;
  plan?: SubscriptionPlan;
}

const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [trialDays, setTrialDays] = useState('14');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load subscriptions with restaurant and plan data
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          restaurant:restaurants!subscriptions_restaurant_id_fkey(id, name, email, subscription_status, trial_end_date, subscription_end_date),
          plan:subscription_plans(id, name, price, currency, billing_interval, trial_days)
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Load all restaurants for the create dialog
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .select('id, name, email, subscription_status, trial_end_date, subscription_end_date')
        .order('name');

      if (restError) throw restError;

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (plansError) throw plansError;

      setSubscriptions(subsData || []);
      setRestaurants(restData || []);
      setPlans(plansData || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load data: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async () => {
    if (!selectedRestaurant || !selectedPlan) {
      toast({
        title: 'Error',
        description: 'Please select both restaurant and plan',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) throw new Error('Plan not found');

      const now = new Date();
      const trialEnd = new Date(now.getTime() + (parseInt(trialDays) * 24 * 60 * 60 * 1000));

      // Create subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          restaurant_id: selectedRestaurant,
          plan_id: selectedPlan,
          status: 'trial',
          trial_start: now.toISOString(),
          trial_end: trialEnd.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: trialEnd.toISOString(),
          next_billing_date: trialEnd.toISOString(),
          amount: plan.price,
          currency: plan.currency,
          billing_interval: plan.billing_interval,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update restaurant status
      await supabase
        .from('restaurants')
        .update({
          subscription_status: 'trial',
          trial_end_date: trialEnd.toISOString(),
          current_subscription_id: data.id,
        })
        .eq('id', selectedRestaurant);

      toast({
        title: 'Success',
        description: 'Subscription created successfully',
      });

      setShowCreateDialog(false);
      setSelectedRestaurant('');
      setSelectedPlan('');
      setTrialDays('14');
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to create subscription: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const activateSubscription = async (subscriptionId: string) => {
    try {
      const now = new Date();
      const nextBilling = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      // Update subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_date: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: nextBilling.toISOString(),
          next_billing_date: nextBilling.toISOString(),
        })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Update restaurant status
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (subscription) {
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'active',
            subscription_start_date: now.toISOString(),
            subscription_end_date: nextBilling.toISOString(),
            last_payment_date: now.toISOString(),
          })
          .eq('id', subscription.restaurant_id);
      }

      toast({
        title: 'Success',
        description: 'Subscription activated successfully',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to activate subscription: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const cancelSubscription = async (subscriptionId: string) => {
    try {
      const now = new Date();

      // Update subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: now.toISOString(),
          cancellation_reason: 'Cancelled by admin',
        })
        .eq('id', subscriptionId);

      if (subError) throw subError;

      // Update restaurant status
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (subscription) {
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'inactive',
          })
          .eq('id', subscription.restaurant_id);
      }

      toast({
        title: 'Success',
        description: 'Subscription cancelled successfully',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      trial: { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      expired: { variant: 'destructive' as const, icon: AlertTriangle, color: 'text-orange-600' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      sub.restaurant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.restaurant?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    pending: subscriptions.filter(s => s.status === 'pending').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage restaurant subscriptions and billing.
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subscription</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Restaurant</Label>
                <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map(restaurant => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name} ({restaurant.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Plan</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.price} {plan.currency}/{plan.billing_interval}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Trial Days</Label>
                <Input
                  type="number"
                  value={trialDays}
                  onChange={(e) => setTrialDays(e.target.value)}
                  min="0"
                  max="365"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createSubscription}>
                  Create Subscription
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seed Plans Component */}
      {plans.length === 0 && (
        <SeedSubscriptionPlans />
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.trial}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Restaurant</th>
                    <th className="text-left p-4 font-medium">Plan</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Period End</th>
                    <th className="text-left p-4 font-medium">Amount</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-t">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{subscription.restaurant?.name}</div>
                          <div className="text-sm text-muted-foreground">{subscription.restaurant?.email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{subscription.plan?.name || 'Unknown Plan'}</div>
                          <div className="text-sm text-muted-foreground">{subscription.billing_interval}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(subscription.status)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {subscription.trial_end || subscription.current_period_end ? 
                              new Date(subscription.trial_end || subscription.current_period_end!).toLocaleDateString() : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span>{subscription.amount} {subscription.currency}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {subscription.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => activateSubscription(subscription.id)}
                            >
                              Approve
                            </Button>
                          )}
                          {subscription.status === 'trial' && (
                            <Button
                              size="sm"
                              onClick={() => activateSubscription(subscription.id)}
                            >
                              Activate
                            </Button>
                          )}
                          {(subscription.status === 'active' || subscription.status === 'trial' || subscription.status === 'pending') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => cancelSubscription(subscription.id)}
                            >
                              {subscription.status === 'pending' ? 'Reject' : 'Cancel'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredSubscriptions.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No subscriptions found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptions;