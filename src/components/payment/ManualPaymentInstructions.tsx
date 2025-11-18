import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentIntent {
  paymentId: string;
  amount: number;
  currency: string;
  metadata: {
    paymentInstructions: any;
  };
}

interface ManualPaymentInstructionsProps {
  paymentIntent: PaymentIntent;
  onUploadProof: (paymentId: string, file: File) => Promise<void>;
}

export const ManualPaymentInstructions = ({ paymentIntent, onUploadProof }: ManualPaymentInstructionsProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await onUploadProof(paymentIntent.paymentId, file);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Payment Instructions</CardTitle>
        <CardDescription>
          Please follow the instructions below to complete your payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">Payment Details</h3>
          <p>Amount: {paymentIntent.amount} {paymentIntent.currency}</p>
          <p>Reference: {paymentIntent.paymentId}</p>
        </div>
        <div>
          <h3 className="font-semibold">Instructions</h3>
          {paymentIntent.metadata.paymentInstructions.bankName && (
            <p>
              Bank: {paymentIntent.metadata.paymentInstructions.bankName},
              Account: {paymentIntent.metadata.paymentInstructions.accountNumber},
              Name: {paymentIntent.metadata.paymentInstructions.accountName}
            </p>
          )}
          {paymentIntent.metadata.paymentInstructions.number && (
            <p>
              Number: {paymentIntent.metadata.paymentInstructions.number}
            </p>
          )}
          <p>{paymentIntent.metadata.paymentInstructions.instructions}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-proof">Upload Proof of Payment</Label>
          <Input id="payment-proof" type="file" onChange={handleFileChange} />
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload and Complete'}
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
