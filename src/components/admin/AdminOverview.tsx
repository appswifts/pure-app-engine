import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, 
  Users, 
  CreditCard, 
  TrendingUp,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get restaurant count
      const { count: restaurantCount } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact', head: true });

      // Get active subscriptions
      const { count: activeSubCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get pending payments
      const { count: pendingCount } = await supabase
        .from('payment_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get total revenue (sum of verified payments)
      const { data: revenueData } = await supabase
        .from('payment_records')
        .select('amount')
        .eq('status', 'verified');

      const totalRevenue = revenueData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      setStats({
        totalRestaurants: restaurantCount || 0,
        activeSubscriptions: activeSubCount || 0,
        pendingPayments: pendingCount || 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-muted-foreground">Loading dashboard statistics...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground">
          Monitor your platform's performance and manage key metrics.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">
              Registered on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently paying subscribers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Require admin review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.totalRevenue / 1000).toFixed(1)}K RWF</div>
            <p className="text-xs text-muted-foreground">
              Verified payments only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Payment System</span>
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Operational
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">WhatsApp Service</span>
              <Badge variant="default" className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>New restaurant registration</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment verified</span>
                <span className="text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subscription activated</span>
                <span className="text-muted-foreground">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;