import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Check, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface SubscriptionOrder {
  id: string;
  restaurant_id: string;
  amount: number;
  currency: string;
  status: string;
  admin_notes?: string;
  verified_by?: string;
  created_at: string;
  restaurants?: {
    name: string;
    email: string;
  };
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<SubscriptionOrder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          restaurants(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const approveOrder = async (orderId: string, restaurantId: string) => {
    try {
      // Update payment request
      const { error: orderError } = await supabase
        .from('payment_requests')
        .update({
          status: 'verified',
          verified_by: 'admin'
        })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update restaurant subscription status
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({
          subscription_status: 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        })
        .eq('user_id', restaurantId);

      if (restaurantError) throw restaurantError;

      toast({
        title: "Success",
        description: "Order approved and restaurant activated"
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve order",
        variant: "destructive"
      });
    }
  };

  const rejectOrder = async (orderId: string, reason: string = 'Rejected by admin') => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          admin_notes: reason
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order rejected"
      });

      loadOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject order",
        variant: "destructive"
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

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab="orders" setActiveTab={() => {}} />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading orders...</p>
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
        <AdminSidebar activeTab="orders" setActiveTab={() => {}} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Order Management</h1>
              <p className="text-sm text-muted-foreground">Manage subscription orders</p>
            </div>
          </header>

          <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.filter(o => o.status === 'verified').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orders.reduce((sum, o) => sum + o.amount, 0).toLocaleString()} RWF
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Subscription Orders ({orders.length})
                </CardTitle>
                <CardDescription>Manage subscription orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className={order.status === 'pending' ? "border-orange-200 bg-orange-50" : ""}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{order.restaurants?.name || 'Unknown Restaurant'}</h3>
                            <p className="text-sm text-muted-foreground">{order.restaurants?.email || 'No email'}</p>
                            <p className="text-lg font-medium">
                              {order.amount.toLocaleString()} {order.currency}
                            </p>
                            <div className="flex gap-2 items-center">
                              <Badge variant={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.admin_notes && (
                              <p className="text-sm">Notes: {order.admin_notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription>View order information</DialogDescription>
                                </DialogHeader>
                                   {selectedOrder && (
                                     <div className="space-y-4">
                                       <div>
                                         <p className="font-semibold">Restaurant: {selectedOrder.restaurants?.name || 'Unknown'}</p>
                                         <p className="text-sm text-muted-foreground">{selectedOrder.restaurants?.email || 'No email'}</p>
                                       </div>
                                       <div>
                                         <p className="font-semibold">Order Details</p>
                                         <p className="text-sm">Amount: {selectedOrder.amount.toLocaleString()} {selectedOrder.currency}</p>
                                         <p className="text-sm">Status: {selectedOrder.status}</p>
                                       </div>
                                       {selectedOrder.admin_notes && (
                                         <div>
                                           <p className="font-semibold">Admin Notes</p>
                                           <p className="text-sm">{selectedOrder.admin_notes}</p>
                                         </div>
                                       )}
                                     </div>
                                   )}
                              </DialogContent>
                            </Dialog>
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveOrder(order.id, order.restaurant_id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => rejectOrder(order.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminOrders;