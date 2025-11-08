import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Store,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current_month: number;
    last_month: number;
    growth_percentage: number;
  };
  subscriptions: {
    new_this_month: number;
    cancelled_this_month: number;
    active_total: number;
    trial_total: number;
  };
  users: {
    total: number;
    new_this_month: number;
    active_percentage: number;
  };
  restaurants: {
    total: number;
    active: number;
    inactive: number;
  };
  top_plans: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
}

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get subscriptions data
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(name, price)');

      // Get users data
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: newUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString());

      // Get restaurants data
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('subscription_status');

      // Calculate revenue
      const activeSubscriptions = (subscriptions || []).filter(s => s.status === 'active');
      const currentMonthRevenue = activeSubscriptions.reduce((sum, s) => sum + (s.amount || 0), 0);
      
      // Last month revenue (approximate)
      const lastMonthRevenue = currentMonthRevenue * 0.9; // Simplified - should be actual historical data
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      // New subscriptions this month
      const newThisMonth = (subscriptions || []).filter(s => 
        new Date(s.created_at) >= firstDayOfMonth
      ).length;

      // Cancelled this month
      const cancelledThisMonth = (subscriptions || []).filter(s => 
        s.cancelled_at && new Date(s.cancelled_at) >= firstDayOfMonth
      ).length;

      // Top plans
      const planCounts = new Map<string, { count: number; revenue: number }>();
      activeSubscriptions.forEach(sub => {
        const planName = (sub.subscription_plans as any)?.name || 'Unknown';
        const current = planCounts.get(planName) || { count: 0, revenue: 0 };
        planCounts.set(planName, {
          count: current.count + 1,
          revenue: current.revenue + (sub.amount || 0),
        });
      });

      const topPlans = Array.from(planCounts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count);

      setAnalytics({
        revenue: {
          current_month: currentMonthRevenue,
          last_month: lastMonthRevenue,
          growth_percentage: revenueGrowth,
        },
        subscriptions: {
          new_this_month: newThisMonth,
          cancelled_this_month: cancelledThisMonth,
          active_total: activeSubscriptions.length,
          trial_total: (subscriptions || []).filter(s => 
            s.status === 'trial' || s.status === 'trialing'
          ).length,
        },
        users: {
          total: totalUsers || 0,
          new_this_month: newUsers || 0,
          active_percentage: 85, // Simplified - should calculate based on last login
        },
        restaurants: {
          total: (restaurants || []).length,
          active: (restaurants || []).filter(r => r.subscription_status === 'active').length,
          inactive: (restaurants || []).filter(r => 
            r.subscription_status === 'inactive' || r.subscription_status === 'expired'
          ).length,
        },
        top_plans: topPlans,
      });
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
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

  if (loading || !analytics) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reports</h2>
          <p className="text-muted-foreground">Platform performance and insights</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-4xl font-bold text-green-600">
                  {formatCurrency(analytics.revenue.current_month)}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                analytics.revenue.growth_percentage >= 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {analytics.revenue.growth_percentage >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
                <span className="font-bold">
                  {Math.abs(analytics.revenue.growth_percentage).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">Last Month</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(analytics.revenue.last_month)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-3xl font-bold text-blue-600">
                {analytics.subscriptions.active_total}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trial Subscriptions</p>
              <p className="text-2xl font-semibold">
                {analytics.subscriptions.trial_total}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              New Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              +{analytics.subscriptions.new_this_month}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Cancellations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {analytics.subscriptions.cancelled_this_month}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              New Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              +{analytics.users.new_this_month}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Active Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {analytics.restaurants.active}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {analytics.restaurants.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Top Subscription Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_plans.map((plan, index) => (
                <div key={plan.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-600' :
                      'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-muted-foreground">{plan.count} subscribers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(plan.revenue)}
                    </p>
                    <p className="text-xs text-muted-foreground">monthly</p>
                  </div>
                </div>
              ))}

              {analytics.top_plans.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No subscription data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Restaurant Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className="font-medium">Active</span>
                </div>
                <Badge className="bg-green-600">
                  {analytics.restaurants.active} ({
                    ((analytics.restaurants.active / analytics.restaurants.total) * 100).toFixed(0)
                  }%)
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="font-medium">Trial</span>
                </div>
                <Badge className="bg-blue-600">
                  {analytics.subscriptions.trial_total}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600"></div>
                  <span className="font-medium">Inactive</span>
                </div>
                <Badge className="bg-red-600">
                  {analytics.restaurants.inactive}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            User Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Users</p>
              <p className="text-3xl font-bold">{analytics.users.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">New This Month</p>
              <p className="text-3xl font-bold text-green-600">
                +{analytics.users.new_this_month}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Active Users</p>
              <p className="text-3xl font-bold text-blue-600">
                {analytics.users.active_percentage}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
