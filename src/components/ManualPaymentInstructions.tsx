import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { simplePaymentConfigService } from '@/services/simplePaymentConfigService';
import { 
  CreditCard, 
  Building, 
  Smartphone,
  Copy,
  Check,
  MessageCircle,
  AlertCircle
} from 'lucide-react';

interface ManualPaymentInstructionsProps {
  planName: string;
  amount: number;
  currency?: string;
  restaurantId: string;
  onPaymentComplete?: () => void;
}

const ManualPaymentInstructions: React.FC<ManualPaymentInstructionsProps> = ({
  planName,
  amount,
  currency = 'RWF',
  restaurantId,
  onPaymentComplete
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      setLoading(true);
      const info = await simplePaymentConfigService.getManualPaymentInfo();
      setPaymentInfo(info);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
      
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-6 w-6 p-0 ml-2"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const handleContactWhatsApp = () => {
    const message = `Hello! I would like to subscribe to the ${planName} plan for ${formatAmount(amount)}. My restaurant ID is: ${restaurantId}`;
    const encodedMessage = encodeURIComponent(message);
    
    // Use the configured WhatsApp number if available, otherwise use a default
    const whatsappNumber = paymentInfo?.whatsapp_number || '+250788123456';
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!paymentInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Information Unavailable</h3>
            <p className="text-muted-foreground">
              Manual payment is currently not configured. Please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{planName} Plan</p>
              <p className="text-sm text-muted-foreground">Restaurant ID: {restaurantId}</p>
            </div>
            <Badge variant="secondary" className="text-lg font-bold">
              {formatAmount(amount)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Bank Transfer */}
        {paymentInfo.bank_name && paymentInfo.account_number && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="h-5 w-5" />
                Bank Transfer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bank Name:</span>
                <div className="flex items-center">
                  <span className="font-medium">{paymentInfo.bank_name}</span>
                  <CopyButton text={paymentInfo.bank_name} field="Bank Name" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account Name:</span>
                <div className="flex items-center">
                  <span className="font-medium">{paymentInfo.account_name}</span>
                  <CopyButton text={paymentInfo.account_name} field="Account Name" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Account Number:</span>
                <div className="flex items-center">
                  <span className="font-medium font-mono">{paymentInfo.account_number}</span>
                  <CopyButton text={paymentInfo.account_number} field="Account Number" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <div className="flex items-center">
                  <span className="font-bold text-primary">{formatAmount(amount)}</span>
                  <CopyButton text={amount.toString()} field="Amount" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Money */}
        {(paymentInfo.mtn_number || paymentInfo.airtel_number) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="h-5 w-5" />
                Mobile Money
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentInfo.mtn_number && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">MTN Mobile Money:</span>
                  <div className="flex items-center">
                    <span className="font-medium font-mono">{paymentInfo.mtn_number}</span>
                    <CopyButton text={paymentInfo.mtn_number} field="MTN Number" />
                  </div>
                </div>
              )}
              
              {paymentInfo.airtel_number && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Airtel Money:</span>
                  <div className="flex items-center">
                    <span className="font-medium font-mono">{paymentInfo.airtel_number}</span>
                    <CopyButton text={paymentInfo.airtel_number} field="Airtel Number" />
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <div className="flex items-center">
                  <span className="font-bold text-primary">{formatAmount(amount)}</span>
                  <CopyButton text={amount.toString()} field="Amount" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      {paymentInfo.instructions && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{paymentInfo.instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Contact */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Need Help?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Contact us on WhatsApp after completing your payment for quick activation.
            </p>
            <Button 
              onClick={handleContactWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact on WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Completion */}
      {onPaymentComplete && (
        <div className="flex justify-center">
          <Button onClick={onPaymentComplete} variant="outline">
            I have completed the payment
          </Button>
        </div>
      )}
    </div>
  );
};

export default ManualPaymentInstructions;