import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Eye, FileText, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manualPaymentService } from '@/services/manualPaymentService';

interface PaymentRequest {
  id: string;
  user_id: string;
  restaurant_id: string;
  amount: number;
  currency: string;
  status: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  created_at: string;
  paid_at?: string;
  reference_number?: string;
  payment_proof_url?: string;
  admin_notes?: string;
  restaurants?: {
    name: string;
    email: string;
  };
}

export const ManualPaymentAdmin = () => {
  const [pendingPayments, setPendingPayments] = useState<PaymentRequest[]>([]);
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
      const payments = await manualPaymentService.getAllPendingPayments();
      setPendingPayments(payments);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load pending payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      await manualPaymentService.approvePayment({
        payment_request_id: paymentId,
        admin_notes: adminNotes[paymentId] || '',
        verified_by: 'admin',
      });

      toast({
        title: 'Success',
        description: 'Payment approved successfully',
      });

      loadPendingPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to approve payment',
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId: string) => {
    try {
      setProcessing(paymentId);
      const reason = adminNotes[paymentId] || 'Payment rejected by admin';
      
      await manualPaymentService.rejectPayment(paymentId, reason);

      toast({
        title: 'Success',
        description: 'Payment rejected',
      });

      loadPendingPayments();
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
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: currency || 'RWF',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'pending_approval':
        return <Badge variant="outline">Awaiting Approval</Badge>;
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Manual Payment Approvals</h2>
      </div>

      {pendingPayments.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground">No pending payment approvals at the moment.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingPayments.map((payment) => (
            <Card key={payment.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {payment.restaurants?.name || 'Unknown Restaurant'}
                  </CardTitle>
                  {getStatusBadge(payment.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Amount:</span>
                    <p>{formatCurrency(payment.amount, payment.currency)}</p>
                  </div>
                  <div>
                    <span className="font-medium">Period:</span>
                    <p>{new Date(payment.billing_period_start).toLocaleDateString()} - {new Date(payment.billing_period_end).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Due Date:</span>
                    <p>{new Date(payment.due_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Submitted:</span>
                    <p>{new Date(payment.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {payment.reference_number && (
                  <div>
                    <span className="font-medium">Reference Number:</span>
                    <p className="text-sm text-muted-foreground">{payment.reference_number}</p>
                  </div>
                )}

                {payment.payment_proof_url && (
                  <div>
                    <span className="font-medium">Payment Proof:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => window.open(payment.payment_proof_url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Proof
                    </Button>
                  </div>
                )}

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
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleApprove(payment.id)}
                    disabled={processing === payment.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processing === payment.id ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Payment
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(payment.id)}
                    disabled={processing === payment.id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Payment
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

export default ManualPaymentAdmin;