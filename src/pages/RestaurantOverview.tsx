import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Breadcrumbs, HomeBreadcrumb } from "@/components/ui/breadcrumbs";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { ChevronRight, Plus, Store, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface MenuGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  is_default?: boolean;
  created_at: string;
}

export default function RestaurantOverview() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (slug) {
      loadRestaurantData();
    }
  }, [slug]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      // Load restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("slug", slug)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Load menu groups
      const { data: groupsData, error: groupsError } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .order("display_order", { ascending: true });

      if (groupsError) throw groupsError;
      setMenuGroups(groupsData || []);
    } catch (error: any) {
      console.error("Error loading restaurant:", error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleOpenDialog = () => {
    setFormData({ name: "", description: "" });
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setFormData({ name: "", description: "" });
  };

  const handleCreateMenuGroup = async () => {
    if (!restaurant || !formData.name.trim()) {
      toast({
        title: "Error",
        description: "Menu group name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const slug = generateSlug(formData.name);

      // Get the next display order
      const maxOrder = menuGroups.length > 0 
        ? Math.max(...menuGroups.map(g => g.display_order)) 
        : 0;

      const { data, error } = await supabase
        .from("menu_groups")
        .insert({
          restaurant_id: restaurant.id,
          name: formData.name,
          slug: slug,
          description: formData.description || null,
          display_order: maxOrder + 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu group created successfully",
      });

      handleCloseDialog();
      loadRestaurantData();
    } catch (error: any) {
      console.error("Error creating menu group:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create menu group",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    HomeBreadcrumb(),
    {
      label: "My Restaurants",
      href: "/dashboard/restaurants",
      icon: <Store className="h-3.5 w-3.5" />
    },
    {
      label: restaurant?.name || "Restaurant",
      icon: <UtensilsCrossed className="h-3.5 w-3.5" />
    }
  ];

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading restaurant...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Restaurant Not Found</CardTitle>
              <CardDescription>The restaurant you're looking for doesn't exist.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard/restaurants")}>
                Go to My Restaurants
              </Button>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="space-y-6 p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Restaurant Header */}
        <div className="flex items-center gap-4">
          {restaurant.logo_url && (
            <img
              src={restaurant.logo_url}
              alt={restaurant.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
            <p className="text-muted-foreground">/{restaurant.slug}</p>
          </div>
        </div>

        {/* Menu Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Menu Groups</h2>
              <p className="text-muted-foreground">Select a menu group to manage its categories and items</p>
            </div>
            <Button onClick={handleOpenDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Group
            </Button>
          </div>

          {menuGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No menu groups yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first menu group to organize your restaurant's offerings
                </p>
                <Button onClick={handleOpenDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Menu Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuGroups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                  onClick={() => navigate(`/dashboard/restaurant/${restaurant.slug}/group/${group.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {group.name}
                          {group.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </CardTitle>
                        {group.description && (
                          <CardDescription className="mt-2">
                            {group.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={group.is_active ? "default" : "secondary"}>
                        {group.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/restaurant/${restaurant.slug}/group/${group.slug}`);
                      }}
                    >
                      Manage Menu
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Add Menu Group Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Menu Group</DialogTitle>
              <DialogDescription>
                Add a new menu group to organize your restaurant's offerings (e.g., Breakfast, Lunch, Dinner, Drinks).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Menu Group Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Breakfast Menu, Lunch Specials"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                {formData.name && (
                  <p className="text-xs text-muted-foreground">
                    Slug: {generateSlug(formData.name)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this menu group..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateMenuGroup} disabled={saving || !formData.name.trim()}>
                {saving ? "Creating..." : "Create Menu Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModernDashboardLayout>
  );
}
