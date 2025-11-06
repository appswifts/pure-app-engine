import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Breadcrumbs, HomeBreadcrumb } from "@/components/ui/breadcrumbs";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Store, UtensilsCrossed, FolderTree, Settings, Trash2, Edit, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteCategoryDialog } from "@/components/ui/delete-category-dialog";

export default function MenuGroupSettings() {
  const { slug: restaurantSlug, groupSlug } = useParams<{ slug: string; groupSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menuGroup, setMenuGroup] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  
  // Menu Group form
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  // Customization form
  const [useCustomSettings, setUseCustomSettings] = useState(false);
  const [customizationForm, setCustomizationForm] = useState({
    brand_color: "",
    secondary_color: "",
    text_color: "",
    card_background: "",
    font_family: "",
    background_style: "",
    background_color: "",
    background_image: "",
    background_video: "",
    background_youtube_url: "",
    menu_layout: "",
    card_style: "",
    button_style: "",
    card_shadow: "",
    show_logo_border: false,
    show_animations: true,
    logo_url: "",
    whatsapp_button_color: "",
    whatsapp_button_text_color: "",
    whatsapp_button_text: "",
    whatsapp_button_style: "",
    whatsapp_button_price_bg: "",
    whatsapp_button_price_color: "",
  });

  useEffect(() => {
    if (restaurantSlug && groupSlug) {
      loadData();
    }
  }, [restaurantSlug, groupSlug]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("id, name, slug, logo_url")
        .eq("slug", restaurantSlug)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Load menu group by slug AND restaurant_id
      const { data: groupData, error: groupError } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("slug", groupSlug)
        .eq("restaurant_id", restaurantData.id)
        .single();

      if (groupError) throw groupError;
      setMenuGroup(groupData);
      setGroupForm({
        name: groupData.name,
        description: groupData.description || "",
        is_active: groupData.is_active,
      });

      // Load customization settings
      // @ts-ignore - New fields from migration
      // Check if show_animations is explicitly set (not null/undefined) as indicator of custom settings
      const hasCustomSettings = (groupData.show_animations !== null && groupData.show_animations !== undefined) || 
                                (groupData.brand_color && groupData.brand_color !== '') || 
                                (groupData.font_family && groupData.font_family !== '') || 
                                (groupData.background_style && groupData.background_style !== '') ||
                                (groupData.card_style && groupData.card_style !== '') ||
                                (groupData.button_style && groupData.button_style !== '');
      setUseCustomSettings(!!hasCustomSettings);
      // @ts-ignore - New fields from migration
      setCustomizationForm({
        brand_color: groupData.brand_color || "",
        secondary_color: groupData.secondary_color || "",
        text_color: groupData.text_color || "",
        card_background: groupData.card_background || "",
        font_family: groupData.font_family || "",
        background_style: groupData.background_style || "",
        background_color: groupData.background_color || "",
        background_image: groupData.background_image || "",
        background_video: groupData.background_video || "",
        background_youtube_url: groupData.background_youtube_url || "",
        menu_layout: groupData.menu_layout || "",
        card_style: groupData.card_style || "",
        button_style: groupData.button_style || "",
        card_shadow: groupData.card_shadow || "",
        show_logo_border: groupData.show_logo_border || false,
        show_animations: groupData.show_animations !== false,
        logo_url: groupData.logo_url || "",
        whatsapp_button_color: groupData.whatsapp_button_color || "",
        whatsapp_button_text_color: groupData.whatsapp_button_text_color || "",
        whatsapp_button_text: groupData.whatsapp_button_text || "",
        whatsapp_button_style: groupData.whatsapp_button_style || "",
        whatsapp_button_price_bg: groupData.whatsapp_button_price_bg || "",
        whatsapp_button_price_color: groupData.whatsapp_button_price_color || "",
      });

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("menu_group_id", groupData.id)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
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

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("menu_groups")
        .update({
          name: groupForm.name,
          description: groupForm.description,
          is_active: groupForm.is_active,
        })
        .eq("id", menuGroup.id);

      if (error) throw error;

      toast({
        title: "Group updated successfully!",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating group",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If not using custom settings, clear all customization fields
      let updateData;
      
      if (useCustomSettings) {
        // Save custom settings - ensure at least one field has a value to mark as "customized"
        updateData = {
          ...customizationForm,
          // Set show_animations to true as a marker that custom settings are enabled
          show_animations: customizationForm.show_animations !== false,
        };
      } else {
        // Clear all customization fields
        updateData = {
          brand_color: null,
          secondary_color: null,
          text_color: null,
          card_background: null,
          font_family: null,
          background_style: null,
          background_color: null,
          background_image: null,
          background_video: null,
          background_youtube_url: null,
          menu_layout: null,
          card_style: null,
          button_style: null,
          card_shadow: null,
          show_logo_border: null,
          show_animations: null,
          logo_url: null,
          whatsapp_button_color: null,
          whatsapp_button_text_color: null,
          whatsapp_button_text: null,
          whatsapp_button_style: null,
          whatsapp_button_price_bg: null,
          whatsapp_button_price_color: null,
        };
      }

      // @ts-ignore - New fields from migration
      const { error } = await supabase
        .from("menu_groups")
        .update(updateData)
        .eq("id", menuGroup.id);

      if (error) throw error;

      toast({
        title: "Customization saved successfully!",
        description: useCustomSettings ? "Your custom settings are now active" : "Now using restaurant default settings",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error saving customization",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
    });
    setShowEditCategoryDialog(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: categoryForm.name,
          description: categoryForm.description,
        })
        .eq("id", editingCategory.id);

      if (error) throw error;

      toast({
        title: "Category updated successfully!",
      });

      setShowEditCategoryDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeleteCategory = async (category: any) => {
    // Get item count for this category
    const { count } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true })
      .eq("category_id", category.id);

    setDeletingCategory({ ...category, itemCount: count || 0 });
    setShowDeleteCategoryDialog(true);
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
      href: `/dashboard/restaurant/${restaurant?.slug}/group/${menuGroup?.slug}`,
      icon: <FolderTree className="h-3.5 w-3.5" />
    },
    {
      label: "Settings",
      icon: <Settings className="h-3.5 w-3.5" />
    }
  ];

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading settings...</p>
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
              <Settings className="h-8 w-8" />
              Menu Group Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage categories, accompaniments, and group settings
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/dashboard/restaurant/${restaurant?.slug}/group/${menuGroup?.slug}`)}>
            Back to Menu
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="group" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="group">Group Settings</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
          </TabsList>

          {/* Group Settings Tab */}
          <TabsContent value="group" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Menu Group Information</CardTitle>
                <CardDescription>Update the basic information for this menu group</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateGroup} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      placeholder="e.g., Rwandan Cuisine"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      placeholder="Describe this menu group"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="group-active">Active Status</Label>
                      <p className="text-sm text-muted-foreground">
                        Inactive groups won't be visible to customers
                      </p>
                    </div>
                    <Switch
                      id="group-active"
                      checked={groupForm.is_active}
                      onCheckedChange={(checked) => setGroupForm({ ...groupForm, is_active: checked })}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
                <CardDescription>Edit or delete categories for this menu group</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No categories yet. Add one from the main menu page.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category, index) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              {index + 1}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="text-muted-foreground">{category.description || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditCategory(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteCategory(category)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customization Tab */}
          <TabsContent value="customization" className="space-y-4">
            <form onSubmit={handleSaveCustomization} className="space-y-4">
              {/* Enable/Disable Custom Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Customization Mode</CardTitle>
                  <CardDescription>Choose whether to use custom settings or inherit from restaurant defaults</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Use Custom Settings</Label>
                      <p className="text-sm text-muted-foreground">
                        {useCustomSettings ? "This group has its own unique appearance" : "Using restaurant's default settings"}
                      </p>
                    </div>
                    <Switch
                      checked={useCustomSettings}
                      onCheckedChange={setUseCustomSettings}
                    />
                  </div>
                </CardContent>
              </Card>

              {useCustomSettings && (
                <>
                  {/* Brand Colors */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Brand Colors</CardTitle>
                      <CardDescription>Customize the color scheme for this menu group</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="brand-color" className="text-base font-semibold">Brand Color</Label>
                        <p className="text-sm text-muted-foreground mb-2">Primary color for buttons, highlights, and accents</p>
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
                            style={{ backgroundColor: customizationForm.brand_color || '#F97316' }}
                            onClick={() => document.getElementById('brand-color')?.click()}
                          />
                          <div className="flex-1">
                            <Input
                              id="brand-color"
                              type="color"
                              value={customizationForm.brand_color || '#F97316'}
                              onChange={(e) => setCustomizationForm({...customizationForm, brand_color: e.target.value})}
                              className="h-12 w-full cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={customizationForm.brand_color || '#F97316'}
                              onChange={(e) => setCustomizationForm({...customizationForm, brand_color: e.target.value})}
                              className="mt-2"
                              placeholder="#F97316"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="text-color" className="text-base font-semibold">Text Color</Label>
                        <p className="text-sm text-muted-foreground mb-2">Color for headings and important text</p>
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
                            style={{ backgroundColor: customizationForm.text_color || '#FFFFFF' }}
                            onClick={() => document.getElementById('text-color')?.click()}
                          />
                          <div className="flex-1">
                            <Input
                              id="text-color"
                              type="color"
                              value={customizationForm.text_color || '#FFFFFF'}
                              onChange={(e) => setCustomizationForm({...customizationForm, text_color: e.target.value})}
                              className="h-12 w-full cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={customizationForm.text_color || '#FFFFFF'}
                              onChange={(e) => setCustomizationForm({...customizationForm, text_color: e.target.value})}
                              className="mt-2"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Font & Typography */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Typography</CardTitle>
                      <CardDescription>Choose the font style for your menu text</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label htmlFor="font-family" className="text-base font-semibold">Font Family</Label>
                        <p className="text-sm text-muted-foreground mb-2">Font used for all menu text</p>
                        <select
                          id="font-family"
                          value={customizationForm.font_family}
                          onChange={(e) => setCustomizationForm({...customizationForm, font_family: e.target.value})}
                          className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-medium cursor-pointer hover:bg-accent transition-colors"
                        >
                          <option value="">Default (Work Sans) - Clean & Modern</option>
                          <option value="Playfair Display">Playfair Display - Elegant & Serif</option>
                          <option value="Roboto">Roboto - Professional & Clean</option>
                          <option value="Open Sans">Open Sans - Friendly & Readable</option>
                          <option value="Montserrat">Montserrat - Bold & Modern</option>
                          <option value="Poppins">Poppins - Geometric & Stylish</option>
                          <option value="Lato">Lato - Classic & Versatile</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-2">
                          Preview: <span style={{ fontFamily: customizationForm.font_family || 'Work Sans' }}>The quick brown fox jumps</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card & Button Styling */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Layout & Styling</CardTitle>
                      <CardDescription>Customize the look and feel of menu cards and buttons</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="card-style" className="text-base font-semibold">Card Style</Label>
                        <p className="text-sm text-muted-foreground mb-2">Shape of menu item cards</p>
                        <select
                          id="card-style"
                          value={customizationForm.card_style}
                          onChange={(e) => setCustomizationForm({...customizationForm, card_style: e.target.value})}
                          className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-medium cursor-pointer hover:bg-accent transition-colors"
                        >
                          <option value="">Default - Inherits from restaurant</option>
                          <option value="rounded">Rounded Corners - Soft & Friendly</option>
                          <option value="extra-rounded">Extra Rounded - Very Soft & Modern</option>
                          <option value="sharp">Sharp Corners - Bold & Edgy</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="button-style" className="text-base font-semibold">Button Style</Label>
                        <p className="text-sm text-muted-foreground mb-2">Shape of action buttons</p>
                        <select
                          id="button-style"
                          value={customizationForm.button_style}
                          onChange={(e) => setCustomizationForm({...customizationForm, button_style: e.target.value})}
                          className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-medium cursor-pointer hover:bg-accent transition-colors"
                        >
                          <option value="">Default - Inherits from restaurant</option>
                          <option value="rounded">Rounded - Classic & Balanced</option>
                          <option value="pill">Pill - Fully Rounded & Playful</option>
                          <option value="sharp">Sharp - Modern & Minimal</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Background */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Background</CardTitle>
                      <CardDescription>Set the background appearance for your menu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="bg-style" className="text-base font-semibold">Background Style</Label>
                        <p className="text-sm text-muted-foreground mb-2">Type of background to display</p>
                        <select
                          id="bg-style"
                          value={customizationForm.background_style}
                          onChange={(e) => setCustomizationForm({...customizationForm, background_style: e.target.value})}
                          className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-medium cursor-pointer hover:bg-accent transition-colors"
                        >
                          <option value="">Default - Inherits from restaurant</option>
                          <option value="solid">Solid Color - Simple & Clean</option>
                          <option value="gradient">Gradient - Smooth Blend</option>
                          <option value="image">Image - Custom Photo</option>
                        </select>
                      </div>
                      
                      {customizationForm.background_style === 'solid' && (
                        <div className="space-y-3">
                          <Label htmlFor="bg-color" className="text-base font-semibold">Background Color</Label>
                          <p className="text-sm text-muted-foreground mb-2">Solid background color for menu</p>
                          <div className="flex items-center gap-4">
                            <div 
                              className="w-20 h-20 rounded-lg border-2 border-gray-200 shadow-sm cursor-pointer transition-transform hover:scale-105"
                              style={{ backgroundColor: customizationForm.background_color || '#F5F5F5' }}
                              onClick={() => document.getElementById('bg-color')?.click()}
                            />
                            <div className="flex-1">
                              <Input
                                id="bg-color"
                                type="color"
                                value={customizationForm.background_color || '#F5F5F5'}
                                onChange={(e) => setCustomizationForm({...customizationForm, background_color: e.target.value})}
                                className="h-12 w-full cursor-pointer"
                              />
                              <Input
                                type="text"
                                value={customizationForm.background_color || '#F5F5F5'}
                                onChange={(e) => setCustomizationForm({...customizationForm, background_color: e.target.value})}
                                className="mt-2"
                                placeholder="#F5F5F5"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Customization"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {/* Edit Category Dialog */}
        <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateCategory}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category-name">Category Name</Label>
                  <Input
                    id="edit-category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g., Appetizers"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-category-description">Description</Label>
                  <Textarea
                    id="edit-category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Describe this category"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditCategoryDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        {deletingCategory && (
          <DeleteCategoryDialog
            open={showDeleteCategoryDialog}
            onOpenChange={setShowDeleteCategoryDialog}
            category={{
              id: deletingCategory.id,
              name: deletingCategory.name,
            }}
            availableCategories={categories.map(c => ({ id: c.id, name: c.name }))}
            itemCount={deletingCategory.itemCount || 0}
            onSuccess={() => {
              loadData();
              setDeletingCategory(null);
            }}
          />
        )}
      </div>
    </ModernDashboardLayout>
  );
}
