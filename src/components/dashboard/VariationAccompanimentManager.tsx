import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
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
  created_at: string;
}

interface Accompaniment {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
  is_required: boolean;
  image_url: string | null;
  created_at: string;
}

interface VariationAccompanimentManagerProps {
  user: User;
}

const VariationAccompanimentManager = ({ user }: VariationAccompanimentManagerProps) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [variations, setVariations] = useState<ItemVariation[]>([]);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);
  const [variationDialogOpen, setVariationDialogOpen] = useState(false);
  const [accompanimentDialogOpen, setAccompanimentDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ItemVariation | null>(null);
  const [editingAccompaniment, setEditingAccompaniment] = useState<Accompaniment | null>(null);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", user.id)
        .order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("id, name, category_id")
        .eq("restaurant_id", user.id)
        .order("display_order");

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

      // Load variations - only for this restaurant's menu items
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

      // Load accompaniments - only for this restaurant's menu items
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

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const handleSaveVariation = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const priceModifier = parseFloat(formData.get("priceModifier") as string) || 0;
    const menuItemId = formData.get("menuItemId") as string;
    const imageFile = formData.get("image") as File;

    if (!name.trim() || !menuItemId) {
      toast({
        title: "Error",
        description: "Name and menu item are required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = editingVariation?.image_url || null;

      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile, 'variations');
      }

      if (editingVariation) {
        // Update existing variation
        const { error } = await supabase
          .from("item_variations")
          .update({
            name,
            price_modifier: priceModifier,
            menu_item_id: menuItemId,
            image_url: imageUrl
          })
          .eq("id", editingVariation.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Variation updated successfully",
        });
      } else {
        // Create new variation
        const { error } = await supabase
          .from("item_variations")
          .insert({
            name,
            price_modifier: priceModifier,
            menu_item_id: menuItemId,
            image_url: imageUrl
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Variation created successfully",
        });
      }

      setVariationDialogOpen(false);
      setEditingVariation(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveAccompaniment = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string) || 0;
    const menuItemId = formData.get("menuItemId") as string;
    const isRequired = formData.get("isRequired") === "true";
    const imageFile = formData.get("image") as File;

    if (!name.trim() || !menuItemId) {
      toast({
        title: "Error",
        description: "Name and menu item are required",
        variant: "destructive",
      });
      return;
    }

    try {
      let imageUrl = editingAccompaniment?.image_url || null;

      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        imageUrl = await uploadImage(imageFile, 'accompaniments');
      }

      if (editingAccompaniment) {
        // Update existing accompaniment
        const { error } = await supabase
          .from("accompaniments")
          .update({
            name,
            price,
            menu_item_id: menuItemId,
            is_required: isRequired,
            image_url: imageUrl
          })
          .eq("id", editingAccompaniment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Accompaniment updated successfully",
        });
      } else {
        // Create new accompaniment
        const { error } = await supabase
          .from("accompaniments")
          .insert({
            name,
            price,
            menu_item_id: menuItemId,
            is_required: isRequired,
            image_url: imageUrl
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Accompaniment created successfully",
        });
      }

      setAccompanimentDialogOpen(false);
      setEditingAccompaniment(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariation = async (variationId: string) => {
    if (!confirm("Are you sure you want to delete this variation?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("item_variations")
        .delete()
        .eq("id", variationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variation deleted successfully",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccompaniment = async (accompanimentId: string) => {
    if (!confirm("Are you sure you want to delete this accompaniment?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("accompaniments")
        .delete()
        .eq("id", accompanimentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Accompaniment deleted successfully",
      });
      loadData();
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

  const getMenuItemName = (menuItemId: string) => {
    const item = menuItems.find(item => item.id === menuItemId);
    return item?.name || "Unknown Item";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || "Unknown Category";
  };

  const getFilteredVariations = () => {
    if (!selectedMenuItemId) return variations;
    return variations.filter(v => v.menu_item_id === selectedMenuItemId);
  };

  const getFilteredAccompaniments = () => {
    if (!selectedMenuItemId) return accompaniments;
    return accompaniments.filter(a => a.menu_item_id === selectedMenuItemId);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading variations and accompaniments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Variations & Accompaniments</h2>
          <p className="text-muted-foreground">Manage item variations and accompaniments with images</p>
        </div>
      </div>

      {/* Filter by Menu Item */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Menu Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All menu items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All menu items</SelectItem>
                {menuItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} ({getCategoryName(item.category_id)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMenuItemId && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMenuItemId("")}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="variations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="variations">Variations</TabsTrigger>
          <TabsTrigger value="accompaniments">Accompaniments</TabsTrigger>
        </TabsList>

        <TabsContent value="variations" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Item Variations</h3>
            <Dialog open={variationDialogOpen} onOpenChange={setVariationDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" onClick={() => setEditingVariation(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingVariation ? "Edit Variation" : "Add New Variation"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveVariation(formData);
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="menuItemId">Menu Item</Label>
                    <Select name="menuItemId" defaultValue={editingVariation?.menu_item_id || selectedMenuItemId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select menu item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="name">Variation Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingVariation?.name || ""}
                      placeholder="e.g., Small, Medium, Large"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceModifier">Price Modifier (RWF)</Label>
                    <Input
                      id="priceModifier"
                      name="priceModifier"
                      type="number"
                      step="100"
                      defaultValue={editingVariation?.price_modifier || 0}
                      placeholder="0 (positive or negative)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Variation Image</Label>
                    {editingVariation?.image_url && (
                      <div className="mb-2">
                        <img
                          src={editingVariation.image_url}
                          alt="Current variation image"
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
                  <div className="flex gap-2">
                    <Button type="submit" variant="gradient">
                      {editingVariation ? "Update" : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setVariationDialogOpen(false);
                        setEditingVariation(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {getFilteredVariations().map((variation) => (
              <Card key={variation.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {variation.image_url ? (
                        <img
                          src={variation.image_url}
                          alt={variation.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{variation.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getMenuItemName(variation.menu_item_id)}
                        </p>
                        <p className="text-sm font-medium">
                          {variation.price_modifier > 0 ? '+' : ''}{formatPrice(variation.price_modifier)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingVariation(variation);
                          setVariationDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteVariation(variation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accompaniments" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Accompaniments</h3>
            <Dialog open={accompanimentDialogOpen} onOpenChange={setAccompanimentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="gradient" onClick={() => setEditingAccompaniment(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Accompaniment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAccompaniment ? "Edit Accompaniment" : "Add New Accompaniment"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSaveAccompaniment(formData);
                }} className="space-y-4">
                  <div>
                    <Label htmlFor="menuItemId">Menu Item</Label>
                    <Select name="menuItemId" defaultValue={editingAccompaniment?.menu_item_id || selectedMenuItemId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select menu item" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="name">Accompaniment Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingAccompaniment?.name || ""}
                      placeholder="e.g., Extra Cheese, Salad, Sauce"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (RWF)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="100"
                      min="0"
                      defaultValue={editingAccompaniment?.price || 0}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRequired"
                      name="isRequired"
                      value="true"
                      defaultChecked={editingAccompaniment?.is_required || false}
                    />
                    <Label htmlFor="isRequired">Required (customers must select)</Label>
                  </div>
                  <div>
                    <Label htmlFor="image">Accompaniment Image</Label>
                    {editingAccompaniment?.image_url && (
                      <div className="mb-2">
                        <img
                          src={editingAccompaniment.image_url}
                          alt="Current accompaniment image"
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
                  <div className="flex gap-2">
                    <Button type="submit" variant="gradient">
                      {editingAccompaniment ? "Update" : "Create"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAccompanimentDialogOpen(false);
                        setEditingAccompaniment(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {getFilteredAccompaniments().map((accompaniment) => (
              <Card key={accompaniment.id} className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {accompaniment.image_url ? (
                        <img
                          src={accompaniment.image_url}
                          alt={accompaniment.name}
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded border flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">{accompaniment.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getMenuItemName(accompaniment.menu_item_id)}
                        </p>
                        <p className="text-sm font-medium">
                          {formatPrice(accompaniment.price)}
                        </p>
                        {accompaniment.is_required && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingAccompaniment(accompaniment);
                          setAccompanimentDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccompaniment(accompaniment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VariationAccompanimentManager;