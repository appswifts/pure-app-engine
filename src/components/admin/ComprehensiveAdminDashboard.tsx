import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Store,
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

// Import admin components
import { AdminPlanFeatureControl } from './AdminPlanFeatureControl';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminRestaurantManagement } from './AdminRestaurantManagement';
import { AdminSubscriptionManagement } from './AdminSubscriptionManagement';
import { AdminPaymentVerification } from './AdminPaymentVerification';
import { AdminAnalytics } from './AdminAnalytics';

interface DashboardStats {
  total_users: number;
  total_restaurants: number;
  total_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  pending_payments: number;
  monthly_revenue: number;
  pending_approvals: number;
}

export const ComprehensiveAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    total_restaurants: 0,
    total_subscriptions: 0,
    active_subscriptions: 0,
    trial_subscriptions: 0,
    pending_payments: 0,
    monthly_revenue: 0,
    pending_approvals: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      // Load all stats in parallel
      const [
        usersResult,
        restaurantsResult,
        subscriptionsResult,
        paymentsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id, status, amount, currency'),
        (supabase as any).from('payment_records').select('id, status').eq('status', 'pending'),
      ]);

      const subscriptions = subscriptionsResult.data || [];
      const activeCount = subscriptions.filter(s => s.status === 'active').length;
      const trialCount = subscriptions.filter(s => s.status === 'trial' || s.status === 'trialing').length;
      const pendingCount = subscriptions.filter(s => s.status === 'pending' || s.status === 'pending_payment').length;
      
      // Calculate monthly revenue (active subscriptions only)
      const monthlyRevenue = subscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      setStats({
        total_users: usersResult.count || 0,
        total_restaurants: restaurantsResult.count || 0,
        total_subscriptions: subscriptionsResult.data?.length || 0,
        active_subscriptions: activeCount,
        trial_subscriptions: trialCount,
        pending_payments: paymentsResult.data?.length || 0,
        monthly_revenue: monthlyRevenue,
        pending_approvals: pendingCount,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'RWF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <LayoutDashboard className="h-10 w-10 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage subscriptions, users, restaurants, and payments
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Users
                  <Users className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {loading ? '...' : stats.total_users}
                </div>
              </CardContent>
            </Card>

            {/* Total Restaurants */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Restaurants
                  <Store className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {loading ? '...' : stats.total_restaurants}
                </div>
              </CardContent>
            </Card>

            {/* Active Subscriptions */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Active Subscriptions
                  <CheckCircle className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {loading ? '...' : stats.active_subscriptions}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.trial_subscriptions} on trial
                </p>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Monthly Revenue
                  <DollarSign className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {loading ? '...' : formatCurrency(stats.monthly_revenue)}
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Pending Approvals
                  <Clock className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {loading ? '...' : stats.pending_approvals}
                </div>
                {stats.pending_approvals > 0 && (
                  <Badge className="mt-2 bg-orange-100 text-orange-800">
                    Action Required
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Pending Payments */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Pending Payments
                  <AlertCircle className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {loading ? '...' : stats.pending_payments}
                </div>
              </CardContent>
            </Card>

            {/* Total Subscriptions */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Total Subscriptions
                  <CreditCard className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">
                  {loading ? '...' : stats.total_subscriptions}
                </div>
              </CardContent>
            </Card>

            {/* Growth Metric */}
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  Growth Rate
                  <TrendingUp className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-teal-600">
                  +12.5%
                </div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content with Tabs */}
        <Card className="shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b bg-muted/30">
              <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                  value="overview" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="plans" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Plans
                </TabsTrigger>
                <TabsTrigger 
                  value="subscriptions" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscriptions
                  {stats.pending_approvals > 0 && (
                    <Badge className="ml-2 bg-orange-500 text-white">{stats.pending_approvals}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="restaurants" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <Store className="h-4 w-4 mr-2" />
                  Restaurants
                </TabsTrigger>
                <TabsTrigger 
                  value="payments" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Payments
                  {stats.pending_payments > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white">{stats.pending_payments}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="rounded-none data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-4"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                  <p className="text-muted-foreground">
                    Quick overview of your platform statistics and pending actions.
                  </p>
                  
                  {/* Quick Actions */}
                  {(stats.pending_approvals > 0 || stats.pending_payments > 0) && (
                    <Card className="bg-orange-50 border-orange-200">
                      <CardHeader>
                        <CardTitle className="text-orange-900 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Action Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {stats.pending_approvals > 0 && (
                          <p className="text-sm text-orange-800">
                            • {stats.pending_approvals} subscription(s) pending approval
                          </p>
                        )}
                        {stats.pending_payments > 0 && (
                          <p className="text-sm text-orange-800">
                            • {stats.pending_payments} payment(s) pending verification
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans" className="mt-0">
                <AdminPlanFeatureControl />
              </TabsContent>

              {/* Subscriptions Tab */}
              <TabsContent value="subscriptions" className="mt-0">
                <AdminSubscriptionManagement onUpdate={loadDashboardStats} />
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="mt-0">
                <AdminUserManagement />
              </TabsContent>

              {/* Restaurants Tab */}
              <TabsContent value="restaurants" className="mt-0">
                <AdminRestaurantManagement />
              </TabsContent>

              {/* Payments Tab */}
              <TabsContent value="payments" className="mt-0">
                <AdminPaymentVerification onUpdate={loadDashboardStats} />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-0">
                <AdminAnalytics />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;
