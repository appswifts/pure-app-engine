import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Calendar,
  DollarSign,
  ExternalLink,
  Eye
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number?: string;
  payment_proof_url?: string;
  status: string;
  payment_date: string;
  created_at: string;
  admin_notes?: string;
  subscription?: {
    restaurants?: {
      name: string;
      email: string;
    };
    subscription_plans?: {
      name: string;
    };
  };
}

interface Props {
  onUpdate?: () => void;
}

export const AdminPaymentVerification: React.FC<Props> = ({ onUpdate }) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          subscriptions!inner(
            restaurant_id,
            restaurants!inner(name, email),
            subscription_plans(name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments((data as any) || []);
    } catch (error: any) {
      console.error('Failed to load payments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      // Update payment record
      const { error: paymentError } = await supabase
        .from('payment_records')
        .update({
          status: 'verified',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          admin_notes: adminNotes[paymentId] || null,
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update subscription status to active
      const now = new Date();
      const nextBilling = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_payment_date: now.toISOString(),
          current_period_start: now.toISOString(),
          current_period_end: nextBilling.toISOString(),
          next_billing_date: nextBilling.toISOString(),
        })
        .eq('id', payment.subscription_id);

      if (subError) throw subError;

      // Update restaurant status
      if (payment.subscription?.restaurants) {
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'active',
            subscription_start_date: now.toISOString(),
            subscription_end_date: nextBilling.toISOString(),
            last_payment_date: now.toISOString(),
          })
          .eq('email', (payment.subscription.restaurants as any).email);
      }

      toast({
        title: 'Success',
        description: 'Payment verified and subscription activated',
      });

      loadPendingPayments();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to verify payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const rejectPayment = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('payment_records')
        .update({
          status: 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          admin_notes: adminNotes[paymentId] || 'Payment rejected by admin',
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Payment rejected',
      });

      loadPendingPayments();
      onUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reject payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Payment Verification</h2>
        <p className="text-muted-foreground">Review and verify pending payment submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{payments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(
                payments.reduce((sum, p) => sum + p.amount, 0),
                payments[0]?.currency || 'RWF'
              )}
            </CardContent>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {payments.filter(p => !adminNotes[p.id]).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Cards */}
      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold">All Caught Up!</h3>
            <p className="text-muted-foreground">No pending payments to verify.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {payment.subscription?.restaurants ? (payment.subscription.restaurants as any).name : 'Unknown Restaurant'}
                  </CardTitle>
                  <Badge className="bg-orange-100 text-orange-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Verification
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Payment Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Plan:</span>
                    <p>{payment.subscription?.subscription_plans?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Method:</span>
                    <p>{payment.payment_method}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Restaurant Contact */}
                <div className="text-sm">
                  <span className="font-medium">Contact:</span>
                  <p>{payment.subscription?.restaurants ? (payment.subscription.restaurants as any).email : 'N/A'}</p>
                </div>

                {/* Reference Number */}
                {payment.reference_number && (
                  <div className="p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">Reference Number:</span>
                    <p className="text-sm font-mono mt-1">{payment.reference_number}</p>
                  </div>
                )}

                {/* Payment Proof */}
                {payment.payment_proof_url && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <a
                      href={payment.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      View Payment Proof
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label htmlFor={`notes-${payment.id}`}>Admin Notes</Label>
                  <Textarea
                    id={`notes-${payment.id}`}
                    placeholder="Add notes about this payment verification..."
                    value={adminNotes[payment.id] || ''}
                    onChange={(e) =>
                      setAdminNotes((prev) => ({
                        ...prev,
                        [payment.id]: e.target.value,
                      }))
                    }
                    rows={2}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => verifyPayment(payment.id)}
                    disabled={processing === payment.id}
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    {processing === payment.id ? (
                      'Processing...'
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify & Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => rejectPayment(payment.id)}
                    disabled={processing === payment.id}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentVerification;
