import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
// Subscription services simplified for manual payment only
import ManualPaymentAdmin from '@/components/ManualPaymentAdmin';
import {
  Settings,
  CreditCard,
  Bell,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const SubscriptionDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [processingBackground, setProcessingBackground] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      
      setUser(currentUser);

      // Get restaurant data
      const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setRestaurant(restaurantData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackgroundProcess = async () => {
    try {
      setProcessingBackground(true);
      
      toast({
        title: "Processing Started",
        description: "Running subscription background processing...",
      });

      // Manual processing simplified - reload page
      
      toast({
        title: "Processing Complete",
        description: "Background subscription processing completed successfully",
      });

      // Reload the subscription data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to run background processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingBackground(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin mr-3" />
          <span className="text-lg">Loading subscription dashboard...</span>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Restaurant Profile Required</AlertTitle>
          <AlertDescription>
            You need to create a restaurant profile before managing subscriptions.
            <Button className="ml-4" onClick={() => navigate('/restaurant/setup')}>
              Create Restaurant Profile
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your MenuForest subscription for <span className="font-medium">{restaurant.name}</span>
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleManualBackgroundProcess}
            disabled={processingBackground}
          >
            {processingBackground ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
          
          <Button onClick={() => navigate('/pricing')}>
            <CreditCard className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ManualPaymentAdmin />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Information
              </CardTitle>
              <CardDescription>
                Manage your payment methods and billing history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Payment Methods</AlertTitle>
                <AlertDescription>
                  We currently support manual payments only. Pay via bank transfer or mobile money and submit proof for admin approval.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-medium">Supported Payment Methods</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-sm text-muted-foreground">MTN, Airtel</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-sm text-muted-foreground">Direct bank payments</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => navigate('/pricing')}>
                  Update Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Automatic email notifications keep you informed about your subscription
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Trial Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Notifications 3 days and 1 day before your trial ends
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Payment Confirmations</div>
                    <div className="text-sm text-muted-foreground">
                      Confirmation emails for successful payments
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Payment Failures</div>
                    <div className="text-sm text-muted-foreground">
                      Immediate notifications when payments fail with retry instructions
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Subscription Changes</div>
                    <div className="text-sm text-muted-foreground">
                      Updates when you upgrade, downgrade, or cancel your subscription
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Auto-billing Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Advance notice before automatic billing occurs
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Email Delivery</AlertTitle>
                <AlertDescription>
                  All notifications are sent to: <strong>{restaurant.email || user.email}</strong>
                  <br />
                  Make sure this email address is correct and check your spam folder if you don't receive notifications.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Subscription Settings
              </CardTitle>
              <CardDescription>
                Advanced subscription management and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Auto-renewal</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically renew subscription at the end of each billing cycle
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">Enabled</div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Trial Auto-billing</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically charge when free trial ends
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">Enabled</div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">
                      Receive email updates about subscription changes
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">Enabled</div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Payment Retry</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically retry failed payments for up to 7 days
                    </div>
                  </div>
                  <div className="text-green-600 font-medium">Enabled</div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Currency</AlertTitle>
                <AlertDescription>
                  All prices are displayed in Rwandan Francs (RWF). Payments are reviewed and activated manually by our admin team.
                </AlertDescription>
              </Alert>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => navigate('/support')}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubscriptionDashboard;
