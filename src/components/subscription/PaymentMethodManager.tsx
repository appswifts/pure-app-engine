import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Building2
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'mobile_money';
  last_four?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  phone_number?: string;
  account_number?: string;
  is_default: boolean;
  created_at: string;
}

export const PaymentMethodManager: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [methodType, setMethodType] = useState<'card' | 'bank' | 'mobile_money'>('card');
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get payment methods from database
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove default from all methods
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set new default
      await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', methodId);

      toast({
        title: 'Success',
        description: 'Default payment method updated',
      });

      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update default payment method',
        variant: 'destructive',
      });
    }
  };

  const deleteMethod = async (methodId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment method removed',
      });

      loadPaymentMethods();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to remove payment method',
        variant: 'destructive',
      });
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'mobile_money':
        return <Smartphone className="h-5 w-5" />;
      case 'bank':
        return <Building2 className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    switch (method.type) {
      case 'card':
        return `${method.brand || 'Card'} •••• ${method.last_four || '****'}`;
      case 'mobile_money':
        return `Mobile Money ${method.phone_number || ''}`;
      case 'bank':
        return `Bank •••• ${method.last_four || '****'}`;
      default:
        return 'Payment Method';
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your payment methods for subscriptions</CardDescription>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Method
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Payment method management will be available once you configure your payment provider (Stripe, etc.)
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Payment Method Type</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={methodType}
                    onChange={(e) => setMethodType(e.target.value as any)}
                  >
                    <option value="card">Credit/Debit Card</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                {methodType === 'card' && (
                  <>
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input type="text" placeholder="1234 5678 9012 3456" disabled />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input type="text" placeholder="MM/YY" disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input type="text" placeholder="123" disabled />
                      </div>
                    </div>
                  </>
                )}

                {methodType === 'mobile_money' && (
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+250 788 123 456" disabled />
                  </div>
                )}

                {methodType === 'bank' && (
                  <>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input type="text" placeholder="Account number" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input type="text" placeholder="Bank name" disabled />
                    </div>
                  </>
                )}

                <Button className="w-full" disabled>
                  Save Payment Method (Coming Soon)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No payment methods added yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getMethodIcon(method.type)}
                  <div>
                    <div className="font-medium">{getMethodDisplay(method)}</div>
                    {method.exp_month && method.exp_year && (
                      <div className="text-sm text-muted-foreground">
                        Expires {method.exp_month}/{method.exp_year}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.is_default ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMethod(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMethod(method.id)}
                    disabled={method.is_default}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Alert className="mt-4 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Payment methods are securely stored and encrypted. We never store your full card details.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodManager;
