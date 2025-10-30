import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Check, X, Eye, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Payment {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  reference?: string;
  status: string;
  created_at: string;
  subscriptions?: {
    restaurants?: {
      name: string;
      email: string;
    };
  };
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          subscriptions!inner(
            restaurants(name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load payments",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const updatePaymentStatus = async (paymentId: string, status: 'pending' | 'verified' | 'rejected') => {
    // Add to processing set
    setProcessingPayments(prev => new Set(prev).add(paymentId));
    
    try {
      const { error } = await supabase
        .from('payment_records')
        .update({
          status,
          paid_at: status === 'verified' ? new Date().toISOString() : null
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Payment ${status} successfully`
      });

      // Update local state optimistically
      setPayments(prev => prev.map(payment => 
        payment.id === paymentId 
          ? { 
              ...payment, 
              status,
              paid_at: status === 'verified' ? new Date().toISOString() : null
            }
          : payment
      ));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive"
      });
    } finally {
      // Remove from processing set
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(paymentId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'default';
      case 'pending':
        return 'secondary';  
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Filter payments based on status and search term
  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesSearch = !searchTerm || 
      payment.subscriptions?.restaurants?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.subscriptions?.restaurants?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab="payments" setActiveTab={() => {}} />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Loading payments...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab="payments" setActiveTab={() => {}} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Payment Management</h1>
              <p className="text-sm text-muted-foreground">View and verify subscription payments</p>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{payments.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <CreditCard className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified</CardTitle>
                  <CreditCard className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'verified').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {payments.filter(p => p.status === 'verified')
                      .reduce((sum, p) => sum + p.amount, 0).toLocaleString()} RWF
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Search by restaurant name, email, or reference..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <select
                      id="status-filter"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payments ({filteredPayments.length})
                </CardTitle>
                <CardDescription>Manage subscription payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No payments found matching your criteria.</p>
                    </div>
                  ) : (
                    filteredPayments.map((payment) => (
                      <Card key={payment.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h3 className="font-semibold">{payment.subscriptions?.restaurants?.name || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">{payment.subscriptions?.restaurants?.email || 'No email'}</p>
                              <p className="text-lg font-medium">
                                {payment.amount.toLocaleString()} {payment.currency}
                              </p>
                              <div className="flex gap-2 items-center">
                                <Badge variant={getStatusColor(payment.status)}>
                                  {payment.status}
                                </Badge>
                                {payment.payment_method && (
                                  <Badge variant="outline">{payment.payment_method}</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Created: {new Date(payment.created_at).toLocaleDateString()}
                              </p>
                              {payment.reference && (
                                <p className="text-sm">Reference: {payment.reference}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedPayment(payment)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Payment Details</DialogTitle>
                                    <DialogDescription>View payment information</DialogDescription>
                                  </DialogHeader>
                                  {selectedPayment && (
                                    <div className="space-y-4">
                                       <div>
                                         <p className="font-semibold">Restaurant: {selectedPayment.subscriptions?.restaurants?.name || 'Unknown'}</p>
                                         <p className="text-sm text-muted-foreground">{selectedPayment.subscriptions?.restaurants?.email || 'No email'}</p>
                                       </div>
                                       <div>
                                         <p className="font-semibold">Amount: {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</p>
                                         <p className="text-sm">Method: {selectedPayment.payment_method || 'N/A'}</p>
                                         <p className="text-sm">Reference: {selectedPayment.reference || 'N/A'}</p>
                                       </div>
                                    </div>
                                  )}
                                </DialogContent>
                              </Dialog>
                              {payment.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updatePaymentStatus(payment.id, 'verified')}
                                    className="bg-green-600 hover:bg-green-700"
                                    disabled={processingPayments.has(payment.id)}
                                  >
                                    {processingPayments.has(payment.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                                    disabled={processingPayments.has(payment.id)}
                                  >
                                    {processingPayments.has(payment.id) ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <X className="h-4 w-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminPayments;