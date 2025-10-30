import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { manualPaymentService } from '@/services/manualPaymentService';
import { supabase } from '@/integrations/supabase/client';
import { validateAndSanitizeInput } from '@/lib/validation';
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Banknote,
  Smartphone
} from 'lucide-react';

interface ManualPaymentFlowProps {
  subscriptionId: string;
  amount: number;
  currency: string;
  onPaymentSuccess?: () => void;
}

export const ManualPaymentFlow = ({ 
  subscriptionId, 
  amount, 
  currency, 
  onPaymentSuccess 
}: ManualPaymentFlowProps) => {
  const [step, setStep] = useState<'instructions' | 'proof' | 'confirmation'>('instructions');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'mobile_money'>('bank_transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string>('');
  const { toast } = useToast();

  const handleCreatePaymentRequest = async () => {
    setLoading(true);
    try {
      // Get restaurant ID from current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!restaurant) throw new Error('Restaurant not found');

      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
      
      const paymentRequest = await manualPaymentService.createPaymentRequest({
        restaurant_id: restaurant.id,
        subscription_id: subscriptionId,
        amount,
        currency,
        billing_period_start: startDate,
        billing_period_end: endDate,
        due_date: dueDate,
        description: `Subscription payment for ${currency} ${amount.toLocaleString()}`,
        payment_method: paymentMethod
      });

      setPaymentRequestId(paymentRequest.id);
      setStep('proof');
      
      toast({
        title: 'Payment Request Created',
        description: 'Please submit your payment proof to complete the process.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    const sanitizedReference = validateAndSanitizeInput(referenceNumber, 50);
    
    if (!sanitizedReference || sanitizedReference.length < 3) {
      toast({
        title: 'Error',
        description: 'Please enter a valid reference number (minimum 3 characters)',
        variant: 'destructive'
      });
      return;
    }

    // Validate reference format (alphanumeric, hyphens, underscores)
    if (!/^[A-Z0-9\-_]+$/i.test(sanitizedReference)) {
      toast({
        title: 'Error',
        description: 'Reference number can only contain letters, numbers, hyphens, and underscores',
        variant: 'destructive'
      });
      return;
    }

    // Validate file if provided
    if (proofFile) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(proofFile.type)) {
        toast({
          title: 'Error',
          description: 'Please upload a valid image (JPG, PNG) or PDF file',
          variant: 'destructive'
        });
        return;
      }

      if (proofFile.size > maxSize) {
        toast({
          title: 'Error',
          description: 'File size must be less than 5MB',
          variant: 'destructive'
        });
        return;
      }
    }

    setLoading(true);
    try {
      await manualPaymentService.submitPaymentProof(
        paymentRequestId,
        sanitizedReference,
        proofFile ? URL.createObjectURL(proofFile) : undefined
      );

      setStep('confirmation');

      toast({
        title: 'Success',
        description: 'Payment proof submitted successfully. Admin will review and activate your account.'
      });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit payment proof',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirmation') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Payment Submitted!</h3>
          <p className="text-gray-600 mb-4">
            Your payment proof has been submitted for admin review. You'll receive a confirmation once approved.
          </p>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Clock className="h-4 w-4 mr-1" />
            Pending Review
          </Badge>
        </CardContent>
      </Card>
    );
  }

  if (step === 'proof') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Submit Payment Proof
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference Number *</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter transaction reference"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proof">Payment Receipt (Optional)</Label>
            <Input
              id="proof"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-gray-500">
              Upload screenshot or receipt of your payment
            </p>
          </div>

          <Button 
            onClick={handleSubmitProof} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Payment Proof'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold">Amount to Pay</p>
          <p className="text-2xl font-bold text-blue-600">
            {amount.toLocaleString()} {currency}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={(value: 'bank_transfer' | 'mobile_money') => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4" />
                  Bank Transfer
                </div>
              </SelectItem>
              <SelectItem value="mobile_money">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Money
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {paymentMethod === 'bank_transfer' && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold">Bank Transfer Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Bank:</strong> Bank of Kigali
              </div>
              <div>
                <strong>Account Name:</strong> MenuForest Ltd
              </div>
              <div>
                <strong>Account Number:</strong> 00200101681200102681
              </div>
              <div>
                <strong>Swift Code:</strong> BKIGRWRW
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'mobile_money' && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold">Mobile Money Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>MTN Mobile Money:</strong> +250788123456
              </div>
              <div>
                <strong>Airtel Money:</strong> +250732123456
              </div>
              <div className="text-muted-foreground mt-2">
                Use the exact amount: {amount.toLocaleString()} {currency}
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Important:</p>
              <p>After making the payment, you'll need to submit the transaction reference number for verification.</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCreatePaymentRequest} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processing...' : 'I Have Made the Payment'}
        </Button>
      </CardContent>
    </Card>
  );
};