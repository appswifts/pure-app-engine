import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Key, CheckCircle, AlertCircle, Save, RefreshCw, Eye, EyeOff, TestTube } from 'lucide-react';
import { stripeService, StripeConfig } from '@/services/stripeService';

const AdminStripeConfig: React.FC = () => {
  const [config, setConfig] = useState<Partial<StripeConfig>>({
    environment: 'test',
    publishable_key: '',
    secret_key_encrypted: '',
    webhook_secret: '',
    is_active: false
  });
  const [secretKey, setSecretKey] = useState('');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const activeConfig = await stripeService.getActiveConfig();
      
      if (activeConfig) {
        setConfig({
          environment: activeConfig.environment,
          publishable_key: activeConfig.publishable_key,
          secret_key_encrypted: activeConfig.secret_key_encrypted,
          webhook_secret: activeConfig.webhook_secret,
          is_active: activeConfig.is_active
        });
        setIsConfigured(true);
        // Don't decrypt secret key for display - keep it masked
        setSecretKey('');
      } else {
        setIsConfigured(false);
      }
    } catch (error: any) {
      console.error('Error loading Stripe config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Stripe configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate configuration
      const validation = stripeService.validateConfig({
        ...config,
        secret_key_encrypted: secretKey || config.secret_key_encrypted
      });

      if (!validation.valid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.join(', '),
          variant: 'destructive'
        });
        return;
      }

      // Encrypt secret key if provided
      let encryptedKey = config.secret_key_encrypted;
      if (secretKey) {
        encryptedKey = stripeService.encryptSecretKey(secretKey);
      }

      await stripeService.saveConfig({
        environment: config.environment as 'test' | 'live',
        publishable_key: config.publishable_key!,
        secret_key_encrypted: encryptedKey!,
        webhook_secret: config.webhook_secret,
        is_active: config.is_active || false
      });

      toast({
        title: 'Success',
        description: 'Stripe configuration saved successfully',
      });

      // Reload to get fresh data
      await loadConfig();
      setSecretKey('');
    } catch (error: any) {
      console.error('Error saving Stripe config:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save Stripe configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      const result = await stripeService.testConnection();
      
      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to test Stripe connection',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          {isConfigured ? (
            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success" />
              <div className="flex-1">
                <p className="font-medium text-success">Stripe Connected</p>
                <p className="text-sm text-muted-foreground">
                  {config.environment === 'live' ? 'Live' : 'Test'} mode is active
                </p>
              </div>
              <Badge variant={config.environment === 'live' ? 'default' : 'secondary'}>
                {config.environment === 'live' ? 'Live Mode' : 'Test Mode'}
              </Badge>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Stripe is not configured. Please add your API keys below.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure your Stripe API keys and environment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Environment Selection */}
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select
              value={config.environment}
              onValueChange={(value: 'test' | 'live') => setConfig({ ...config, environment: value })}
            >
              <SelectTrigger id="environment">
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Test (Development)</SelectItem>
                <SelectItem value="live">Live (Production)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Use test mode for development, live mode for production
            </p>
          </div>

          {/* Publishable Key */}
          <div className="space-y-2">
            <Label htmlFor="publishable-key">Publishable Key</Label>
            <Input
              id="publishable-key"
              value={config.publishable_key}
              onChange={(e) => setConfig({ ...config, publishable_key: e.target.value })}
              placeholder={config.environment === 'live' ? 'pk_live_...' : 'pk_test_...'}
            />
            <p className="text-sm text-muted-foreground">
              This key is safe to use in your frontend code
            </p>
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret-key">
              Secret Key {isConfigured && '(leave empty to keep current)'}
            </Label>
            <div className="relative">
              <Input
                id="secret-key"
                type={showSecretKey ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder={
                  isConfigured 
                    ? '••••••••••••••••••••' 
                    : (config.environment === 'live' ? 'sk_live_...' : 'sk_test_...')
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowSecretKey(!showSecretKey)}
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This key is encrypted and stored securely in the database
            </p>
          </div>

          {/* Webhook Secret (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
            <Input
              id="webhook-secret"
              type="password"
              value={config.webhook_secret}
              onChange={(e) => setConfig({ ...config, webhook_secret: e.target.value })}
              placeholder="whsec_..."
            />
            <p className="text-sm text-muted-foreground">
              Required for webhook signature verification
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleSave}
              disabled={saving || !config.publishable_key || (!secretKey && !isConfigured)}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : isConfigured ? 'Update Configuration' : 'Save Configuration'}
            </Button>
            
            {isConfigured && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={testing}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
            )}
          </div>
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
              <li>Create a Stripe account at <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">stripe.com</a></li>
              <li>Get your API keys from the Stripe Dashboard → Developers → API keys</li>
              <li>Select the environment (test or live) above</li>
              <li>Paste your publishable and secret keys</li>
              <li>Click "Save Configuration" to store securely</li>
            </ol>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Test vs Live Mode</h4>
            <p className="text-sm text-muted-foreground">
              <strong>Test Mode:</strong> Use test keys (pk_test_ and sk_test_) for development and testing. 
              Test payments won't charge real money.<br/>
              <strong>Live Mode:</strong> Use live keys (pk_live_ and sk_live_) for production. 
              These will process real payments.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your secret key is encrypted before storage. 
              Never share your secret keys or commit them to version control.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStripeConfig;