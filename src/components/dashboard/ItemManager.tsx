import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit2, Upload, X, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { useRestaurant } from "@/hooks/useRestaurant";
import errorHandler from '@/services/errorHandlingService';

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
}

interface Category {
  id: string;
  name: string;
}

interface MenuItemFormData {
  name: string;
  description: string;
  base_price: string;
  category_id: string;
  image_url?: string;
  is_available: boolean;
}

interface ItemManagerProps {
  user: User;
}

const ItemManager = ({ user }: ItemManagerProps) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [formData, setFormData] = useState<MenuItemFormData>({
    name: "",
    description: "",
    base_price: "0",
    category_id: "",
    is_available: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId]);

  const loadData = async () => {
    if (!restaurantId) return;
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("display_order");

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'fetch menu items');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.base_price || !formData.category_id) return;

    try {
      let imageUrl: string | undefined = undefined;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${restaurantId}-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("menu-item-images")
          .upload(fileName, imageFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;
        imageUrl = uploadData?.path;
      }

      const itemData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        base_price: parseFloat(formData.base_price),
        category_id: formData.category_id,
        is_available: formData.is_available,
        ...(imageUrl && { image_url: imageUrl })
      };

      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from("menu_items")
          .update(itemData)
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
            ...itemData,
            restaurant_id: restaurantId,
            display_order: items.length,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      loadData();
      handleCloseDialog();
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'save menu item');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      base_price: item.base_price.toString(),
      category_id: item.category_id,
      image_url: item.image_url || undefined,
      is_available: item.is_available,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string) => {
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

      loadData();
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'delete menu item');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !item.is_available })
        .eq("id", item.id);

      if (error) throw error;

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update item availability",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !restaurantId) return;
    
    setCreatingCategory(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          restaurant_id: restaurantId,
          display_order: categories.length
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category created successfully",
      });

      await loadData();
      setShowNewCategoryForm(false);
      setNewCategoryName("");
    } catch (error: any) {
      const message = errorHandler.handleApiError(error, 'fetch categories');
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      description: "",
      base_price: "0",
      category_id: "",
      is_available: true,
    });
    setImageFile(null);
    setShowNewCategoryForm(false);
    setNewCategoryName("");
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  if (loading || restaurantLoading) {
    return <div className="text-center py-8">Loading items...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Menu Items</h2>
          <p className="text-muted-foreground">Manage your restaurant's menu items</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" disabled={categories.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
              <DialogDescription>
                {editingItem 
                  ? "Update the menu item details below." 
                  : "Create a new menu item for your restaurant."
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Breast"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the dish, ingredients, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                {!showNewCategoryForm ? (
                  <div className="space-y-2">
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => {
                        if (value === "__add_new__") {
                          setShowNewCategoryForm(true);
                        } else {
                          setFormData({ ...formData, category_id: value });
                        }
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="__add_new__" className="text-blue-600 font-medium">
                          <div className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add New Category
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Create New Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowNewCategoryForm(false);
                          setNewCategoryName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name (e.g., Appetizers)"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateCategory();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        size="sm"
                      >
                        {creatingCategory ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="price">Price (RWF)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="100"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="available">Available for ordering</Label>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseDialog}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  {editingItem ? "Update" : "Create"} Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              Create categories first before adding menu items
            </p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-muted-foreground mb-4">
              <Plus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your menu by adding your first item
            </p>
            <Button variant="gradient" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Menu Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge variant={item.is_available ? "default" : "secondary"}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-2">
                      Category: {getCategoryName(item.category_id)}
                    </p>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="text-xl font-bold text-primary">
                      {formatPrice(item.base_price)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAvailability(item)}
                    >
                      <Switch 
                        checked={item.is_available} 
                        className="scale-75"
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
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
    </div>
  );
};

export default ItemManager;