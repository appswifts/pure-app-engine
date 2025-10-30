import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/RestaurantSidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  Package,
  ArrowUp,
  Check
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  slug: string;
  brand_color: string;
  font_family: string;
  background_style: string;
  background_color: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_date: string;
  period_start: string;
  period_end: string;
  status: 'pending' | 'verified' | 'rejected';
  notes: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
}

interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  max_tables: number | null;
  max_menu_items: number | null;
  features: any;
  is_active: boolean;
  display_order: number;
}

const Billing = () => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [currentPackage, setCurrentPackage] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [packageSelectionOpen, setPackageSelectionOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    payment_method: "",
    payment_reference: "",
    payment_date: "",
    period_start: "",
    period_end: "",
    notes: "",
    package_id: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load restaurant data by user_id
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Load subscription plans instead of packages
      const { data: packagesData, error: packagesError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (packagesError) throw packagesError;
      
      // Map subscription plans to package format
      const mappedPackages = packagesData?.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: plan.price,
        currency: plan.currency,
        max_tables: plan.max_tables,
        max_menu_items: plan.max_menu_items,
        features: plan.features || [],
        is_active: plan.is_active,
        created_at: plan.created_at,
        display_order: plan.display_order || 0
      })) || [];
      
      setPackages(mappedPackages);

      // Mock current package since restaurant doesn't have package_id field
      if (mappedPackages.length > 0) {
        setCurrentPackage(mappedPackages[0]);
      }

      // Load payment history - temporarily disabled until types are updated
      // const { data: paymentsData, error: paymentsError } = await supabase
      //   .from("subscription_payments")
      //   .select("*")
      //   .eq("restaurant_id", user.id)
      //   .order("created_at", { ascending: false });

      // if (paymentsError) throw paymentsError;
      setPayments([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelection = (pkg: PackageData) => {
    setSelectedPackage(pkg);
    setNewPayment(prev => ({
      ...prev,
      amount: (pkg.price / 100).toString(),
      package_id: pkg.id
    }));
    setPackageSelectionOpen(false);
    setUploadDialogOpen(true);
  };

  const handlePaymentUpload = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get restaurant details
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("name, email, phone, whatsapp_number")
        .eq("user_id", user.id)
        .single();

      // Get package details (temporarily using mock data)
      const packageData = selectedPackage || { name: 'Selected Package' };

      // Insert payment record - temporarily disabled until types are updated
      // const { error: paymentError } = await supabase
      //   .from("subscription_payments")
      //   .insert({
      //     restaurant_id: user.id,
      //     amount: parseFloat(newPayment.amount) * 100, // Convert to cents
      //     payment_method: newPayment.payment_method,
      //     payment_reference: newPayment.payment_reference,
      //     payment_date: newPayment.payment_date,
      //     period_start: newPayment.period_start,
      //     period_end: newPayment.period_end,
      //     notes: newPayment.notes || null,
      //     status: "pending"
      //   });

      // if (paymentError) throw paymentError;

      // Mock subscription order creation
      toast({
        title: "Success (Mock)",
        description: "Payment would be submitted for review in production"
      });

      setNewPayment({
        amount: "",
        payment_method: "",
        payment_reference: "",
        payment_date: "",
        period_start: "",
        period_end: "",
        notes: "",
        package_id: ""
      });
      setSelectedPackage(null);
      setUploadDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload payment proof",
        variant: "destructive"
      });
    }
  };

  const calculatePlanType = (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (diffInMonths >= 12) {
      return 'yearly';
    } else {
      return 'monthly';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatPrice = (price: number, currency: string = "RWF") => {
    return `${(price / 100).toLocaleString()} ${currency}`;
  };

  const calculateNextPaymentDate = () => {
    // Mock function since restaurant doesn't have subscription fields
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString();
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <RestaurantSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">Loading billing information...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RestaurantSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Subscription & Billing</h1>
              <p className="text-sm text-muted-foreground">Manage your subscription and payment history</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Payment
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upload Payment Proof</DialogTitle>
                    <DialogDescription>
                      {selectedPackage ? 
                        `Submit payment for ${selectedPackage.name} package (${formatPrice(selectedPackage.price, selectedPackage.currency)}/month)` :
                        "Submit your payment details for verification and account activation."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount Paid *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                          placeholder="29000"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment_date">Payment Date *</Label>
                        <Input
                          id="payment_date"
                          type="date"
                          value={newPayment.payment_date}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, payment_date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_method">Payment Method *</Label>
                      <Select onValueChange={(value) => setNewPayment(prev => ({ ...prev, payment_method: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment_reference">Payment Reference *</Label>
                      <Input
                        id="payment_reference"
                        value={newPayment.payment_reference}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, payment_reference: e.target.value }))}
                        placeholder="Transaction ID, Receipt #, etc."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="period_start">Period Start *</Label>
                        <Input
                          id="period_start"
                          type="date"
                          value={newPayment.period_start}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, period_start: e.target.value }))}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="period_end">Period End *</Label>
                        <Input
                          id="period_end"
                          type="date"
                          value={newPayment.period_end}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, period_end: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={newPayment.notes}
                        onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional information about the payment..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <Button onClick={handlePaymentUpload} className="w-full">
                      Submit Payment Proof
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          <div className="flex-1 space-y-6 p-4 pt-6">
            {/* Subscription Status */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="secondary">Mock Status</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Current Package</p>
                    <p className="font-semibold">
                      {currentPackage ? currentPackage.name : "No package selected"}
                    </p>
                    {currentPackage && (
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(currentPackage.price, currentPackage.currency)}/month
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Next Payment Due
                    </p>
                    <p className="font-semibold">
                      TBD
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Actions</p>
                    <Button size="sm" onClick={() => setPackageSelectionOpen(true)}>
                      <Package className="h-4 w-4 mr-1" />
                      Select Package
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Action Required</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please select a package and upload your payment proof to activate your account.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Instructions
                </CardTitle>
                <CardDescription>
                  Follow these steps to make your monthly payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Bank Transfer</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Account Name:</strong> QR Menu Systems</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                        <p><strong>Bank:</strong> Example Bank</p>
                        <p><strong>Reference:</strong> Your Restaurant ID</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Mobile Money</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Number:</strong> +1234567890</p>
                        <p><strong>Name:</strong> QR Menu Systems</p>
                        <p><strong>Reference:</strong> Your Restaurant Name</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Important:</strong> After making payment, upload your payment proof using the button above. 
                      Include your transaction reference for faster verification.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Track all your subscription payments and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payment history yet</p>
                    <p className="text-sm text-muted-foreground">Upload your first payment proof to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{formatPrice(payment.amount * 100)}</span>
                            <span className="text-sm text-muted-foreground">
                              via {payment.payment_method.replace('_', ' ')}
                            </span>
                          </div>
                          {getPaymentStatusBadge(payment.status)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Payment Date</p>
                            <p>{new Date(payment.payment_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Reference</p>
                            <p className="font-mono">{payment.payment_reference}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Period</p>
                            <p>{new Date(payment.period_start).toLocaleDateString()} - {new Date(payment.period_end).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p>{new Date(payment.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        {payment.notes && (
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Notes:</p>
                            <p>{payment.notes}</p>
                          </div>
                        )}
                        
                        {payment.verified_by && payment.verified_at && (
                          <div className="mt-2 text-sm text-green-700">
                            Verified by {payment.verified_by} on {new Date(payment.verified_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Billing;