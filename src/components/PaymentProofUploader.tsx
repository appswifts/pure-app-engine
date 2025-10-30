import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { manualPaymentService } from '@/services/manualPaymentService';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentProofUploaderProps {
  paymentRequestId: string;
  amount: number;
  currency: string;
  onProofSubmitted?: () => void;
}

const PaymentProofUploader: React.FC<PaymentProofUploaderProps> = ({
  paymentRequestId,
  amount,
  currency,
  onProofSubmitted
}) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const formatAmount = (amount: number, currency: string = 'RWF') => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referenceNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a transaction reference number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await manualPaymentService.submitPaymentProof(
        paymentRequestId,
        referenceNumber.trim(),
        undefined // We'll add file upload later if needed
      );

      setSubmitted(true);
      toast({
        title: "Success",
        description: "Payment proof submitted successfully! We'll review it and update your account within 24 hours.",
      });

      onProofSubmitted?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment proof",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-success">Payment Proof Submitted</h3>
              <p className="text-muted-foreground">
                Thank you! We've received your payment proof and will review it within 24 hours.
              </p>
            </div>
            <div className="bg-background/50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Payment Details:</div>
              <div className="font-medium">Amount: {formatAmount(amount, currency)}</div>
              <div className="text-sm">Reference: {referenceNumber}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Payment Proof
        </CardTitle>
        <CardDescription>
          Provide your transaction reference to confirm payment of {formatAmount(amount, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitProof} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reference">Transaction Reference Number *</Label>
            <Input
              id="reference"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., TXN123456789 or Mobile Money reference"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the reference number from your bank transfer or mobile money transaction
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about your payment..."
              rows={3}
            />
          </div>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">Important:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Make sure the reference number matches your actual transaction</li>
                  <li>• Our team will verify the payment within 24 hours</li>
                  <li>• You'll receive confirmation once payment is approved</li>
                  <li>• Contact support if you need assistance: support@menuforest.com</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !referenceNumber.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Submit Payment Proof
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentProofUploader;