/**
 * Admin Orders Management - WooCommerce Style
 * Unified view for all orders across payment gateways
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Filter,
  Search,
  Eye,
  DollarSign,
} from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_gateway?: string;
  payment_status?: string;
  payment_method?: string;
  payment_reference?: string;
  order_items: any[];
  special_instructions?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  cancelled_reason?: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, gatewayFilter, paymentStatusFilter]);

  const loadOrders = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer_phone?.includes(searchTerm) ||
          order.id.includes(searchTerm) ||
          order.payment_reference?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Payment gateway filter
    if (gatewayFilter !== 'all') {
      filtered = filtered.filter((order) => order.payment_gateway === gatewayFilter);
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter((order) => order.payment_status === paymentStatusFilter);
    }

    setFilteredOrders(filtered);
  };

  const confirmOrder = async (orderId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order confirmed successfully',
      });

      loadOrders();
      setShowOrderDetail(false);
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm order',
        variant: 'destructive',
      });
    }
  };

  const cancelOrder = async (orderId: string, reason: string) => {
    try {
      const { error } = await (supabase as any)
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'cancelled',
          cancelled_reason: reason,
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order cancelled successfully',
      });

      loadOrders();
      setShowOrderDetail(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      });
    }
  };

  const getPaymentGatewayBadge = (gateway?: string) => {
    const badges = {
      stripe: { color: 'bg-purple-100 text-purple-800', label: 'Stripe' },
      paypal: { color: 'bg-blue-100 text-blue-800', label: 'PayPal' },
      flutterwave: { color: 'bg-orange-100 text-orange-800', label: 'Flutterwave' },
      manual: { color: 'bg-green-100 text-green-800', label: 'Manual Payment' },
      cash: { color: 'bg-gray-100 text-gray-800', label: 'Cash' },
    };

    const badge = badges[gateway as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800', label: 'N/A' };
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      preparing: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      ready: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status?: string) => {
    if (!status) return null;

    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-orange-100 text-orange-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={badges[status as keyof typeof badges] || 'bg-gray-100'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8" />
            Orders Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all orders across payment gateways
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orders.filter((o) => o.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter((o) => o.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {orders
                    .filter((o) => o.payment_status === 'completed')
                    .reduce((sum, o) => sum + o.total_amount, 0)
                    .toLocaleString()}{' '}
                  RWF
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, ID, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="flutterwave">Flutterwave</SelectItem>
                <SelectItem value="manual">Manual Payment</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Order ID</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Payment Gateway</th>
                  <th className="text-left p-3">Order Status</th>
                  <th className="text-left p-3">Payment Status</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {order.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{order.customer_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_phone || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="p-3 text-sm">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      <p className="font-semibold">
                        {order.total_amount.toLocaleString()} {order.currency}
                      </p>
                    </td>
                    <td className="p-3">{getPaymentGatewayBadge(order.payment_gateway)}</td>
                    <td className="p-3">{getStatusBadge(order.status)}</td>
                    <td className="p-3">{getPaymentStatusBadge(order.payment_status)}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No orders found</p>
                <p className="text-muted-foreground">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{selectedOrder.id}</code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p>
                    <span className="text-muted-foreground">Name:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_name || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Phone:</span>{' '}
                    <span className="font-medium">{selectedOrder.customer_phone || 'N/A'}</span>
                  </p>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gateway:</span>
                    {getPaymentGatewayBadge(selectedOrder.payment_gateway)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    {getPaymentStatusBadge(selectedOrder.payment_status)}
                  </div>
                  {selectedOrder.payment_method && (
                    <p>
                      <span className="text-muted-foreground">Method:</span>{' '}
                      <span className="font-medium">{selectedOrder.payment_method}</span>
                    </p>
                  )}
                  {selectedOrder.payment_reference && (
                    <p>
                      <span className="text-muted-foreground">Reference:</span>{' '}
                      <code className="text-sm bg-background px-2 py-1 rounded">
                        {selectedOrder.payment_reference}
                      </code>
                    </p>
                  )}
                  <div className="pt-2 border-t">
                    <p className="text-lg font-bold">
                      Total: {selectedOrder.total_amount.toLocaleString()} {selectedOrder.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item: any, index: number) => (
                    <div key={index} className="bg-muted p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {(item.price * item.quantity).toLocaleString()} {selectedOrder.currency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Special Instructions</h3>
                  <div className="bg-muted p-4 rounded-lg">
                    <p>{selectedOrder.special_instructions}</p>
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h3 className="font-semibold mb-2">Order Status</h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <>
                  <Button
                    onClick={() => confirmOrder(selectedOrder.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Order
                  </Button>
                  <Button
                    onClick={() => {
                      const reason = prompt('Enter cancellation reason:');
                      if (reason) cancelOrder(selectedOrder.id, reason);
                    }}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setShowOrderDetail(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminOrders;
