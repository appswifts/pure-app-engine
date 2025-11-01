import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import errorHandler from '@/services/errorHandlingService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Banknote, 
  Settings, 
  Save, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { z } from 'zod';

// Validation schema
const paymentConfigSchema = z.object({
  bankName: z.string().min(3, 'Bank name must be at least 3 characters').max(100, 'Bank name too long').optional().or(z.literal('')),
  bankAccountNumber: z.string()
    .regex(/^[0-9]{10,20}$/, 'Account number must be 10-20 digits')
    .optional().or(z.literal('')),
  bankAccountName: z.string().min(3, 'Account name must be at least 3 characters').max(100, 'Account name too long').optional().or(z.literal('')),
  mobileMoneyNumber: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format (10-15 digits, optional +)')
    .optional().or(z.literal('')),
  mobileMoneyProvider: z.string().min(2, 'Provider name must be at least 2 characters').optional().or(z.literal('')),
  paymentInstructions: z.string().max(1000, 'Instructions too long (max 1000 characters)').optional().or(z.literal(''))
});

const AdminPaymentConfig = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    mobileMoneyProvider: '',
    mobileMoneyNumber: '',
    paymentInstructions: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('manual_payment_config')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig({
          enabled: data.enabled || false,
          bankName: data.bank_name || '',
          bankAccountNumber: data.bank_account_number || '',
          bankAccountName: data.bank_account_name || '',
          mobileMoneyProvider: data.mobile_money_provider || '',
          mobileMoneyNumber: data.mobile_money_number || '',
          paymentInstructions: data.payment_instructions || ''
        });
      }
    } catch (error) {
      const message = errorHandler.handleApiError(error, 'load payment configuration');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate configuration
      const validationResult = paymentConfigSchema.safeParse(config);
      
      if (!validationResult.success) {
        const errors = validationResult.error.errors.map(err => err.message).join(', ');
        toast({
          title: 'Validation Error',
          description: errors,
          variant: 'destructive',
        });
        return;
      }

      // Check if config exists
      const { data: existingConfig } = await supabase
        .from('manual_payment_config')
        .select('id')
        .single();
      
      const configData = {
        enabled: config.enabled,
        bank_name: config.bankName,
        bank_account_number: config.bankAccountNumber,
        bank_account_name: config.bankAccountName,
        mobile_money_provider: config.mobileMoneyProvider,
        mobile_money_number: config.mobileMoneyNumber,
        payment_instructions: config.paymentInstructions,
      };
      
      let error;
      if (existingConfig) {
        // Update existing config
        const result = await supabase
          .from('manual_payment_config')
          .update(configData)
          .eq('id', existingConfig.id);
        error = result.error;
      } else {
        // Insert new config
        const result = await supabase
          .from('manual_payment_config')
          .insert([configData]);
        error = result.error;
      }
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Payment configuration saved successfully',
      });
    } catch (error) {
      const message = errorHandler.handleApiError(error, 'save payment configuration');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Settings className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Configuration</h2>
        <p className="text-muted-foreground">
          Configure manual payment methods for restaurant subscriptions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Manual Payment Configuration
          </CardTitle>
          <CardDescription>
            Configure bank and mobile money payment details for manual payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
              <Label>Enable Manual Payments</Label>
            </div>
            <div className="flex items-center gap-2">
              {config.enabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={config.bankName}
                  onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
                  placeholder="Bank of Kigali"
                />
              </div>

              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={config.bankAccountName}
                  onChange={(e) => setConfig({ ...config, bankAccountName: e.target.value })}
                  placeholder="MenuForest Ltd"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                value={config.bankAccountNumber}
                onChange={(e) => setConfig({ ...config, bankAccountNumber: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mobile_provider">Mobile Money Provider</Label>
                <Input
                  id="mobile_provider"
                  value={config.mobileMoneyProvider}
                  onChange={(e) => setConfig({ ...config, mobileMoneyProvider: e.target.value })}
                  placeholder="MTN Mobile Money"
                />
              </div>

              <div>
                <Label htmlFor="mobile_number">Mobile Money Number</Label>
                <Input
                  id="mobile_number"
                  value={config.mobileMoneyNumber}
                  onChange={(e) => setConfig({ ...config, mobileMoneyNumber: e.target.value })}
                  placeholder="+250788123456"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Payment Instructions</Label>
              <Textarea
                id="instructions"
                value={config.paymentInstructions}
                onChange={(e) => setConfig({ ...config, paymentInstructions: e.target.value })}
                placeholder="Instructions for customers on how to complete manual payments..."
                rows={4}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>

          {config.enabled && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Manual payments are enabled. Restaurants will see these payment details when subscribing.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentConfig;