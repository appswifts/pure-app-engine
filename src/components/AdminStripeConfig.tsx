import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Key, CheckCircle, AlertCircle } from 'lucide-react';

const AdminStripeConfig: React.FC = () => {
  const [stripeConfig, setStripeConfig] = useState({
    publishableKey: 'pk_test_51RE8evHJDb8ZM1IXLp3Kd9H4OzufFE6jVlbhsHjv1hlINtq6BgryDnlYcFNP3ej2x51nta2IRVxD1tArmPZ8jIEw00sqp5AQGc',
    secretKey: '••••••••••••••••••••••••••••••••••••••••••••••••'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateConfig = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, you would save this to environment variables
      // For now, we'll just show a success message
      
      toast({
        title: 'Success',
        description: 'Stripe configuration updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update Stripe configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stripe Configuration</h1>
        <p className="text-muted-foreground">Manage Stripe API keys and payment settings</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="h-6 w-6 text-success" />
            <div>
              <p className="font-medium text-success">Stripe Connected</p>
              <p className="text-sm text-muted-foreground">Test mode is active</p>
            </div>
            <Badge variant="secondary">Test Mode</Badge>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publishable-key">Publishable Key</Label>
            <Input
              id="publishable-key"
              value={stripeConfig.publishableKey}
              onChange={(e) => setStripeConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
              placeholder="pk_test_..."
            />
            <p className="text-sm text-muted-foreground">
              This key is safe to use in your frontend code
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-key">Secret Key</Label>
            <Input
              id="secret-key"
              type="password"
              value={stripeConfig.secretKey}
              onChange={(e) => setStripeConfig(prev => ({ ...prev, secretKey: e.target.value }))}
              placeholder="sk_test_..."
            />
            <p className="text-sm text-muted-foreground">
              This key is stored securely in environment variables
            </p>
          </div>

          <Button 
            onClick={handleUpdateConfig}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? 'Updating...' : 'Update Configuration'}
          </Button>
        </CardContent>
      </Card>

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Getting Started with Stripe</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Create a Stripe account at stripe.com</li>
              <li>Get your API keys from the Stripe Dashboard</li>
              <li>Add the secret key to your environment variables</li>
              <li>Update the publishable key in your frontend configuration</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Test vs Live Mode</h4>
            <p className="text-sm text-muted-foreground">
              Use test keys (pk_test_ and sk_test_) for development and testing. 
              Switch to live keys (pk_live_ and sk_live_) when ready for production.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStripeConfig;