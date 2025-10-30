import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, Plus, Edit, Trash2, Eye } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  whatsapp_number: string;
  subscription_status: string;
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  created_at: string;
}

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp_number: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const createRestaurant = async () => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .insert({
          name: newRestaurant.name,
          email: newRestaurant.email,
          phone: newRestaurant.phone,
          whatsapp_number: newRestaurant.whatsapp_number,
          subscription_status: 'inactive',
          slug: newRestaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant created successfully"
      });

      setNewRestaurant({
        name: "",
        email: "",
        phone: "",
        whatsapp_number: ""
      });
      setShowCreateDialog(false);
      loadRestaurants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create restaurant",
        variant: "destructive"
      });
    }
  };

  const updateRestaurant = async () => {
    if (!editingRestaurant) return;

    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: editingRestaurant.name,
          email: editingRestaurant.email,
          phone: editingRestaurant.phone,
          whatsapp_number: editingRestaurant.whatsapp_number,
          subscription_status: editingRestaurant.subscription_status
        })
        .eq('id', editingRestaurant.id);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Restaurant updated successfully"
      });

      setEditingRestaurant(null);
      loadRestaurants();
    } catch (error: any) {
      console.error('Full error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update restaurant",
        variant: "destructive"
      });
    }
  };

  const deleteRestaurant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant deleted successfully"
      });

      loadRestaurants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete restaurant",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab="restaurants" setActiveTab={() => {}} />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading restaurants...</p>
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
        <AdminSidebar activeTab="restaurants" setActiveTab={() => {}} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">Restaurant Management</h1>
              <p className="text-sm text-muted-foreground">Manage restaurant accounts</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Restaurant</DialogTitle>
                  <DialogDescription>Add a new restaurant account</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Restaurant Name</Label>
                    <Input
                      id="name"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                      placeholder="Restaurant Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newRestaurant.email}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                      placeholder="restaurant@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newRestaurant.phone}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                      placeholder="+250788000000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      value={newRestaurant.whatsapp_number}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, whatsapp_number: e.target.value })}
                      placeholder="+250788000000"
                    />
                  </div>
                  <Button onClick={createRestaurant} className="w-full">
                    Create Restaurant
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurants.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Store className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {restaurants.filter(r => r.subscription_status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                  <Store className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {restaurants.filter(r => r.subscription_status === 'inactive').length}
                  </div>
                </CardContent>
              </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expired</CardTitle>
                    <Store className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {restaurants.filter(r => r.subscription_status === 'expired').length}
                    </div>
                  </CardContent>
                </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Restaurants ({restaurants.length})
                </CardTitle>
                <CardDescription>Manage restaurant accounts and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restaurants.map((restaurant) => (
                    <Card key={restaurant.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <h3 className="font-semibold">{restaurant.name}</h3>
                            <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                            {restaurant.phone && (
                              <p className="text-sm">{restaurant.phone}</p>
                            )}
                            <div className="flex gap-2 items-center">
                              <Badge variant={getStatusColor(restaurant.subscription_status)}>
                                {restaurant.subscription_status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(restaurant.created_at).toLocaleDateString()}
                            </p>
                            {restaurant.subscription_start_date && (
                              <p className="text-sm text-muted-foreground">
                                Expires: {new Date(restaurant.subscription_end_date || '').toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedRestaurant(restaurant)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Restaurant Details</DialogTitle>
                                  <DialogDescription>View restaurant information</DialogDescription>
                                </DialogHeader>
                                {selectedRestaurant && (
                                  <div className="space-y-4">
                                    <div>
                                      <p className="font-semibold">Name: {selectedRestaurant.name}</p>
                                      <p className="text-sm text-muted-foreground">{selectedRestaurant.email}</p>
                                    </div>
                                     <div>
                                       <p className="font-semibold">Contact Information</p>
                                       <p className="text-sm">Phone: {selectedRestaurant.phone || 'N/A'}</p>
                                       <p className="text-sm">WhatsApp: {selectedRestaurant.whatsapp_number}</p>
                                     </div>
                                     <div>
                                       <p className="font-semibold">Subscription</p>
                                       <p className="text-sm">Status: {selectedRestaurant.subscription_status}</p>
                                       {selectedRestaurant.subscription_start_date && (
                                         <>
                                           <p className="text-sm">Start: {new Date(selectedRestaurant.subscription_start_date).toLocaleDateString()}</p>
                                           <p className="text-sm">End: {new Date(selectedRestaurant.subscription_end_date || '').toLocaleDateString()}</p>
                                         </>
                                       )}
                                     </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRestaurant(restaurant)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteRestaurant(restaurant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      {/* Edit Dialog */}
      <Dialog open={!!editingRestaurant} onOpenChange={() => setEditingRestaurant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>Update restaurant details</DialogDescription>
          </DialogHeader>
          {editingRestaurant && (
            <div className="space-y-4">
              <div>
                <Label>Restaurant Name</Label>
                <Input
                  value={editingRestaurant.name}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingRestaurant.email}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={editingRestaurant.phone || ""}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>WhatsApp Number</Label>
                <Input
                  value={editingRestaurant.whatsapp_number}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, whatsapp_number: e.target.value })}
                />
              </div>
              <div>
                <Label>Subscription Status</Label>
                 <Select 
                   value={editingRestaurant.subscription_status} 
                   onValueChange={(value) => setEditingRestaurant({ ...editingRestaurant, subscription_status: value })}
                 >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={updateRestaurant} className="w-full">
                Update Restaurant
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
};

export default AdminRestaurants;