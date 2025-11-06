import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Upload, Save, Palette, Type, Image, Globe, Phone, Mail, MessageCircle, QrCode, Eye, Package, Calendar, CreditCard, ChefHat, BarChart3, Settings, ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  slug: string;
  brand_color: string;
  secondary_color?: string;
  text_color?: string;
  card_background?: string;
  font_family: string;
  background_style: string;
  background_color: string;
  background_image?: string;
  background_video?: string;
  background_youtube_url?: string;
  menu_layout?: string;
  card_style?: string;
  button_style?: string;
  card_shadow?: string;
  show_logo_border?: boolean;
  show_animations?: boolean;
  logo_url: string | null;
  subscription_status: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  trial_end_date?: string;
  grace_period_end_date?: string;
  package_id?: string;
  plan?: string;
  currency?: string;
  notes?: string;
  whatsapp_button_color?: string;
  whatsapp_button_text_color?: string;
  whatsapp_button_text?: string;
  whatsapp_button_style?: string;
  whatsapp_button_price_bg?: string;
  whatsapp_button_price_color?: string;
}

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  max_menu_items: number;
  max_tables: number;
  features: any;
  trial_days: number;
  grace_period_days: number;
}

const RestaurantSettings = () => {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<Partial<Restaurant>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [menuItemsCount, setMenuItemsCount] = useState(0);
  const [tablesCount, setTablesCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load restaurant data
      let { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // If no restaurant exists, create one
      if (!data) {
        const defaultSlug = `restaurant-${user.id.slice(0, 8)}`;
        const { data: newRestaurant, error: createError } = await supabase
          .from("restaurants")
          .insert({
            user_id: user.id,
            name: "My Restaurant",
            email: user.email || "",
            phone: "",
            whatsapp_number: "",
            slug: defaultSlug,
            brand_color: "#000000",
            font_family: "Inter",
            background_style: "solid",
            background_color: "#ffffff"
          })
          .select()
          .single();

        if (createError) throw createError;
        data = newRestaurant;
        
        toast({
          title: "Welcome!",
          description: "Your restaurant profile has been created. Please update your settings.",
        });
      }
      
      setRestaurant({ ...data, subscription_status: 'inactive' });
      setFormData({ ...data, subscription_status: 'inactive' });

      // Load subscription plans
      const { data: packagesData, error: packagesError } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price");

      if (packagesError) throw packagesError;
      setPackages((packagesData || []).map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description || '',
        price: pkg.price || 0,
        max_menu_items: pkg.max_menu_items || 100,
        max_tables: 10,
        is_active: pkg.is_active,
        features: pkg.features || [],
        trial_days: pkg.trial_days || 7,
        grace_period_days: pkg.grace_period_days || 3
      })));

      // Find current package - skip this since we don't have package_id in restaurants table
      // if (data.package_id) {
      //   const currentPkg = packagesData?.find(pkg => pkg.id === data.package_id);
      //   setCurrentPackage(currentPkg || null);
      // }

      // Load statistics
      const [menuItemsResult, categoriesResult] = await Promise.all([
        supabase.from("menu_items").select("id", { count: 'exact' }).eq("restaurant_id", data.id),
        supabase.from("categories").select("id", { count: 'exact' }).eq("restaurant_id", data.id)
      ]);

      setMenuItemsCount(menuItemsResult.count || 0);
      setTablesCount(0); // Tables feature not implemented yet
      setCategoriesCount(categoriesResult.count || 0);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load restaurant settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadLogo = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurant?.id}-${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('restaurant-logos')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-logos')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!restaurant) return;
    
    try {
      setSaving(true);
      let logoUrl = formData.logo_url;

      if (logoFile) {
        logoUrl = await uploadLogo(logoFile);
      }


      const { data, error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          whatsapp_number: formData.whatsapp_number,
          slug: formData.slug,
          brand_color: formData.brand_color,
          secondary_color: formData.secondary_color,
          text_color: formData.text_color,
          card_background: formData.card_background,
          font_family: formData.font_family,
          background_style: formData.background_style,
          background_color: formData.background_color,
          background_image: formData.background_image,
          background_video: formData.background_video,
          background_youtube_url: formData.background_youtube_url,
          menu_layout: formData.menu_layout,
          card_style: formData.card_style,
          button_style: formData.button_style,
          card_shadow: formData.card_shadow,
          show_logo_border: formData.show_logo_border,
          show_animations: formData.show_animations,
          logo_url: logoUrl,
          notes: formData.notes,
          // WhatsApp button customization properties
          whatsapp_button_color: formData.whatsapp_button_color,
          whatsapp_button_text_color: formData.whatsapp_button_text_color,
          whatsapp_button_text: formData.whatsapp_button_text,
          whatsapp_button_style: formData.whatsapp_button_style,
          whatsapp_button_price_bg: formData.whatsapp_button_price_bg,
          whatsapp_button_price_color: formData.whatsapp_button_price_color,
        })
        .eq("id", restaurant.id)
        .select();

      if (error) {
        throw error;
      }

      setRestaurant({ ...restaurant, ...formData, logo_url: logoUrl });
      toast({
        title: "Success",
        description: "Restaurant settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${restaurant?.currency || 'RWF'}`;
  };

  const getSubscriptionStatus = () => {
    if (!restaurant) return { status: 'unknown', color: 'muted', text: 'Unknown' };
    
    const now = new Date();
    const endDate = restaurant.subscription_end_date ? new Date(restaurant.subscription_end_date) : null;
    const trialEndDate = restaurant.trial_end_date ? new Date(restaurant.trial_end_date) : null;
    const graceEndDate = restaurant.grace_period_end_date ? new Date(restaurant.grace_period_end_date) : null;

    switch (restaurant.subscription_status) {
      case 'active':
        if (endDate && endDate > now) {
          return { status: 'active', color: 'success', text: 'Active' };
        } else {
          return { status: 'expired', color: 'destructive', text: 'Expired' };
        }
      case 'trial':
        if (trialEndDate && trialEndDate > now) {
          return { status: 'trial', color: 'warning', text: 'Trial' };
        } else {
          return { status: 'trial_expired', color: 'destructive', text: 'Trial Expired' };
        }
      case 'expired':
        if (graceEndDate && graceEndDate > now) {
          return { status: 'grace', color: 'warning', text: 'Grace Period' };
        } else {
          return { status: 'expired', color: 'destructive', text: 'Expired' };
        }
      case 'pending':
        return { status: 'pending', color: 'warning', text: 'Pending Approval' };
      default:
        return { status: 'unknown', color: 'muted', text: 'Unknown' };
    }
  };

  const getMenuUrl = () => {
    if (!restaurant) return '';
    return `${window.location.origin}/menu/${restaurant.slug}/demo`;
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  if (loading) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading restaurant settings...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  if (!restaurant) {
    return (
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Restaurant not found</p>
            <Button onClick={() => navigate('/dashboard/overview')} className="mt-4">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <ModernDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
          <p className="text-muted-foreground">Complete management of your restaurant profile and configuration</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="design">Menu Design</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Restaurant Information
                </CardTitle>
              </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter restaurant name"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="restaurant-slug"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Your menu will be available at: domain.com/menu/{formData.slug || 'your-slug'}/table-name
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="restaurant@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+250 xxx xxx xxx"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                placeholder="+250xxxxxxxxx"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Include country code (e.g., +250). Orders will be sent to this number.
              </p>
            </div>

              <div>
                <Label htmlFor="notes">Notes (Internal)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Internal notes about this restaurant"
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  These notes are for internal use only and won't be visible to customers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={subscriptionStatus.color as any}>
                  {subscriptionStatus.text}
                </Badge>
                <span className="text-sm text-muted-foreground">Current Status</span>
              </div>
            </CardContent>
          </Card>

            {/* Logo Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Restaurant Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restaurant.logo_url && (
                    <div className="flex items-center gap-4">
                      <img
                        src={restaurant.logo_url}
                        alt="Restaurant logo"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div>
                        <p className="text-sm font-medium">Current Logo</p>
                        <p className="text-sm text-muted-foreground">Upload a new file to replace</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="logo">Upload New Logo</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: Square image, max 2MB. Supports JPG, PNG, WebP.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-6">
          <div className="grid gap-6">

            {/* Menu Design - Colors & Branding */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Colors & Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand_color">Primary Brand Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="brand_color"
                        type="color"
                        value={formData.brand_color || '#F97316'}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.brand_color || '#F97316'}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand_color: e.target.value }))}
                        placeholder="#F97316"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Used for buttons, active states, and accents</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="secondary_color">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary_color"
                        type="color"
                        value={formData.secondary_color || '#EF4444'}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.secondary_color || '#EF4444'}
                        onChange={(e) => setFormData(prev => ({ ...prev, secondary_color: e.target.value }))}
                        placeholder="#EF4444"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Used for backgrounds and gradients</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="text_color">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="text_color"
                        type="color"
                        value={formData.text_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.text_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, text_color: e.target.value }))}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Main text color for restaurant name and headers</p>
                  </div>

                  <div>
                    <Label htmlFor="card_background">Menu Card Background</Label>
                    <div className="flex gap-2">
                      <Input
                        id="card_background"
                        type="color"
                        value={formData.card_background || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, card_background: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.card_background || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, card_background: e.target.value }))}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Background color for menu item cards</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography & Layout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography & Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font_family">Font Family</Label>
                    <Select 
                      value={formData.font_family || 'Inter'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, font_family: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter (Clean Sans)</SelectItem>
                        <SelectItem value="system-ui">System UI (Default)</SelectItem>
                        <SelectItem value="-apple-system">Apple System Font</SelectItem>
                        <SelectItem value="Arial">Arial (Classic)</SelectItem>
                        <SelectItem value="Helvetica">Helvetica (Clean)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="menu_layout">Menu Layout Style</Label>
                    <Select 
                      value={formData.menu_layout || 'cards'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, menu_layout: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cards">Card Layout (Recommended)</SelectItem>
                        <SelectItem value="list">List Layout</SelectItem>
                        <SelectItem value="grid">Grid Layout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_style">Card Corner Style</Label>
                    <Select 
                      value={formData.card_style || 'rounded'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, card_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded (Modern)</SelectItem>
                        <SelectItem value="sharp">Sharp Corners</SelectItem>
                        <SelectItem value="extra-rounded">Extra Rounded (Soft)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="button_style">Button Style</Label>
                    <Select 
                      value={formData.button_style || 'rounded'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, button_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="pill">Pill Shape</SelectItem>
                        <SelectItem value="sharp">Sharp Corners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Background & Visual Effects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Background & Visual Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="background_style">Background Style</Label>
                    <Select 
                      value={formData.background_style || 'gradient'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, background_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid Color</SelectItem>
                        <SelectItem value="gradient">Gradient (Recommended)</SelectItem>
                        <SelectItem value="pattern">Pattern</SelectItem>
                        <SelectItem value="image">Background Image</SelectItem>
                        <SelectItem value="video">Background Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="card_shadow">Card Shadow</Label>
                    <Select 
                      value={formData.card_shadow || 'medium'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, card_shadow: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shadow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Shadow</SelectItem>
                        <SelectItem value="small">Small Shadow</SelectItem>
                        <SelectItem value="medium">Medium Shadow</SelectItem>
                        <SelectItem value="large">Large Shadow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.background_style === 'image' && (
                  <div>
                    <Label htmlFor="background_image">Background Image</Label>
                    <Input
                      id="background_image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Handle background image upload
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setFormData(prev => ({ ...prev, background_image: e.target?.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a background image. Recommended: High resolution, low contrast image.
                    </p>
                  </div>
                )}

                {formData.background_style === 'video' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="background_youtube_url">YouTube Video URL (Recommended)</Label>
                      <Input
                        id="background_youtube_url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                        value={formData.background_youtube_url || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, background_youtube_url: e.target.value }))}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter a YouTube video URL for your background. The video will play automatically and loop.
                      </p>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or upload your own video</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="background_video">Upload Video File</Label>
                      <Input
                        id="background_video"
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Handle background video upload
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setFormData(prev => ({ ...prev, background_video: e.target?.result as string }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="mt-1"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your own video file. Recommended: MP4 format, under 10MB, muted autoplay.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_logo_border"
                      checked={formData.show_logo_border !== false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_logo_border: checked }))}
                    />
                    <Label htmlFor="show_logo_border">Show Logo Border</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show_animations"
                      checked={formData.show_animations !== false}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_animations: checked }))}
                    />
                    <Label htmlFor="show_animations">Enable Animations</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="w-full h-64 rounded-lg border overflow-hidden"
                    style={{
                      background: formData.background_style === 'solid' 
                        ? formData.secondary_color || '#EF4444'
                        : formData.background_style === 'gradient'
                        ? `linear-gradient(135deg, ${formData.secondary_color || '#EF4444'}, ${formData.brand_color || '#F97316'})`
                        : formData.background_style === 'pattern'
                        ? `${formData.secondary_color || '#EF4444'} radial-gradient(circle at 20% 80%, ${formData.brand_color || '#F97316'}20 0%, transparent 50%)`
                        : formData.background_image ? `url(${formData.background_image}) center/cover` : `linear-gradient(135deg, ${formData.secondary_color || '#EF4444'}, ${formData.brand_color || '#F97316'})`,
                      fontFamily: formData.font_family || 'Inter'
                    }}
                  >
                    <div className="p-6 h-full flex flex-col items-center justify-center text-center">
                      {/* Restaurant Logo Preview */}
                      <div 
                        className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center text-white text-xl font-bold ${
                          formData.show_logo_border !== false ? 'border-4' : ''
                        }`}
                        style={{
                          backgroundColor: formData.brand_color || '#F97316',
                          borderColor: formData.brand_color || '#F97316'
                        }}
                      >
                        {restaurant?.name?.charAt(0) || 'R'}
                      </div>
                      
                      {/* Restaurant Name */}
                      <h2 
                        className="text-xl font-bold mb-4"
                        style={{ color: formData.text_color || '#FFFFFF' }}
                      >
                        {restaurant?.name || 'Restaurant Name'}
                      </h2>

                      {/* Category Pills Preview */}
                      <div className="flex space-x-2 mb-4">
                        <div 
                          className={`px-4 py-2 text-sm font-medium ${
                            formData.button_style === 'pill' ? 'rounded-full' :
                            formData.button_style === 'sharp' ? 'rounded-none' : 'rounded-lg'
                          }`}
                          style={{ backgroundColor: formData.brand_color || '#F97316', color: 'white' }}
                        >
                          All
                        </div>
                        <div 
                          className={`px-4 py-2 text-sm font-medium bg-white text-gray-700 ${
                            formData.button_style === 'pill' ? 'rounded-full' :
                            formData.button_style === 'sharp' ? 'rounded-none' : 'rounded-lg'
                          }`}
                        >
                          Burgers
                        </div>
                      </div>

                      {/* Menu Card Preview */}
                      <div 
                        className={`w-full max-w-sm p-4 ${
                          formData.card_style === 'extra-rounded' ? 'rounded-2xl' :
                          formData.card_style === 'sharp' ? 'rounded-none' : 'rounded-xl'
                        } ${
                          formData.card_shadow === 'large' ? 'shadow-lg' :
                          formData.card_shadow === 'medium' ? 'shadow-md' :
                          formData.card_shadow === 'small' ? 'shadow-sm' : 'shadow-none'
                        }`}
                        style={{ backgroundColor: formData.card_background || '#FFFFFF' }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                            🍔
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">Sample Item</h3>
                            <p className="text-sm text-gray-500">Delicious description</p>
                            <p className="font-bold" style={{ color: formData.brand_color || '#F97316' }}>1,500 RWF</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button 
                              className={`w-6 h-6 border-2 flex items-center justify-center text-sm ${
                                formData.button_style === 'pill' ? 'rounded-full' :
                                formData.button_style === 'sharp' ? 'rounded-none' : 'rounded-full'
                              }`}
                              style={{ borderColor: formData.brand_color || '#F97316', color: formData.brand_color || '#F97316' }}
                            >
                              −
                            </button>
                            <span className="text-sm font-semibold">1</span>
                            <button 
                              className={`w-6 h-6 border-2 flex items-center justify-center text-sm ${
                                formData.button_style === 'pill' ? 'rounded-full' :
                                formData.button_style === 'sharp' ? 'rounded-none' : 'rounded-full'
                              }`}
                              style={{ borderColor: formData.brand_color || '#F97316', color: formData.brand_color || '#F97316' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        if (restaurant?.slug) {
                          window.open(`/menu/${restaurant.slug}`, '_blank');
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      View Live Menu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Button Customization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Order Button
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp_button_color">Button Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp_button_color"
                        type="color"
                        value={formData.whatsapp_button_color || '#00E061'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.whatsapp_button_color || '#00E061'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_color: e.target.value }))}
                        placeholder="#00E061"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Default: WhatsApp green (#00E061)</p>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_button_text_color">Button Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp_button_text_color"
                        type="color"
                        value={formData.whatsapp_button_text_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_text_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.whatsapp_button_text_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_text_color: e.target.value }))}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Color for button text and icon</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp_button_text">Button Text</Label>
                    <Input
                      id="whatsapp_button_text"
                      value={formData.whatsapp_button_text || 'Whatsapp'}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_text: e.target.value }))}
                      placeholder="Whatsapp"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Text displayed on the order button</p>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_button_style">Button Style</Label>
                    <Select 
                      value={formData.whatsapp_button_style || formData.button_style || 'rounded'} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, whatsapp_button_style: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rounded">Rounded Corners</SelectItem>
                        <SelectItem value="pill">Pill Shape (Fully Rounded)</SelectItem>
                        <SelectItem value="sharp">Sharp Corners</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Shape of the WhatsApp button</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="whatsapp_button_price_bg">Price Badge Background</Label>
                    <Input
                      id="whatsapp_button_price_bg"
                      value={formData.whatsapp_button_price_bg || 'rgba(255, 255, 255, 0.2)'}
                      onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_price_bg: e.target.value }))}
                      placeholder="rgba(255, 255, 255, 0.2)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Background for the price display badge</p>
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_button_price_color">Price Badge Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="whatsapp_button_price_color"
                        type="color"
                        value={formData.whatsapp_button_price_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_price_color: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={formData.whatsapp_button_price_color || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_button_price_color: e.target.value }))}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Color for the price text in the badge</p>
                  </div>
                </div>

                {/* WhatsApp Button Preview */}
                <div className="mt-6">
                  <Label>WhatsApp Button Preview</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="max-w-md mx-auto">
                      <button
                        className={`w-full font-bold py-4 px-6 flex items-center justify-center space-x-2 shadow-lg transition-colors ${
                          (formData.whatsapp_button_style || formData.button_style) === 'pill' ? 'rounded-full' :
                          (formData.whatsapp_button_style || formData.button_style) === 'sharp' ? 'rounded-none' : 'rounded-lg'
                        }`}
                        style={{ 
                          backgroundColor: formData.whatsapp_button_color || '#00E061',
                          color: formData.whatsapp_button_text_color || '#FFFFFF',
                          fontFamily: formData.font_family || 'Open Sans, sans-serif'
                        }}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span>{formData.whatsapp_button_text || 'Whatsapp'}</span>
                        <span 
                          className="px-2 py-1 rounded-full text-sm"
                          style={{
                            backgroundColor: formData.whatsapp_button_price_bg || 'rgba(255, 255, 255, 0.2)',
                            color: formData.whatsapp_button_price_color || '#FFFFFF'
                          }}
                        >
                          1,500 RWF
                        </span>
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This button appears at the bottom when customers add items to their cart
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <div className="grid gap-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{currentPackage?.name || 'No Package'}</h3>
                    <p className="text-sm text-muted-foreground">{currentPackage?.description}</p>
                  </div>
                  <Badge variant={subscriptionStatus.color as any}>
                    {subscriptionStatus.text}
                  </Badge>
                </div>

                {currentPackage && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{formatPrice(currentPackage.price)}</div>
                      <div className="text-sm text-muted-foreground">Monthly</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentPackage.max_menu_items}</div>
                      <div className="text-sm text-muted-foreground">Menu Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentPackage.max_tables}</div>
                      <div className="text-sm text-muted-foreground">Tables</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{currentPackage.trial_days}</div>
                      <div className="text-sm text-muted-foreground">Trial Days</div>
                    </div>
                  </div>
                )}

                {restaurant?.subscription_end_date && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Subscription Details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {restaurant.subscription_start_date && (
                        <div>
                          <span className="text-muted-foreground">Started:</span>
                          <div>{new Date(restaurant.subscription_start_date).toLocaleDateString()}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Expires:</span>
                        <div>{new Date(restaurant.subscription_end_date).toLocaleDateString()}</div>
                      </div>
                      {restaurant.trial_end_date && (
                        <div>
                          <span className="text-muted-foreground">Trial Ends:</span>
                          <div>{new Date(restaurant.trial_end_date).toLocaleDateString()}</div>
                        </div>
                      )}
                      {restaurant.grace_period_end_date && (
                        <div>
                          <span className="text-muted-foreground">Grace Period Ends:</span>
                          <div>{new Date(restaurant.grace_period_end_date).toLocaleDateString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Available Packages */}
            <Card>
              <CardHeader>
                <CardTitle>Available Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {packages.map((pkg) => (
                    <Card key={pkg.id} className={`shadow-card hover:shadow-elevated transition-all ${currentPackage?.id === pkg.id ? 'ring-2 ring-primary' : ''}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          {currentPackage?.id === pkg.id && (
                            <Badge variant="default">Current</Badge>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-primary">{formatPrice(pkg.price)}<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{pkg.description}</p>
                        <div className="space-y-1 text-sm">
                          <div>✓ {pkg.max_menu_items} Menu Items</div>
                          <div>✓ {pkg.max_tables} Tables</div>
                          <div>✓ {pkg.trial_days} Day Trial</div>
                          <div>✓ {pkg.grace_period_days} Day Grace Period</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-6">
            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{menuItemsCount}</div>
                    <div className="text-sm text-muted-foreground">Menu Items</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Limit: {currentPackage?.max_menu_items || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{tablesCount}</div>
                    <div className="text-sm text-muted-foreground">Tables</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Limit: {currentPackage?.max_tables || 'Unknown'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{categoriesCount}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      No limit
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 flex-col gap-2">
                    <Globe className="h-5 w-5" />
                    <span>View Public Menu</span>
                  </Button>
                  <Button variant="outline" className="h-16 flex-col gap-2">
                    <QrCode className="h-5 w-5" />
                    <span>Generate QR Codes</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Menu Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Menu URL</Label>
                    <Input value={getMenuUrl()} readOnly className="font-mono text-sm" />
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => window.open(getMenuUrl(), '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
                
                <div className="p-6 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-4">Preview with your current design:</h4>
                  <div 
                    className="w-full h-32 rounded border flex items-center justify-center"
                    style={{
                      background: formData.background_style === 'solid' 
                        ? formData.background_color
                        : formData.background_style === 'gradient'
                        ? `linear-gradient(135deg, ${formData.background_color}, ${formData.brand_color}20)`
                        : `${formData.background_color} radial-gradient(circle at 20% 80%, ${formData.brand_color}20 0%, transparent 50%)`,
                      fontFamily: formData.font_family || 'Inter'
                    }}
                  >
                    <div className="text-center">
                      <h2 className="text-xl font-bold mb-2" style={{ color: formData.brand_color }}>
                        {restaurant?.name || 'Restaurant Name'}
                      </h2>
                      <p className="text-sm opacity-75">Digital Menu</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <div className="grid gap-6">
            {/* URL Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  URL & Access Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Restaurant Slug (URL)</Label>
                  <Input
                    value={formData.slug || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="restaurant-name"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Your menu will be available at: <code>{window.location.origin}/menu/{formData.slug || 'your-slug'}/table-name</code>
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• QR codes use table names instead of IDs for easier management</li>
                    <li>• QR codes are generated once and won't regenerate unless deleted</li>
                    <li>• Deleted QR codes become invalid immediately</li>
                    <li>• Menu is only available when subscription is active</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Contact & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{restaurant?.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{restaurant?.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Save Button */}
        <div className="flex justify-end mt-8">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            variant="gradient"
            size="lg"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving Changes...' : 'Save All Settings'}
          </Button>
        </div>
      </Tabs>
    </div>
  </ModernDashboardLayout>
  );
};

export default RestaurantSettings;
