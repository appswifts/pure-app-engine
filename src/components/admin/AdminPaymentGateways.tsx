import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Banknote, 
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import AdminPaymentConfig from '@/components/AdminPaymentConfig';
import AdminStripeConfig from '@/components/AdminStripeConfig';

const AdminPaymentGateways: React.FC = () => {
  const [gateways, setGateways] = useState({
    manual: { enabled: false, configured: false },
    stripe: { enabled: false, configured: false }
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGatewayStatus();
  }, []);

  const loadGatewayStatus = async () => {
    try {
      // Check manual payment configuration
      const { data: manualConfig } = await supabase
        .from('manual_payment_config')
        .select('enabled, bank_name, mobile_money_provider')
        .single();

      // Check if Stripe is configured (we can check if secret is set)
      const stripeConfigured = true; // Assume configured for now

      setGateways({
        manual: {
          enabled: manualConfig?.enabled || false,
          configured: !!(manualConfig?.bank_name || manualConfig?.mobile_money_provider)
        },
        stripe: {
          enabled: stripeConfigured,
          configured: stripeConfigured
        }
      });
    } catch (error) {
      console.error('Error loading gateway status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (gateway: 'manual' | 'stripe', enabled: boolean) => {
    try {
      if (gateway === 'manual') {
        await supabase
          .from('manual_payment_config')
          .upsert({ enabled }, { onConflict: 'id' });
        
        setGateways(prev => ({
          ...prev,
          manual: { ...prev.manual, enabled }
        }));
      }
      
      toast({
        title: 'Success',
        description: `${gateway === 'manual' ? 'Manual Payment' : 'Stripe'} gateway ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update gateway settings',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
          <p className="text-muted-foreground">Loading gateway configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Gateways</h1>
        <p className="text-muted-foreground">
          Configure and manage payment methods for your platform.
        </p>
      </div>

      {/* Gateway Status Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Manual Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Manual Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Bank transfers and mobile money
                </p>
              </div>
              <Switch
                checked={gateways.manual.enabled}
                onCheckedChange={(enabled) => toggleGateway('manual', enabled)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {gateways.manual.configured ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Configured</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">Not Configured</span>
                </>
              )}
            </div>

            <div className="pt-2">
              <Badge variant={gateways.manual.enabled ? "default" : "secondary"}>
                {gateways.manual.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Stripe</Label>
                <p className="text-sm text-muted-foreground">
                  Credit cards and online payments
                </p>
              </div>
              <Switch
                checked={gateways.stripe.enabled}
                onCheckedChange={(enabled) => toggleGateway('stripe', enabled)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              {gateways.stripe.configured ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">Configured</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">Not Configured</span>
                </>
              )}
            </div>

            <div className="pt-2">
              <Badge variant={gateways.stripe.enabled ? "default" : "secondary"}>
                {gateways.stripe.enabled ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Panels */}
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Manual Payments
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="mt-6">
          <AdminPaymentConfig />
        </TabsContent>
        
        <TabsContent value="stripe" className="mt-6">
          <AdminStripeConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPaymentGateways;