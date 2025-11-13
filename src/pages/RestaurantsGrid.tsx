import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Store, Settings, QrCode, ExternalLink, Trash2, Pencil } from "lucide-react";
import { LoadingTracker } from "@/utils/debugUtils";

interface Restaurant {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  slug: string;
  created_at: string;
}

const RestaurantsGrid = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);
  const [creating, setCreating] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRestaurants();
    }
  }, [user]);

  const loadRestaurants = async () => {
    if (!user) return;

    LoadingTracker.startLoading('RestaurantsGrid');
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, email, phone, logo_url, slug, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
      LoadingTracker.endLoading('RestaurantsGrid', true);
    } catch (error: any) {
      LoadingTracker.endLoading('RestaurantsGrid', false);
      toast({
        title: "Error",
        description: "Failed to load restaurants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setCreating(true);

      // Generate slug from name
      const slug = newRestaurant.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { error } = await supabase.from("restaurants").insert({
        user_id: user.id,
        name: newRestaurant.name,
        email: newRestaurant.email,
        phone: newRestaurant.phone,
        whatsapp_number: newRestaurant.phone || "",
        slug: slug,
      } as any);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant created successfully",
      });

      setIsCreateDialogOpen(false);
      setNewRestaurant({ name: "", email: "", phone: "" });
      loadRestaurants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create restaurant",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const selectRestaurant = (restaurant: Restaurant) => {
    localStorage.setItem("selectedRestaurantId", restaurant.id);
    navigate(`/dashboard/restaurant/${restaurant.slug}`);
  };

  const handleOpenEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setNewRestaurant({
      name: restaurant.name,
      email: restaurant.email || "",
      phone: restaurant.phone || "",
    });
    setIsEditMode(true);
    setIsCreateDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditMode(false);
    setEditingRestaurant(null);
    setNewRestaurant({ name: "", email: "", phone: "" });
  };

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;

    try {
      setCreating(true);

      // Generate slug from name
      const slug = newRestaurant.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const { error } = await supabase
        .from("restaurants")
        .update({
          name: newRestaurant.name,
          email: newRestaurant.email,
          phone: newRestaurant.phone,
          whatsapp_number: newRestaurant.phone || "",
          slug: slug,
        })
        .eq("id", editingRestaurant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Restaurant updated successfully",
      });

      handleCloseDialog();
      loadRestaurants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update restaurant",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteRestaurant = async () => {
    if (!restaurantToDelete) return;

    try {
      setLoading(true);
      
      // Show a loading toast
      toast({
        title: "Deleting Restaurant",
        description: "Removing restaurant and all related data...",
      });
      
      // 1. First delete orders related to this restaurant
      const { error: ordersError } = await (supabase as any)
        .from("orders")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (ordersError) {
        console.error("Error deleting orders:", ordersError);
      } else {
        console.log("✓ Orders deleted");
      }

      // 2. Delete order analytics
      const { error: orderAnalyticsError } = await (supabase as any)
        .from("order_analytics")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (orderAnalyticsError) {
        console.error("Error deleting order analytics:", orderAnalyticsError);
      } else {
        console.log("✓ Order analytics deleted");
      }

      // 3. Delete payment requests
      const { error: paymentRequestsError } = await (supabase as any)
        .from("payment_requests")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (paymentRequestsError) {
        console.error("Error deleting payment requests:", paymentRequestsError);
      } else {
        console.log("✓ Payment requests deleted");
      }

      // 4. Delete admin notifications
      const { error: adminNotificationsError } = await (supabase as any)
        .from("admin_notifications")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (adminNotificationsError) {
        console.error("Error deleting admin notifications:", adminNotificationsError);
      } else {
        console.log("✓ Admin notifications deleted");
      }

      // 5. Delete WhatsApp notifications
      const { error: whatsappNotificationsError } = await (supabase as any)
        .from("whatsapp_notifications")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (whatsappNotificationsError) {
        console.error("Error deleting WhatsApp notifications:", whatsappNotificationsError);
      } else {
        console.log("✓ WhatsApp notifications deleted");
      }
      
      // 6. Delete menu items related to this restaurant
      const { error: menuItemsError } = await (supabase as any)
        .from("menu_items")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (menuItemsError) {
        console.error("Error deleting menu items:", menuItemsError);
      } else {
        console.log("✓ Menu items deleted");
      }

      // 7. Delete item variations
      const { error: variationsError } = await (supabase as any)
        .from("item_variations")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (variationsError) {
        console.error("Error deleting variations:", variationsError);
      } else {
        console.log("✓ Item variations deleted");
      }
      
      // 8. Delete accompaniments
      const { error: accompanimentsError } = await (supabase as any)
        .from("accompaniments")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (accompanimentsError) {
        console.error("Error deleting accompaniments:", accompanimentsError);
      } else {
        console.log("✓ Accompaniments deleted");
      }

      // 9. Delete categories
      const { error: categoriesError } = await (supabase as any)
        .from("categories")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (categoriesError) {
        console.error("Error deleting categories:", categoriesError);
      } else {
        console.log("✓ Categories deleted");
      }

      // 10. Delete menu groups
      const { error: menuGroupsError } = await (supabase as any)
        .from("menu_groups")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (menuGroupsError) {
        console.error("Error deleting menu groups:", menuGroupsError);
      } else {
        console.log("✓ Menu groups deleted");
      }

      // 11. Delete tables
      const { error: tablesError } = await (supabase as any)
        .from("tables")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (tablesError) {
        console.error("Error deleting tables:", tablesError);
      } else {
        console.log("✓ Tables deleted");
      }

      // 12. Delete QR codes
      const { error: qrCodesError } = await (supabase as any)
        .from("saved_qr_codes")
        .delete()
        .eq("restaurant_id", restaurantToDelete.id);
      
      if (qrCodesError) {
        console.error("Error deleting QR codes:", qrCodesError);
      } else {
        console.log("✓ QR codes deleted");
      }

      // 13. Finally, delete the restaurant itself
      const { error: restaurantError } = await (supabase as any)
        .from("restaurants")
        .delete()
        .eq("id", restaurantToDelete.id);

      if (restaurantError) throw restaurantError;

      toast({
        title: "Success",
        description: "Restaurant and all related data deleted successfully",
      });

      setRestaurantToDelete(null);
      loadRestaurants();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete restaurant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading restaurants...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              My Restaurants
            </h1>
            <p className="text-muted-foreground">
              Manage all your restaurant locations and menus
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={isEditMode ? handleUpdateRestaurant : handleCreateRestaurant}>
                <DialogHeader>
                  <DialogTitle>{isEditMode ? "Edit Restaurant" : "Create New Restaurant"}</DialogTitle>
                  <DialogDescription>
                    {isEditMode ? "Update your restaurant details" : "Add a new restaurant to your account"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Restaurant Name *</Label>
                    <Input
                      id="name"
                      placeholder="Pizza Palace"
                      value={newRestaurant.name}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@pizzapalace.com"
                      value={newRestaurant.email}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      value={newRestaurant.phone}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating || !newRestaurant.name}>
                    {creating 
                      ? (isEditMode ? "Updating..." : "Creating...") 
                      : (isEditMode ? "Update Restaurant" : "Create Restaurant")
                    }
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Restaurants Grid */}
        {restaurants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No restaurants yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first restaurant to start managing menus and QR codes
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Restaurant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                        <CardDescription className="text-xs">
                          /{restaurant.slug}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {restaurant.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">mail</span>
                      {restaurant.email}
                    </p>
                  )}
                  {restaurant.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">phone</span>
                      {restaurant.phone}
                    </p>
                  )}

                  <div className="space-y-2 pt-4">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => selectRestaurant(restaurant)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditDialog(restaurant)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/menu/${restaurant.slug}/table1`, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRestaurantToDelete(restaurant)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!restaurantToDelete} onOpenChange={(open) => !open && setRestaurantToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Restaurant</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{restaurantToDelete?.name}"? This action cannot be undone.
                All menu groups, items, and QR codes will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRestaurantToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteRestaurant}
              >
                Delete Restaurant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernDashboardLayout>
  );
};

export default RestaurantsGrid;
