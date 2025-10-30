import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageCircle, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Smartphone,
  RefreshCw,
  Play
} from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  whatsapp_number: string;
  subscription_end_date?: string;
  subscription_status?: string;
}

interface NotificationHistory {
  id: string;
  restaurant_id: string;
  phone_number: string;
  message_type: string;
  status: string;
  sent_at: string;
  restaurants: { name: string };
}

export const WhatsAppNotificationManager = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('subscription_expiry_warning');
  const [loading, setLoading] = useState(false);
  const [checkingExpiry, setCheckingExpiry] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurants();
    loadNotificationHistory();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, whatsapp_number, subscription_end_date, subscription_status')
        .not('whatsapp_number', 'is', null)
        .neq('whatsapp_number', '');

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load restaurants',
        variant: 'destructive',
      });
    }
  };

  const loadNotificationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_notifications')
        .select(`
          id, 
          restaurant_id, 
          phone_number, 
          message_type, 
          status, 
          sent_at,
          restaurants:restaurant_id(name)
        `)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotificationHistory(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification history',
        variant: 'destructive',
      });
    }
  };

  const sendManualNotification = async () => {
    if (!selectedRestaurant) {
      toast({
        title: 'Error',
        description: 'Please select a restaurant',
        variant: 'destructive',
      });
      return;
    }

    const restaurant = restaurants.find(r => r.id === selectedRestaurant);
    if (!restaurant) {
      toast({
        title: 'Error',
        description: 'Restaurant not found',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      let additionalData = {};
      if (messageType === 'subscription_expiry_warning' && restaurant.subscription_end_date) {
        const daysRemaining = Math.ceil(
          (new Date(restaurant.subscription_end_date).getTime() - new Date().getTime()) / 
          (1000 * 60 * 60 * 24)
        );
        additionalData = { days_remaining: Math.max(0, daysRemaining) };
      }

      const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
        body: {
          phone_number: restaurant.whatsapp_number,
          restaurant_name: restaurant.name,
          message_type: messageType,
          ...additionalData
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `WhatsApp notification sent to ${restaurant.name}`,
      });

      // Refresh notification history
      loadNotificationHistory();

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send WhatsApp notification',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const runExpiryCheck = async () => {
    try {
      setCheckingExpiry(true);

      const { data, error } = await supabase.functions.invoke('check-subscription-expiry');

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Expiry check completed. ${data?.notifications_sent || 0} notifications sent.`,
      });

      // Refresh notification history
      loadNotificationHistory();

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run expiry check',
        variant: 'destructive',
      });
    } finally {
      setCheckingExpiry(false);
    }
  };

  const getMessageTypeDisplay = (type: string) => {
    switch (type) {
      case 'subscription_expiry_warning':
        return { label: 'Expiry Warning', color: 'bg-yellow-500' };
      case 'subscription_expired':
        return { label: 'Subscription Expired', color: 'bg-red-500' };
      case 'payment_reminder':
        return { label: 'Payment Reminder', color: 'bg-blue-500' };
      default:
        return { label: type, color: 'bg-gray-500' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">WhatsApp Notification Manager</h2>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notificationHistory.filter(n => 
                new Date(n.sent_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Check Status</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600 font-medium">Daily at 9:00 AM</div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Notification Sender */}
      <Card>
        <CardHeader>
          <CardTitle>Send Manual Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Restaurant</label>
              <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose restaurant..." />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map(restaurant => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name} ({restaurant.whatsapp_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <Select value={messageType} onValueChange={setMessageType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription_expiry_warning">Expiry Warning</SelectItem>
                  <SelectItem value="subscription_expired">Subscription Expired</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={sendManualNotification} 
              disabled={loading || !selectedRestaurant}
              className="flex-1"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>

            <Button 
              onClick={runExpiryCheck} 
              disabled={checkingExpiry}
              variant="outline"
            >
              {checkingExpiry ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Expiry Check
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Notifications</CardTitle>
          <Button variant="outline" size="sm" onClick={loadNotificationHistory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {notificationHistory.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationHistory.map((notification) => {
                const messageType = getMessageTypeDisplay(notification.message_type);
                return (
                  <div 
                    key={notification.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(notification.status)}
                      <div>
                        <div className="font-medium">
                          {notification.restaurants?.name || 'Unknown Restaurant'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {notification.phone_number}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge 
                        variant="secondary" 
                        className={`${messageType.color} text-white mb-1`}
                      >
                        {messageType.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleDateString()} {' '}
                        {new Date(notification.sent_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppNotificationManager;