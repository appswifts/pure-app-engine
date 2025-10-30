import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, ChevronRight, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { useRestaurant } from "@/hooks/useRestaurant";

interface Category {
  id: string;
  name: string;
  display_order: number;
  restaurant_id: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string;
  restaurant_id: string;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
}

interface MenuManagerProps {
  user: User;
}

const MenuManager = ({ user }: MenuManagerProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      loadMenu();
    }
  }, [restaurantId]);

  const loadMenu = async () => {
    if (!restaurantId) return;
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (categoriesError) throw categoriesError;

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (itemsError) throw itemsError;

      setCategories(categoriesData || []);
      setItems(itemsData || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load menu data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (formData: FormData) => {
    const name = formData.get("name") as string;

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from("categories")
          .update({ name })
          .eq("id", editingCategory.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from("categories")
          .insert({
            name,
            restaurant_id: restaurantId,
            display_order: categories.length
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setCategoryDialogOpen(false);
      setEditingCategory(null);
      loadMenu();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const uploadItemImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('menu-item-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('menu-item-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSaveMenuItem = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string);
    const categoryId = formData.get("categoryId") as string;
    const imageFile = formData.get("image") as File;

    if (!name.trim() || !basePrice || !categoryId) {
      toast({
        title: "Error",
        description: "Name, price, and category are required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = editingItem?.image_url || null;

      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadItemImage(imageFile);
      }

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update({
            name,
            description: description || null,
            base_price: basePrice,
            category_id: categoryId,
            image_url: imageUrl
          })
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        // Create new item
        const { error } = await supabase
          .from("menu_items")
          .insert({
            name,
            description: description || null,
            base_price: basePrice,
            category_id: categoryId,
            restaurant_id: restaurantId,
            image_url: imageUrl,
            display_order: items.filter(item => item.category_id === categoryId).length
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      setItemDialogOpen(false);
      setEditingItem(null);
      loadMenu();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? All items in this category will also be deleted.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      loadMenu();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
      loadMenu();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  if (loading || restaurantLoading) {
    return <div className="text-center py-8">Loading menu...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Menu Categories</h2>
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={() => setEditingCategory(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Add New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveCategory(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name || ""}
                  placeholder="e.g., Appetizers, Main Courses"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="gradient">
                  {editingCategory ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCategoryDialogOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">No categories yet. Create your first category to get started.</p>
            <Button 
              variant="outline" 
              onClick={() => setCategoryDialogOpen(true)}
            >
              Create First Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category) => {
            const categoryItems = items.filter(item => item.category_id === category.id);
            
            return (
              <Card key={category.id} className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        ({categoryItems.length} items)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingItem(null)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                            </DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleSaveMenuItem(formData);
                          }} className="space-y-4">
                            <div>
                              <Label htmlFor="name">Item Name</Label>
                              <Input
                                id="name"
                                name="name"
                                defaultValue={editingItem?.name || ""}
                                placeholder="e.g., Margherita Pizza"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                name="description"
                                defaultValue={editingItem?.description || ""}
                                placeholder="Describe your dish..."
                                rows={3}
                              />
                            </div>
                            <div>
                              <Label htmlFor="basePrice">Base Price (RWF)</Label>
                              <Input
                                id="basePrice"
                                name="basePrice"
                                type="number"
                                min="0"
                                step="100"
                                defaultValue={editingItem?.base_price || ""}
                                placeholder="5000"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="categoryId">Category</Label>
                              <select
                                id="categoryId"
                                name="categoryId"
                                className="w-full p-2 border rounded-md"
                                defaultValue={editingItem?.category_id || category.id}
                                required
                              >
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label htmlFor="image">Item Image</Label>
                              {editingItem?.image_url && (
                                <div className="mb-2">
                                  <img
                                    src={editingItem.image_url}
                                    alt="Current item image"
                                    className="w-20 h-20 object-cover rounded border"
                                  />
                                  <p className="text-sm text-muted-foreground">Current image</p>
                                </div>
                              )}
                              <Input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                className="mt-1"
                              />
                              <p className="text-sm text-muted-foreground mt-1">
                                Recommended: Square image, max 2MB. Supports JPG, PNG, WebP.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" variant="gradient">
                                {editingItem ? "Update" : "Create"}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setItemDialogOpen(false);
                                  setEditingItem(null);
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryItems.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No items in this category yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              )}
                              <p className="text-sm font-semibold text-primary">
                                {formatPrice(item.base_price)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setItemDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMenuItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MenuManager;