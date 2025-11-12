import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  CheckCircle, 
  CreditCard, 
  Phone, 
  Building, 
  Hash,
  Clock,
  AlertCircle
} from 'lucide-react';

interface SubscriptionPackage {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
}

interface PaymentDetails {
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  mobile_money_number?: string;
  mobile_money_provider?: string;
  payment_instructions?: string;
}

interface SubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  package: SubscriptionPackage | null;
  billingCycle: 'monthly' | 'yearly';
}

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({
  isOpen,
  onClose,
  package: selectedPackage,
  billingCycle
}) => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({});
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedPackage) {
      generateReferenceNumber();
      loadPaymentDetails();
    }
  }, [isOpen, selectedPackage]);

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const packageCode = selectedPackage?.name.substring(0, 3).toUpperCase() || 'SUB';
    setReferenceNumber(`${packageCode}-${timestamp}-${random}`);
  };

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      
      // Load payment details from admin settings
      const { data, error } = await (supabase as any)
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'payment_bank_name',
          'payment_account_number', 
          'payment_account_name',
          'payment_mobile_money_number',
          'payment_mobile_money_provider',
          'payment_instructions'
        ]);

      if (error) throw error;

      const settings: PaymentDetails = {};
      (data || []).forEach((setting: any) => {
        const key = setting.setting_key.replace('payment_', '') as keyof PaymentDetails;
        settings[key] = setting.setting_value;
      });

      setPaymentDetails(settings);

    } catch (error: any) {
      console.error('Error loading payment details:', error);
      // Set default payment details if admin hasn't configured them
      setPaymentDetails({
        bank_name: 'Bank of Kigali',
        account_number: '000-123-456789',
        account_name: 'Pure App Engine Ltd',
        mobile_money_number: '+250 788 123 456',
        mobile_money_provider: 'MTN Mobile Money',
        payment_instructions: 'Please use the reference number when making payment and contact support with payment confirmation.'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const handleSubscriptionRequest = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create a pending subscription request
      const { error } = await (supabase as any)
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          package_name: selectedPackage?.name,
          status: 'pending',
          billing_cycle: billingCycle,
          amount_paid: billingCycle === 'monthly' ? selectedPackage?.price_monthly : selectedPackage?.price_yearly,
          notes: `Payment reference: ${referenceNumber}. Awaiting manual payment confirmation.`,
          started_at: new Date().toISOString(),
          expires_at: billingCycle === 'monthly' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Subscription Request Submitted!",
        description: `Your ${selectedPackage?.name} subscription request has been submitted with reference ${referenceNumber}. Please make payment and contact support.`,
      });

      onClose();

    } catch (error: any) {
      console.error('Error creating subscription request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit subscription request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPackage) return null;

  const amount = billingCycle === 'monthly' ? selectedPackage.price_monthly : selectedPackage.price_yearly;
  const period = billingCycle === 'monthly' ? 'month' : 'year';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscribe to {selectedPackage.name} Plan
          </DialogTitle>
          <DialogDescription>
            Complete your subscription with manual payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscription Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Plan:</span>
                <Badge variant="secondary">{selectedPackage.name}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Billing:</span>
                <span className="font-medium">{billingCycle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Amount:</span>
                <span className="text-xl font-bold">
                  {amount.toLocaleString()} {selectedPackage.currency}/{period}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reference Number:</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {referenceNumber}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(referenceNumber, 'Reference Number')}
                  >
                    {copied === 'Reference Number' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bank Transfer */}
              {paymentDetails.bank_name && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Bank Transfer
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span>Bank Name:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{paymentDetails.bank_name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(paymentDetails.bank_name!, 'Bank Name')}
                        >
                          {copied === 'Bank Name' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    {paymentDetails.account_number && (
                      <div className="flex justify-between items-center">
                        <span>Account Number:</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded font-mono">
                            {paymentDetails.account_number}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(paymentDetails.account_number!, 'Account Number')}
                          >
                            {copied === 'Account Number' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    {paymentDetails.account_name && (
                      <div className="flex justify-between items-center">
                        <span>Account Name:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{paymentDetails.account_name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(paymentDetails.account_name!, 'Account Name')}
                          >
                            {copied === 'Account Name' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Money */}
              {paymentDetails.mobile_money_number && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Mobile Money
                  </h4>
                  <div className="space-y-2 text-sm">
                    {paymentDetails.mobile_money_provider && (
                      <div className="flex justify-between items-center">
                        <span>Provider:</span>
                        <span className="font-medium">{paymentDetails.mobile_money_provider}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span>Number:</span>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded font-mono">
                          {paymentDetails.mobile_money_number}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(paymentDetails.mobile_money_number!, 'Mobile Money Number')}
                        >
                          {copied === 'Mobile Money Number' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    <strong>Use Reference Number:</strong> Always include the reference number{' '}
                    <code className="bg-muted px-1 rounded">{referenceNumber}</code> when making payment
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>
                    <strong>Processing Time:</strong> Payments are processed within 24 hours during business days
                  </span>
                </div>
                {paymentDetails.payment_instructions && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p>{paymentDetails.payment_instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubscriptionRequest} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Subscription Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
