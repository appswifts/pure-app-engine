import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, CheckCircle, XCircle, Clock, Store } from 'lucide-react';
import { updateSubscriptionAndActivateMenus } from '@/utils/subscriptionHelpers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  name?: string;
}

interface SubscriptionPackage {
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_restaurants: number | null;
  max_menu_items: number | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  package_name: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  billing_cycle: string | null;
  amount_paid: number | null;
  notes: string | null;
  restaurants_count: number;
  menu_items_count: number;
  user_email?: string;
  package?: SubscriptionPackage;
}

const UserSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<UserSubscription | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    user_id: '',
    package_name: '',
    status: 'active',
    started_at: new Date().toISOString().split('T')[0],
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_cycle: 'monthly',
    amount_paid: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load subscriptions with user info from restaurants table
      const { data: subsData, error: subsError } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          package:subscription_packages!user_subscriptions_package_name_fkey(
            name,
            max_restaurants,
            max_menu_items
          )
        `)
        .order('created_at', { ascending: false });

      if (subsError) throw subsError;

      // Get user emails from restaurants table (where we have access)
      const enrichedSubs = await Promise.all(
        (subsData || []).map(async (sub: any) => {
          // Try to get email from restaurants table
          const { data: restaurant } = await supabase
            .from('restaurants')
            .select('email, name')
            .eq('user_id', sub.user_id)
            .limit(1)
            .maybeSingle();
          
          // Debug logging for missing emails
          if (!restaurant?.email) {
            console.warn('🔍 Subscription found but no restaurant email:', {
              subscription_id: sub.id,
              user_id: sub.user_id,
              package_name: sub.package_name,
              status: sub.status
            });
          }
          
          return {
            ...sub,
            user_email: restaurant?.email || `No email (${sub.user_id.substring(0, 8)}...)`,
            restaurant_name: restaurant?.name || 'Unknown Restaurant'
          };
        })
      );

      setSubscriptions(enrichedSubs);

      // Debug logging for appswifts@gmail.com specifically
      const appswiftsSubscription = enrichedSubs.find(sub => 
        sub.user_email === 'appswifts@gmail.com' || 
        sub.user_email?.includes('appswifts')
      );
      
      if (appswiftsSubscription) {
        console.log('✅ Found appswifts@gmail.com subscription:', appswiftsSubscription);
      } else {
        console.warn('❌ appswifts@gmail.com subscription NOT found in admin list');
        console.log('📋 All subscriptions found:', enrichedSubs.map(s => ({
          email: s.user_email,
          package: s.package_name,
          status: s.status,
          user_id: s.user_id
        })));
      }

      // Load all unique users from restaurants table (for dropdown)
      const { data: restaurantsData, error: restsError } = await supabase
        .from('restaurants')
        .select('user_id, email')
        .order('created_at', { ascending: false });

      if (restsError) throw restsError;

      // Get unique users
      const uniqueUsers = new Map<string, User>();
      (restaurantsData || []).forEach((restaurant: any) => {
        if (!uniqueUsers.has(restaurant.user_id)) {
          uniqueUsers.set(restaurant.user_id, {
            id: restaurant.user_id,
            email: restaurant.email
          });
        }
      });

      setUsers(Array.from(uniqueUsers.values()));

      // Load active packages
      const { data: pkgsData, error: pkgsError } = await (supabase as any)
        .from('subscription_packages')
        .select('name, price_monthly, price_yearly, max_restaurants, max_menu_items')
        .eq('is_active', true)
        .order('sort_order');

      if (pkgsError) throw pkgsError;
      setPackages(pkgsData || []);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (sub?: UserSubscription) => {
    if (sub) {
      setEditingSubscription(sub);
      setFormData({
        user_id: sub.user_id,
        package_name: sub.package_name,
        status: sub.status,
        started_at: sub.started_at || '',
        expires_at: sub.expires_at || '',
        billing_cycle: sub.billing_cycle || 'monthly',
        amount_paid: sub.amount_paid?.toString() || '',
        notes: sub.notes || ''
      });
    } else {
      setEditingSubscription(null);
      setFormData({
        user_id: '',
        package_name: '',
        status: 'active',
        started_at: new Date().toISOString().split('T')[0],
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_cycle: 'monthly',
        amount_paid: '',
        notes: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.user_id) {
        throw new Error('Please select a user');
      }

      const subscriptionData = {
        user_id: formData.user_id,
        package_name: formData.package_name,
        status: formData.status,
        started_at: formData.started_at || null,
        expires_at: formData.expires_at || null,
        billing_cycle: formData.billing_cycle,
        amount_paid: formData.amount_paid ? parseFloat(formData.amount_paid) : null,
        notes: formData.notes || null
      };

      if (editingSubscription) {
        const { error } = await (supabase as any)
          .from('user_subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subscription updated successfully",
        });
      } else {
        const { error } = await (supabase as any)
          .from('user_subscriptions')
          .insert([subscriptionData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Subscription created successfully",
        });
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save subscription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the subscription for "${userEmail}"?`)) {
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('user_subscriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });

      loadData();
    } catch (error: any) {
      console.error('Error deleting subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subscription",
        variant: "destructive",
      });
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string, userEmail: string) => {
    const statusText = newStatus === 'active' ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${statusText} the subscription for "${userEmail}"?`)) {
      return;
    }

    try {
      // Get the subscription to find user_id
      const { data: subscriptionData, error: subFetchError } = await (supabase as any)
        .from('user_subscriptions')
        .select('user_id')
        .eq('id', id)
        .single();

      if (subFetchError) throw subFetchError;

      // Use our utility function to update subscription and activate restaurant menus
      const result = await updateSubscriptionAndActivateMenus(
        id,
        newStatus as 'active' | 'pending' | 'expired' | 'cancelled',
        subscriptionData.user_id
      );

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to update subscription');
      }

      loadData(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating subscription status:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${statusText} subscription`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
      suspended: 'bg-orange-100 text-orange-800'
    };
    return colors[status as keyof typeof colors] || colors.cancelled;
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const days = Math.floor((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          User Subscriptions
        </h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Subscriptions
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user subscription packages and feature access
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subscription
        </Button>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Subscriptions ({subscriptions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No subscriptions yet. Click "Add Subscription" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => {
                  const daysLeft = getDaysUntilExpiry(sub.expires_at);
                  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                  const maxRestaurants = sub.package?.max_restaurants;
                  const maxMenuItems = sub.package?.max_menu_items;

                  return (
                    <div key={sub.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(sub.status)}
                            <h3 className="font-semibold text-lg">
                              {sub.user_email}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(sub.status)}`}>
                              {sub.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <div className="text-muted-foreground">Package</div>
                              <div className="font-medium">{sub.package_name}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Started</div>
                              <div className="font-medium">
                                {sub.started_at ? new Date(sub.started_at).toLocaleDateString() : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Expires</div>
                              <div className={`font-medium ${isExpiringSoon ? 'text-orange-600' : ''}`}>
                                {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'Never'}
                                {daysLeft !== null && daysLeft > 0 && (
                                  <span className="text-xs ml-1">({daysLeft}d left)</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Billing</div>
                              <div className="font-medium capitalize">{sub.billing_cycle || 'N/A'}</div>
                            </div>
                          </div>

                          {/* Usage Stats */}
                          <div className="flex items-center gap-4 text-sm bg-muted/30 rounded p-2">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{sub.restaurants_count}</span>
                              <span className="text-muted-foreground">
                                / {maxRestaurants || '∞'} restaurants
                              </span>
                            </div>
                            {maxRestaurants && sub.restaurants_count >= maxRestaurants && (
                              <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                                Limit Reached
                              </span>
                            )}
                          </div>

                          {sub.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <strong>Notes:</strong> {sub.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {/* Quick Actions for Pending Subscriptions */}
                          {sub.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleStatusUpdate(sub.id, 'active', sub.user_email || 'user')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(sub.id, 'cancelled', sub.user_email || 'user')}
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {/* Standard Actions */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(sub)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(sub.id, sub.user_email || 'user')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
            </DialogTitle>
            <DialogDescription>
              {editingSubscription
                ? 'Update the subscription details'
                : 'Assign a subscription package to a user'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User Selection */}
            <div>
              <Label htmlFor="user_id">User (Restaurant Owner) *</Label>
              <Select
                value={formData.user_id}
                onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                disabled={!!editingSubscription}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select user by email. When subscription is activated, all their restaurants become public.
              </p>
            </div>

            {/* Package Selection */}
            <div>
              <Label htmlFor="package_name">Package *</Label>
              <Select
                value={formData.package_name}
                onValueChange={(value) => setFormData({ ...formData, package_name: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.name} value={pkg.name}>
                      {pkg.name} - {pkg.price_monthly.toLocaleString()} RWF/month
                      {pkg.max_restaurants && ` (${pkg.max_restaurants} restaurants)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Billing Cycle */}
              <div>
                <Label htmlFor="billing_cycle">Billing Cycle</Label>
                <Select
                  value={formData.billing_cycle}
                  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <Label htmlFor="started_at">Start Date</Label>
                <Input
                  id="started_at"
                  type="date"
                  value={formData.started_at}
                  onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
                />
              </div>

              {/* Expiry Date */}
              <div>
                <Label htmlFor="expires_at">Expiry Date</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>
            </div>

            {/* Amount Paid */}
            <div>
              <Label htmlFor="amount_paid">Amount Paid (RWF)</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                placeholder="15000"
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.user_id || !formData.package_name}>
                {loading ? 'Saving...' : editingSubscription ? 'Update Subscription' : 'Create Subscription'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSubscriptions;
