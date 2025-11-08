import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  CreditCard,
  Receipt
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  payment_method?: string;
  download_url?: string;
  created_at: string;
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const BillingHistory: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!restaurant) return;

      // Get payment records
      const { data: payments, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          subscriptions!inner(
            restaurant_id,
            plan_id,
            subscription_plans(name)
          )
        `)
        .eq('subscriptions.restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform to invoice format
      const transformedInvoices: Invoice[] = (payments || []).map((payment, index) => ({
        id: payment.id,
        invoice_number: `INV-${new Date(payment.created_at).getFullYear()}-${String(index + 1).padStart(4, '0')}`,
        date: payment.payment_date || payment.created_at,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status === 'verified' || payment.status === 'confirmed' ? 'paid' : 
                payment.status === 'pending' ? 'pending' : 
                payment.status === 'rejected' ? 'failed' : 'pending',
        description: `Subscription Payment - ${(payment.subscriptions as any)?.subscription_plans?.name || 'Plan'}`,
        payment_method: payment.payment_method,
        download_url: payment.payment_proof_url,
        created_at: payment.created_at,
      }));

      setInvoices(transformedInvoices);
    } catch (error: any) {
      console.error('Failed to load billing history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load billing history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoice: Invoice) => {
    try {
      // Generate PDF invoice (placeholder - implement actual PDF generation)
      toast({
        title: 'Generating Invoice',
        description: 'Your invoice will be downloaded shortly...',
      });

      // For now, just create a simple text receipt
      const invoiceContent = `
INVOICE
========================================
Invoice #: ${invoice.invoice_number}
Date: ${new Date(invoice.date).toLocaleDateString()}
Status: ${invoice.status.toUpperCase()}

========================================
Description: ${invoice.description}
Amount: ${formatCurrency(invoice.amount, invoice.currency)}
Payment Method: ${invoice.payment_method || 'N/A'}

========================================
Thank you for your business!
      `;

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Invoice downloaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Billing History
        </CardTitle>
        <CardDescription>View and download your invoices</CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No billing history yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your invoices will appear here once you make payments
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{invoice.invoice_number}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(invoice.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {invoice.payment_method || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </div>
                    <div className="mt-1">
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoice(invoice)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {invoices.length > 0 && (
          <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {invoices.filter(i => i.status === 'paid').length}
              </div>
              <div className="text-xs text-muted-foreground">Paid Invoices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {invoices.filter(i => i.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(
                  invoices
                    .filter(i => i.status === 'paid')
                    .reduce((sum, i) => sum + i.amount, 0),
                  invoices[0]?.currency || 'RWF'
                )}
              </div>
              <div className="text-xs text-muted-foreground">Total Paid</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BillingHistory;
