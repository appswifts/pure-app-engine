import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs, HomeBreadcrumb } from "@/components/ui/breadcrumbs";
import { MenuItemCard } from "@/components/ui/menu-item-card";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Store, UtensilsCrossed, FolderTree, Plus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIImageGenerator } from "@/components/menu/AIImageGenerator";
import type { Database } from "@/integrations/supabase/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type MenuItem = Tables<"menu_items"> & {
  item_variations?: any[];
  accompaniments?: any[];
  is_accompaniment?: boolean;
};

export default function MenuGroupManagement() {
  const { slug: restaurantSlug, groupSlug } = useParams<{ 
    slug?: string; 
    groupSlug?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuGroup, setMenuGroup] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category_id: "",
    is_available: true,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    // Support both URL patterns:
    // Old: /dashboard/restaurant/:slug/group/:groupSlug
    // New: /dashboard/menu-groups/:slug (where slug is groupSlug)
    if (restaurantSlug && groupSlug) {
      loadData();
    } else if (groupSlug) {
      // For new clean URL, groupSlug is the only slug param
      loadData();
    }
  }, [restaurantSlug, groupSlug]);

  const loadData = async () => {
    try {
      setLoading(true);

      let restaurantData: any = null;
      let groupData: any = null;

      // Handle both URL patterns
      if (restaurantSlug && groupSlug) {
        // Old URL: /dashboard/restaurant/:slug/group/:groupSlug
        // Load restaurant by slug
        const { data: restaurantDataBySlug, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, slug, logo_url")
          .eq("slug", restaurantSlug)
          .single();

        if (restaurantError) throw restaurantError;
        restaurantData = restaurantDataBySlug;

        // Load menu group by slug AND restaurant_id
        const { data: groupDataBySlug, error: groupError } = await supabase
          .from("menu_groups")
          .select("*")
          .eq("slug", groupSlug)
          .eq("restaurant_id", restaurantData.id)
          .single();

        if (groupError) throw groupError;
        groupData = groupDataBySlug;
      } else if (groupSlug) {
        // New clean URL: /dashboard/menu-groups/:slug
        // NOTE: This assumes slugs are globally unique. If multiple groups have the same slug,
        // this will take the first one. Consider using restaurant-scoped URLs instead.
        const { data: groupDataBySlug, error: groupError } = await supabase
          .from("menu_groups")
          .select("*")
          .eq("slug", groupSlug)
          .limit(1);

        if (groupError) throw groupError;
        
        if (!groupDataBySlug || groupDataBySlug.length === 0) {
          throw new Error("Menu group not found");
        }
        
        groupData = groupDataBySlug[0];

        // Load restaurant by ID from menu group
        const { data: restaurantDataById, error: restaurantError } = await supabase
          .from("restaurants")
          .select("id, name, slug, logo_url")
          .eq("id", groupData.restaurant_id)
          .single();

        if (restaurantError) throw restaurantError;
        restaurantData = restaurantDataById;
      }

      setRestaurant(restaurantData);
      setMenuGroup(groupData);

      // Load categories for this menu group
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("menu_group_id", groupData.id)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load items for this menu group
      await fetchItems();
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      // Get category IDs for this menu group
      const categoryIds = categories.map(c => c.id);
      
      if (categoryIds.length === 0) {
        setItems([]);
        return;
      }

      // Fetch menu items for these categories
      let itemsQuery = supabase
        .from("menu_items")
        .select("*")
        .in("category_id", categoryIds)
        .eq("restaurant_id", restaurant?.id)
        .order("display_order", { ascending: true });

      if (selectedCategory !== "all") {
        itemsQuery = itemsQuery.eq("category_id", selectedCategory);
      }

      const { data: itemsData, error: itemsError } = await itemsQuery;

      if (itemsError) throw itemsError;

      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        return;
      }

      // Fetch variations for these items
      const itemIds = itemsData.map(item => item.id);
      
      const { data: variationsData } = await supabase
        .from("item_variations")
        .select("*")
        .in("menu_item_id", itemIds);

      // Fetch accompaniments for these items
      const { data: accompanimentsData } = await supabase
        .from("accompaniments")
        .select("*")
        .in("menu_item_id", itemIds);

      // Combine the data
      const itemsWithRelations = itemsData.map(item => ({
        ...item,
        item_variations: variationsData?.filter(v => v.menu_item_id === item.id) || [],
        accompaniments: accompanimentsData?.filter(a => a.menu_item_id === item.id) || [],
      }));

      setItems(itemsWithRelations as any);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error fetching items",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (menuGroup && restaurant && categories.length > 0) {
      fetchItems();
    }
  }, [selectedCategory, menuGroup, restaurant, categories]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const editItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: item.base_price.toString(),
      image_url: item.image_url || "",
      category_id: item.category_id,
      is_available: item.is_available,
    });
    setShowEditDialog(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const itemData = {
        name: itemForm.name,
        description: itemForm.description,
        base_price: parseFloat(itemForm.price),
        image_url: itemForm.image_url || null,
        category_id: itemForm.category_id,
        is_available: itemForm.is_available,
        restaurant_id: restaurant?.id,
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Item updated successfully!",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from("menu_items")
          .insert(itemData);

        if (error) throw error;

        toast({
          title: "Item added successfully!",
        });
      }

      setShowEditDialog(false);
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error saving item",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Item deleted successfully!",
      });

      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openAddItemDialog = () => {
    setEditingItem(null);
    setItemForm({
      name: "",
      description: "",
      price: "",
      image_url: "",
      category_id: categories[0]?.id || "",
      is_available: true,
    });
    setShowEditDialog(true);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          name: categoryForm.name,
          description: categoryForm.description,
          menu_group_id: menuGroup?.id,
          restaurant_id: restaurant?.id,
          display_order: categories.length,
        });

      if (error) throw error;

      toast({
        title: "Category added successfully!",
      });

      setShowCategoryDialog(false);
      setCategoryForm({ name: "", description: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      href: `/dashboard/restaurant/${restaurant?.slug}`,
      icon: <UtensilsCrossed className="h-3.5 w-3.5" />
    },
    {
      label: menuGroup?.name || "Menu Group",
      icon: <FolderTree className="h-3.5 w-3.5" />
    }
  ];

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading menu...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="space-y-6 p-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FolderTree className="h-8 w-8" />
              {menuGroup?.name}
            </h1>
            {menuGroup?.description && (
              <p className="text-muted-foreground mt-1">{menuGroup.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/dashboard/restaurant/${restaurant?.slug}/group/${menuGroup?.slug}/settings`)}>            
              Manage Settings
            </Button>
            <Button onClick={openAddItemDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCategoryDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        {items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                {selectedCategory === "all"
                  ? "Add your first menu item to get started"
                  : "No items in this category yet"}
              </p>
              <Button onClick={openAddItemDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                description={item.description}
                base_price={item.base_price}
                image_url={item.image_url}
                is_available={item.is_available}
                is_accompaniment={item.is_accompaniment}
                restaurant_id={restaurant?.id!}
                item_variations={item.item_variations || []}
                accompaniments={item.accompaniments || []}
                onEdit={() => editItem(item)}
                onDelete={() => deleteItem(item.id)}
                onRefresh={() => fetchItems()}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update the details of your menu item" : "Add a new item to your menu"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleItemSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g., Grilled Chicken"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Describe your menu item"
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="edit-image">Image URL (Optional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAIGenerator(!showAIGenerator)}
                      className="h-8 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {showAIGenerator ? "Hide" : "Generate with AI"}
                    </Button>
                  </div>
                  <Input
                    id="edit-image"
                    type="url"
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste an image URL or generate one with AI
                  </p>
                  {itemForm.image_url && !itemForm.image_url.startsWith('data:') && (
                    <div className="mt-2 relative w-full h-40 rounded-md overflow-hidden bg-muted">
                      <img
                        src={itemForm.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3EInvalid URL%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* AI Image Generator */}
                {showAIGenerator && (
                  <AIImageGenerator
                    itemName={itemForm.name}
                    onImageGenerated={(imageUrl) => {
                      setItemForm({ ...itemForm, image_url: imageUrl });
                      setShowAIGenerator(false);
                    }}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price (RWF)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="e.g., 5000"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <select
                      id="edit-category"
                      value={itemForm.category_id}
                      onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-available"
                    checked={itemForm.is_available}
                    onCheckedChange={(checked) => setItemForm({ ...itemForm, is_available: checked })}
                  />
                  <Label htmlFor="edit-available">Available for order</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingItem ? "Update Item" : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new category for your menu items
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Appetizers"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category-description">Description (Optional)</Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Describe this category"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ModernDashboardLayout>
  );
}
