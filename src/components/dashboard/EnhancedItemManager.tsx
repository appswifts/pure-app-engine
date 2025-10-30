import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/integrations/supabase/client";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { withSupabaseErrorHandling } from "@/utils/supabaseErrorHandler";
import ErrorFallback from "@/components/ErrorFallback";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  X,
  Package,
  Utensils,
  DollarSign
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { MenuItemsSkeleton } from "@/components/RestaurantLoadingSkeleton";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
}

interface ItemVariation {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
  image_url: string | null;
}

interface Accompaniment {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_required: boolean;
  image_url: string | null;
}

interface EnhancedItemManagerProps {
  user: User;
}

const EnhancedItemManager = ({ user }: EnhancedItemManagerProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<ItemVariation[]>([]);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variationAccompanimentDialogOpen, setVariationAccompanimentDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const { toast } = useToast();
  const { restaurantId, loading: restaurantLoading } = useRestaurant();

  useEffect(() => {
    if (restaurantId && !restaurantLoading) {
      loadData();
    }
  }, [restaurantId, restaurantLoading]);

  const loadData = async () => {
    if (!restaurantId) return;
    
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
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
      setMenuItems(itemsData || []);

      // Load variations for restaurant's items
      const { data: variationsData, error: variationsError } = await supabase
        .from("item_variations")
        .select(`
          *,
          menu_items!inner(restaurant_id)
        `)
        .eq("menu_items.restaurant_id", user.id)
        .order("created_at");

      if (variationsError) throw variationsError;
      setVariations(variationsData || []);

      // Load accompaniments for restaurant's items
      const { data: accompanimentsData, error: accompanimentsError } = await supabase
        .from("accompaniments")
        .select(`
          *,
          menu_items!inner(restaurant_id)
        `)
        .eq("menu_items.restaurant_id", user.id)
        .order("created_at");

      if (accompanimentsError) throw accompanimentsError;
      setAccompaniments(accompanimentsData || []);

    }
catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    setCreatingCategory(true);
    try {
      const { data: newCategory, error } = await supabase
        .from("categories")
        .insert({
          name: newCategoryName.trim(),
          restaurant_id: restaurantId,
          display_order: categories.length,
        })
        .select()
        .single();

      if (error) throw error;

      // Update categories list
      setCategories([...categories, newCategory]);
      
      // Select the newly created category
      setSelectedCategoryId(newCategory.id);
      
      // Reset form
      setNewCategoryName("");
      setShowNewCategoryForm(false);
      
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    }
catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setCreatingCategory(false);
    }
  };

  const uploadImage = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('menu-item-images')
      .upload(`${folder}/${fileName}`, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('menu-item-images')
      .getPublicUrl(`${folder}/${fileName}`);
    
    return publicUrl;
  };

  const handleSaveItem = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const basePrice = parseFloat(formData.get("basePrice") as string) || 0;
    const categoryId = formData.get("categoryId") as string;
    const isAvailable = formData.get("isAvailable") === "true";
    const imageFile = formData.get("image") as File;

    if (!name.trim() || !categoryId) {
      toast({
        title: "Error",
        description: "Name and category are required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = editingItem?.image_url || null;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile, 'menu-items');
      }

      if (editingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name,
            description,
            base_price: basePrice,
            category_id: categoryId,
            is_available: isAvailable,
            image_url: imageUrl
          })
          .eq("id", editingItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("menu_items")
          .insert({
            name,
            description,
            base_price: basePrice,
            category_id: categoryId,
            restaurant_id: restaurantId,
            is_available: isAvailable,
            image_url: imageUrl
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      setDialogOpen(false);
      setEditingItem(null);
      loadData();
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this menu item? This will also delete all its variations and accompaniments.")) {
      return;
    }

    try {
      // Delete variations first
      await supabase.from("item_variations").delete().eq("menu_item_id", itemId);
      
      // Delete accompaniments
      await supabase.from("accompaniments").delete().eq("menu_item_id", itemId);
      
      // Delete the menu item
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
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const toggleItemAvailability = async (item: MenuItem) => {
    try {
      const newAvailability = !item.is_available;
      
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: newAvailability })
        .eq("id", item.id);

      if (error) throw error;

      // Update local state immediately for UI feedback
      setMenuItems(prevItems => 
        prevItems.map(menuItem => 
          menuItem.id === item.id 
            ? { ...menuItem, is_available: newAvailability } 
            : menuItem
        )
      );

      toast({
        title: "Success",
        description: `Item marked as ${newAvailability ? 'available' : 'unavailable'}`,
      });
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSaveVariation = async (formData: FormData) => {
    const name = formData.get("variationName") as string;
    const priceModifier = parseFloat(formData.get("variationPriceModifier") as string) || 0;
    const imageFile = formData.get("variationImage") as File;

    if (!name.trim() || !selectedItemId) {
      toast({
        title: "Error",
        description: "Variation name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = null;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile, 'variations');
      }

      const { error } = await supabase
        .from("item_variations")
        .insert({
          name,
          price_modifier: priceModifier,
          menu_item_id: selectedItemId,
          image_url: imageUrl
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variation added successfully",
      });
      
      loadData();
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleSaveAccompaniment = async (formData: FormData) => {
    const name = formData.get("accompanimentName") as string;
    const price = parseFloat(formData.get("accompanimentPrice") as string) || 0;
    const isRequired = formData.get("accompanimentRequired") === "on"; // Switch uses "on" when checked
    const imageFile = formData.get("accompanimentImage") as File;

    if (!name.trim() || !selectedItemId) {
      toast({
        title: "Error",
        description: "Accompaniment name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = null;

      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile, 'accompaniments');
      }

      const { error } = await (supabase.from("accompaniments").insert({
        name,
        price,
        menu_item_id: selectedItemId,
        is_required: isRequired,
        image_url: imageUrl
      }));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Accompaniment added successfully",
      });
      
      loadData();
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    if (!confirm("Are you sure you want to delete this variation?")) {
      return;
    }

    try {
      const { error } = await (supabase.from("item_variations").delete().eq("id", variationId));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variation deleted successfully",
      });
      loadData();
    }
catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccompaniment = async (accompanimentId: string) => {
    if (!confirm("Are you sure you want to delete this accompaniment?")) {
      return;
    }

    try {
      const { error } = await supabase.from("accompaniments").delete().eq("id", accompanimentId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Accompaniment deleted successfully",
      });
      loadData();
    }
  catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  const getItemVariations = (itemId: string) => {
    return variations.filter(v => v.menu_item_id === itemId);
  };

  const getItemAccompaniments = (itemId: string) => {
    return accompaniments.filter(a => a.menu_item_id === itemId);
  };

  if (loading || restaurantLoading) {
    return <MenuItemsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Enhanced Menu Items</h2>
          <p className="text-muted-foreground">Manage menu items with variations and accompaniments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient" onClick={() => setEditingItem(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveItem(formData);
            }} className="space-y-4">
              <div>
                <Label htmlFor="categoryId">Category</Label>
                {!showNewCategoryForm ? (
                  <div className="space-y-2">
                    <Select 
                      name="categoryId" 
                      value={selectedCategoryId || editingItem?.category_id || ""} 
                      onValueChange={(value) => {
                        if (value === "__add_new__") {
                          setShowNewCategoryForm(true);
                        } else {
                          setSelectedCategoryId(value);
                        }
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
                    {/* Hidden input to ensure form submission works */}
                    <input type="hidden" name="categoryId" value={selectedCategoryId || editingItem?.category_id || ""} />
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
                    {/* Hidden input to ensure form submission works */}
                    <input type="hidden" name="categoryId" value={selectedCategoryId || editingItem?.category_id || ""} />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name || ""}
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingItem?.description || ""}
                  placeholder="Enter item description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="basePrice">Base Price (RWF)</Label>
                <Input
                  id="basePrice"
                  name="basePrice"
                  type="number"
                  step="100"
                  defaultValue={editingItem?.base_price || 0}
                  placeholder="0"
                  required
                />
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
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  name="isAvailable"
                  defaultChecked={editingItem?.is_available !== false}
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="gradient">
                  {editingItem ? "Update" : "Create"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setEditingItem(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {menuItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Utensils className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No menu items yet</h3>
            <p className="text-muted-foreground mb-6">Create your first menu item to get started</p>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {menuItems.map((item) => {
            const itemVariations = getItemVariations(item.id);
            const itemAccompaniments = getItemAccompaniments(item.id);
            
            return (
              <Card key={item.id} className="shadow-sm hover:shadow-md transition-all overflow-hidden group">
                {/* Image Header */}
                <div className="relative h-24 bg-gradient-to-br from-primary/10 to-primary/5">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Utensils className="h-6 w-6 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Action Buttons Overlay */}
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-5 w-5 p-0 bg-white/90 hover:bg-white"
                      onClick={() => {
                        setEditingItem(item);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-2 w-2" />
                    </Button>
                    <Button
                      variant="secondary" 
                      size="sm"
                      className="h-5 w-5 p-0 bg-white/90 hover:bg-white text-destructive hover:text-destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-2 w-2" />
                    </Button>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute bottom-1 left-1">
                    <Badge 
                      variant={item.is_available ? "default" : "destructive"}
                      className="text-xs px-1 py-0 cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleItemAvailability(item);
                      }}
                    >
                      {item.is_available ? "✓" : "✗"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-2 space-y-2">
                  {/* Item Info */}
                  <div>
                    <h3 className="font-semibold text-xs leading-tight mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{getCategoryName(item.category_id)}</p>
                  </div>

                  {/* Price */}
                  <div className="text-sm font-bold text-primary">
                    {formatPrice(item.base_price)}
                  </div>

                  {/* Options Summary */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Package className="h-2 w-2" />
                      {itemVariations.length}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Utensils className="h-2 w-2" />
                      {itemAccompaniments.length}
                    </span>
                  </div>

                  {/* Manage Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-6 text-xs px-2"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setVariationAccompanimentDialogOpen(true);
                    }}
                  >
                    <DollarSign className="h-2 w-2 mr-1" />
                    Options
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Variations & Accompaniments Dialog */}
      <Dialog open={variationAccompanimentDialogOpen} onOpenChange={setVariationAccompanimentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              Manage Options
            </DialogTitle>
          </DialogHeader>
          
          {selectedItemId && (
            <div className="space-y-4">
              {/* Variations Section */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">Variations</h3>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveVariation(formData);
                  e.currentTarget.reset();
                }} className="mb-3 p-3 border rounded space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="variationName" className="text-xs">Name</Label>
                      <Input
                        id="variationName"
                        name="variationName"
                        placeholder="Small, Medium, Large"
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="variationPriceModifier" className="text-xs">Price +/- (RWF)</Label>
                      <Input
                        id="variationPriceModifier"
                        name="variationPriceModifier"
                        type="number"
                        step="100"
                        placeholder="0"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="variationImage" className="text-xs">Image</Label>
                      <Input
                        id="variationImage"
                        name="variationImage"
                        type="file"
                        accept="image/*"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="h-7 text-xs px-2">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </form>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {getItemVariations(selectedItemId).map((variation) => (
                    <div key={variation.id} className="flex items-center justify-between p-2 bg-background border rounded text-xs">
                      <div className="flex items-center gap-2">
                        {variation.image_url && (
                          <img
                            src={variation.image_url}
                            alt={variation.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{variation.name}</p>
                          <p className="text-muted-foreground">
                            {variation.price_modifier > 0 ? '+' : ''}{formatPrice(variation.price_modifier)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVariation(variation.id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accompaniments Section */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">Accompaniments</h3>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveAccompaniment(formData);
                  e.currentTarget.reset();
                }} className="mb-3 p-3 border rounded space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="accompanimentName" className="text-xs">Name</Label>
                      <Input
                        id="accompanimentName"
                        name="accompanimentName"
                        placeholder="Extra Cheese, Salad"
                        className="h-8 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="accompanimentPrice" className="text-xs">Price (RWF)</Label>
                      <Input
                        id="accompanimentPrice"
                        name="accompanimentPrice"
                        type="number"
                        step="100"
                        placeholder="0"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accompanimentImage" className="text-xs">Image</Label>
                      <Input
                        id="accompanimentImage"
                        name="accompanimentImage"
                        type="file"
                        accept="image/*"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="accompanimentRequired"
                        name="accompanimentRequired"
                        className="scale-75"
                      />
                      <Label htmlFor="accompanimentRequired" className="text-xs">Required</Label>
                    </div>
                    <Button type="submit" size="sm" className="h-7 text-xs px-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </form>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {getItemAccompaniments(selectedItemId).map((accompaniment) => (
                    <div key={accompaniment.id} className="flex items-center justify-between p-2 bg-background border rounded text-xs">
                      <div className="flex items-center gap-2">
                        {accompaniment.image_url && (
                          <img
                            src={accompaniment.image_url}
                            alt={accompaniment.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-medium">{accompaniment.name}</p>
                            {accompaniment.is_required && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">Req</Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">
                            {formatPrice(accompaniment.price)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccompaniment(accompaniment.id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedItemManager;