import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  CreditCard,
  Mail,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'trial_expiring' | 'subscription_expiring' | 'payment_failed' | 'grace_period' | 'subscription_renewed';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  action_required: boolean;
  action_url?: string;
  created_at: string;
}

interface SubscriptionStatus {
  days_until_expiry: number;
  is_trial: boolean;
  status: string;
  has_payment_issues: boolean;
}

export const SubscriptionNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    checkSubscriptionStatus();
    
    // Check every hour for new notifications
    const interval = setInterval(() => {
      checkSubscriptionStatus();
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load notifications from database
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'subscription')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.length > 0) {
        const transformedNotifications: Notification[] = data.map(n => ({
          id: n.id,
          type: n.type || 'subscription_expiring',
          title: n.title,
          message: n.message,
          severity: n.severity || 'info',
          read: n.read || false,
          action_required: n.action_required || false,
          action_url: n.action_url,
          created_at: n.created_at,
        }));
        setNotifications(transformedNotifications);
      }
    } catch (error: any) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!restaurant) return;

      // Get subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscription) return;

      const isTrial = subscription.status === 'trial' || subscription.status === 'trialing';
      const endDate = isTrial ? subscription.trial_end : subscription.current_period_end;
      
      if (!endDate) return;

      const now = new Date();
      const end = new Date(endDate);
      const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const status: SubscriptionStatus = {
        days_until_expiry: daysUntilExpiry,
        is_trial: isTrial,
        status: subscription.status,
        has_payment_issues: subscription.status === 'past_due',
      };

      setSubscriptionStatus(status);

      // Auto-generate notifications based on status
      await generateAutoNotifications(status, restaurant.id);
    } catch (error: any) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const generateAutoNotifications = async (status: SubscriptionStatus, restaurantId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const notificationsToCreate: any[] = [];

    // Check if notification already exists for this day
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('category', 'subscription')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    if (existingNotifs && existingNotifs.length > 0) return; // Already notified today

    // 14 days warning
    if (status.days_until_expiry === 14) {
      notificationsToCreate.push({
        user_id: user.id,
        category: 'subscription',
        type: status.is_trial ? 'trial_expiring' : 'subscription_expiring',
        title: status.is_trial ? 'Trial Ending Soon' : 'Subscription Renewal Coming Up',
        message: `Your ${status.is_trial ? 'trial' : 'subscription'} expires in 14 days. ${status.is_trial ? 'Choose a plan to continue.' : 'Your payment method will be charged automatically.'}`,
        severity: 'info',
        action_required: status.is_trial,
        read: false,
      });
    }

    // 7 days warning
    if (status.days_until_expiry === 7) {
      notificationsToCreate.push({
        user_id: user.id,
        category: 'subscription',
        type: status.is_trial ? 'trial_expiring' : 'subscription_expiring',
        title: status.is_trial ? 'Trial Ending in 1 Week' : 'Subscription Renewal in 1 Week',
        message: `Your ${status.is_trial ? 'trial' : 'subscription'} expires in 7 days. ${status.is_trial ? 'Please select a plan to avoid service interruption.' : 'Ensure your payment method is up to date.'}`,
        severity: 'warning',
        action_required: status.is_trial,
        read: false,
      });
    }

    // 3 days critical warning
    if (status.days_until_expiry === 3) {
      notificationsToCreate.push({
        user_id: user.id,
        category: 'subscription',
        type: status.is_trial ? 'trial_expiring' : 'subscription_expiring',
        title: 'Urgent: Expiring Soon!',
        message: `Your ${status.is_trial ? 'trial' : 'subscription'} expires in just 3 days! ${status.is_trial ? 'Subscribe now to keep your account active.' : 'We will charge your payment method soon.'}`,
        severity: 'error',
        action_required: true,
        read: false,
      });
    }

    // 1 day final warning
    if (status.days_until_expiry === 1) {
      notificationsToCreate.push({
        user_id: user.id,
        category: 'subscription',
        type: status.is_trial ? 'trial_expiring' : 'subscription_expiring',
        title: 'Last Day!',
        message: `This is your last day! Your ${status.is_trial ? 'trial' : 'subscription'} expires tomorrow. ${status.is_trial ? 'Take action now!' : 'Payment will be processed tomorrow.'}`,
        severity: 'error',
        action_required: true,
        read: false,
      });
    }

    // Payment issues
    if (status.has_payment_issues) {
      notificationsToCreate.push({
        user_id: user.id,
        category: 'subscription',
        type: 'payment_failed',
        title: 'Payment Failed',
        message: 'Your recent payment failed. Please update your payment method to avoid service interruption.',
        severity: 'error',
        action_required: true,
        read: false,
      });
    }

    // Insert notifications
    if (notificationsToCreate.length > 0) {
      await supabase.from('notifications').insert(notificationsToCreate);
      loadNotifications();
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <Bell className="h-5 w-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      case 'success':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                notifications.forEach(n => {
                  if (!n.read) markAsRead(n.id);
                });
              }}
            >
              Mark all as read
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Active Alerts */}
        {subscriptionStatus && subscriptionStatus.days_until_expiry <= 7 && subscriptionStatus.days_until_expiry > 0 && (
          <Alert className={`mb-4 ${subscriptionStatus.days_until_expiry <= 3 ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
            <AlertTriangle className={`h-4 w-4 ${subscriptionStatus.days_until_expiry <= 3 ? 'text-red-600' : 'text-orange-600'}`} />
            <AlertDescription className={subscriptionStatus.days_until_expiry <= 3 ? 'text-red-800' : 'text-orange-800'}>
              <strong>Attention Required!</strong> Your {subscriptionStatus.is_trial ? 'trial' : 'subscription'} expires in <strong>{subscriptionStatus.days_until_expiry} day{subscriptionStatus.days_until_expiry !== 1 ? 's' : ''}</strong>.
              {subscriptionStatus.is_trial && ' Choose a plan to continue using our service.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Notification List */}
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-2">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${getSeverityColor(notification.severity)} ${
                  !notification.read ? 'border-l-4' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 flex-1">
                    {getSeverityIcon(notification.severity)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${!notification.read ? 'font-bold' : ''}`}>
                          {notification.title}
                        </h4>
                        {notification.action_required && (
                          <Badge variant="destructive" className="text-xs">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Email Notification Settings */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email Notifications</span>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            We'll send you email reminders about your subscription status
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionNotifications;
