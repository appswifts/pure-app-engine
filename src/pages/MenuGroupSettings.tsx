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
import { Store, UtensilsCrossed, FolderTree, Settings, Trash2, Edit, GripVertical, Type, Palette, DollarSign } from "lucide-react";
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
import { CurrencyConversionDialog } from "@/components/ui/currency-conversion-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<string | null>(null);
  const [menuItemCount, setMenuItemCount] = useState(0);
  
  // Menu Group form
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    is_active: true,
    currency: "RWF",
  });

  // Customization form
  const [useCustomSettings, setUseCustomSettings] = useState(false);
  const [customizationForm, setCustomizationForm] = useState({
    brand_color: "",
    secondary_color: "",
    text_color: "",
    card_background: "",
    font_family: "",
    heading_font_family: "",
    heading_font_size: "",
    body_font_size: "",
    body_line_height: "",
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
    logo_border_width: "",
    logo_border_color: "",
    logo_border_radius: "",
    logo_show_border: false,
    card_background_color: "",
    card_border_color: "",
    card_border_radius: "",
    card_padding: "",
    item_name_color: "",
    item_name_font_size: "",
    item_name_font_weight: "",
    item_description_color: "",
    item_description_font_size: "",
    price_text_color: "",
    price_font_size: "",
    price_font_weight: "",
    global_border_radius: "",
    global_spacing: "",
    header_background_overlay: "",
    header_text_shadow: "",
    header_text_color: "",
    header_font_size: "",
    header_font_weight: "",
    add_button_bg_color: "",
    add_button_text_color: "",
    add_button_border_radius: "",
    add_button_hover_bg_color: "",
    quantity_button_bg_color: "",
    quantity_button_text_color: "",
    quantity_text_color: "",
    image_border_radius: "",
    image_aspect_ratio: "",
    cart_button_bg_color: "",
    cart_button_text_color: "",
    cart_button_border_radius: "",
    cart_dialog_bg_color: "",
    cart_dialog_header_bg_color: "",
    cart_dialog_header_text_color: "",
    cart_dialog_border_radius: "",
    cart_item_bg_color: "",
    cart_item_text_color: "",
    cart_remove_button_color: "",
    cart_total_text_color: "",
    cart_continue_button_bg: "",
    cart_continue_button_text_color: "",
    whatsapp_button_color: "",
    whatsapp_button_bg_color: "",
    whatsapp_button_text_color: "",
    whatsapp_button_text: "",
    whatsapp_button_style: "",
    whatsapp_button_border_radius: "",
    whatsapp_button_price_bg: "",
    whatsapp_button_price_color: "",
    category_button_bg_color: "",
    category_button_text_color: "",
    category_button_active_bg_color: "",
    category_button_active_text_color: "",
    category_button_border_radius: "",
    search_bg_color: "",
    search_text_color: "",
    search_border_radius: "",
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
        currency: (groupData as any).currency || "RWF",
      });

      // Load customization settings
      // Cast to any to access new customization fields from database
      const customGroup = groupData as any;
      
      // Check if show_animations is explicitly set (not null/undefined) as indicator of custom settings
      const hasCustomSettings = (customGroup.show_animations !== null && customGroup.show_animations !== undefined) || 
                                (customGroup.brand_color && customGroup.brand_color !== '') || 
                                (customGroup.font_family && customGroup.font_family !== '') || 
                                (customGroup.background_style && customGroup.background_style !== '') ||
                                (customGroup.card_style && customGroup.card_style !== '') ||
                                (customGroup.button_style && customGroup.button_style !== '');
      setUseCustomSettings(!!hasCustomSettings);
      
      setCustomizationForm({
        brand_color: customGroup.brand_color || "",
        secondary_color: customGroup.secondary_color || "",
        text_color: customGroup.text_color || "",
        card_background: customGroup.card_background || "",
        font_family: customGroup.font_family || "",
        heading_font_family: customGroup.heading_font_family || "",
        heading_font_size: customGroup.heading_font_size || "",
        body_font_size: customGroup.body_font_size || "",
        body_line_height: customGroup.body_line_height || "",
        background_style: customGroup.background_style || "",
        background_color: customGroup.background_color || "",
        background_image: customGroup.background_image || "",
        background_video: customGroup.background_video || "",
        background_youtube_url: customGroup.background_youtube_url || "",
        menu_layout: customGroup.menu_layout || "",
        card_style: customGroup.card_style || "",
        button_style: customGroup.button_style || "",
        card_shadow: customGroup.card_shadow || "",
        show_logo_border: customGroup.show_logo_border || false,
        show_animations: customGroup.show_animations !== false,
        logo_url: customGroup.logo_url || "",
        logo_border_width: customGroup.logo_border_width || "",
        logo_border_color: customGroup.logo_border_color || "",
        logo_border_radius: customGroup.logo_border_radius || "",
        logo_show_border: customGroup.logo_show_border || false,
        card_background_color: customGroup.card_background_color || "",
        card_border_color: customGroup.card_border_color || "",
        card_border_radius: customGroup.card_border_radius || "",
        card_padding: customGroup.card_padding || "",
        item_name_color: customGroup.item_name_color || "",
        item_name_font_size: customGroup.item_name_font_size || "",
        item_name_font_weight: customGroup.item_name_font_weight || "",
        item_description_color: customGroup.item_description_color || "",
        item_description_font_size: customGroup.item_description_font_size || "",
        price_text_color: customGroup.price_text_color || "",
        price_font_size: customGroup.price_font_size || "",
        price_font_weight: customGroup.price_font_weight || "",
        global_border_radius: customGroup.global_border_radius || "",
        global_spacing: customGroup.global_spacing || "",
        header_background_overlay: customGroup.header_background_overlay || "",
        header_text_shadow: customGroup.header_text_shadow || "",
        header_text_color: customGroup.header_text_color || "",
        header_font_size: customGroup.header_font_size || "",
        header_font_weight: customGroup.header_font_weight || "",
        add_button_bg_color: customGroup.add_button_bg_color || "",
        add_button_text_color: customGroup.add_button_text_color || "",
        add_button_border_radius: customGroup.add_button_border_radius || "",
        add_button_hover_bg_color: customGroup.add_button_hover_bg_color || "",
        quantity_button_bg_color: customGroup.quantity_button_bg_color || "",
        quantity_button_text_color: customGroup.quantity_button_text_color || "",
        quantity_text_color: customGroup.quantity_text_color || "",
        image_border_radius: customGroup.image_border_radius || "",
        image_aspect_ratio: customGroup.image_aspect_ratio || "",
        cart_button_bg_color: customGroup.cart_button_bg_color || "",
        cart_button_text_color: customGroup.cart_button_text_color || "",
        cart_button_border_radius: customGroup.cart_button_border_radius || "",
        cart_dialog_bg_color: customGroup.cart_dialog_bg_color || "",
        cart_dialog_header_bg_color: customGroup.cart_dialog_header_bg_color || "",
        cart_dialog_header_text_color: customGroup.cart_dialog_header_text_color || "",
        cart_dialog_border_radius: customGroup.cart_dialog_border_radius || "",
        cart_item_bg_color: customGroup.cart_item_bg_color || "",
        cart_item_text_color: customGroup.cart_item_text_color || "",
        cart_remove_button_color: customGroup.cart_remove_button_color || "",
        cart_total_text_color: customGroup.cart_total_text_color || "",
        cart_continue_button_bg: customGroup.cart_continue_button_bg || "",
        cart_continue_button_text_color: customGroup.cart_continue_button_text_color || "",
        whatsapp_button_color: customGroup.whatsapp_button_color || "",
        whatsapp_button_bg_color: customGroup.whatsapp_button_bg_color || "",
        whatsapp_button_text_color: customGroup.whatsapp_button_text_color || "",
        whatsapp_button_text: customGroup.whatsapp_button_text || "",
        whatsapp_button_style: customGroup.whatsapp_button_style || "",
        whatsapp_button_border_radius: customGroup.whatsapp_button_border_radius || "",
        whatsapp_button_price_bg: customGroup.whatsapp_button_price_bg || "",
        whatsapp_button_price_color: customGroup.whatsapp_button_price_color || "",
        category_button_bg_color: customGroup.category_button_bg_color || "",
        category_button_text_color: customGroup.category_button_text_color || "",
        category_button_active_bg_color: customGroup.category_button_active_bg_color || "",
        category_button_active_text_color: customGroup.category_button_active_text_color || "",
        category_button_border_radius: customGroup.category_button_border_radius || "",
        search_bg_color: customGroup.search_bg_color || "",
        search_text_color: customGroup.search_text_color || "",
        search_border_radius: customGroup.search_border_radius || "",
      });

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("menu_group_id", groupData.id)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Get menu item count for this group
      if (categoriesData && categoriesData.length > 0) {
        const categoryIds = categoriesData.map((c: any) => c.id);
        const { count } = await supabase
          .from("menu_items")
          .select("*", { count: "exact", head: true })
          .in("category_id", categoryIds);
        setMenuItemCount(count || 0);
      }
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

  const handleCurrencyChange = (newCurrency: string) => {
    const oldCurrency = menuGroup.currency || "RWF";
    
    // If currency changed and there are menu items, show confirmation dialog
    if (newCurrency !== oldCurrency && menuItemCount > 0) {
      setPendingCurrency(newCurrency);
      setShowCurrencyDialog(true);
    } else {
      // No items or same currency, just update
      setGroupForm({ ...groupForm, currency: newCurrency });
    }
  };

  const handleCurrencyConversion = async (convertPrices: boolean) => {
    if (!pendingCurrency) return;

    try {
      setLoading(true);
      const oldCurrency = menuGroup.currency || "RWF";

      // Update group currency
      const { error: groupError } = await (supabase as any)
        .from("menu_groups")
        .update({ currency: pendingCurrency })
        .eq("id", menuGroup.id);

      if (groupError) throw groupError;

      // If converting prices, get all category IDs for this group
      if (convertPrices && categories.length > 0) {
        const categoryIds = categories.map(c => c.id);
        
        // Fetch all menu items in this group
        const { data: items, error: itemsError } = await supabase
          .from("menu_items")
          .select("id, base_price")
          .in("category_id", categoryIds);

        if (itemsError) throw itemsError;

        // Simple exchange rate lookup (you can enhance this with real API)
        const exchangeRates: Record<string, number> = {
          "RWF": 1,
          "USD": 0.00077,
          "EUR": 0.00071,
          "GBP": 0.00061,
          "KES": 0.099,
          "UGX": 2.83,
          "TZS": 1.93,
        };

        const fromRate = exchangeRates[oldCurrency] || 1;
        const toRate = exchangeRates[pendingCurrency] || 1;
        const conversionFactor = toRate / fromRate;

        // Update each item's price
        const updates = (items || []).map(item => ({
          id: item.id,
          base_price: Math.round(item.base_price * conversionFactor * 100) / 100,
        }));

        // Batch update prices
        for (const update of updates) {
          await supabase
            .from("menu_items")
            .update({ base_price: update.base_price })
            .eq("id", update.id);
        }
      }

      setGroupForm({ ...groupForm, currency: pendingCurrency });
      setPendingCurrency(null);

      toast({
        title: "Currency updated successfully!",
        description: convertPrices 
          ? `Prices have been converted from ${oldCurrency} to ${pendingCurrency}`
          : `Currency changed to ${pendingCurrency}. Prices remain unchanged.`,
      });

      await loadData();
    } catch (error: any) {
      toast({
        title: "Error updating currency",
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
      const { error } = await (supabase as any)
        .from("menu_groups")
        .update({
          name: groupForm.name,
          description: groupForm.description,
          is_active: groupForm.is_active,
          currency: groupForm.currency,
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
        // Save ALL custom settings including new extended fields
        updateData = {
          // Brand Colors
          brand_color: customizationForm.brand_color || null,
          secondary_color: customizationForm.secondary_color || null,
          text_color: customizationForm.text_color || null,
          
          // Typography
          font_family: customizationForm.font_family || null,
          heading_font_family: customizationForm.heading_font_family || null,
          heading_font_size: customizationForm.heading_font_size || null,
          body_font_size: customizationForm.body_font_size || null,
          body_line_height: customizationForm.body_line_height || null,
          
          // Background
          background_style: customizationForm.background_style || null,
          background_color: customizationForm.background_color || null,
          background_image: customizationForm.background_image || null,
          background_video: customizationForm.background_video || null,
          background_youtube_url: customizationForm.background_youtube_url || null,
          
          // Layout
          menu_layout: customizationForm.menu_layout || null,
          card_style: customizationForm.card_style || null,
          button_style: customizationForm.button_style || null,
          card_shadow: customizationForm.card_shadow || null,
          
          // Global Spacing
          global_border_radius: customizationForm.global_border_radius || null,
          global_spacing: customizationForm.global_spacing || null,
          
          // Logo Customization
          logo_url: customizationForm.logo_url || null,
          logo_border_width: customizationForm.logo_border_width || null,
          logo_border_color: customizationForm.logo_border_color || null,
          logo_border_radius: customizationForm.logo_border_radius || null,
          logo_show_border: customizationForm.logo_show_border !== false,
          show_logo_border: customizationForm.show_logo_border !== false,
          
          // Header Customization
          header_background_overlay: customizationForm.header_background_overlay || null,
          header_text_shadow: customizationForm.header_text_shadow || false,
          header_text_color: customizationForm.header_text_color || null,
          header_font_size: customizationForm.header_font_size || null,
          header_font_weight: customizationForm.header_font_weight || null,
          
          // Card Customization
          card_background: customizationForm.card_background || null,
          card_background_color: customizationForm.card_background_color || null,
          card_border_color: customizationForm.card_border_color || null,
          card_border_radius: customizationForm.card_border_radius || null,
          card_padding: customizationForm.card_padding || null,
          
          // Item Text Customization
          item_name_color: customizationForm.item_name_color || null,
          item_name_font_size: customizationForm.item_name_font_size || null,
          item_name_font_weight: customizationForm.item_name_font_weight || null,
          item_description_color: customizationForm.item_description_color || null,
          item_description_font_size: customizationForm.item_description_font_size || null,
          
          // Price Customization
          price_text_color: customizationForm.price_text_color || null,
          price_font_size: customizationForm.price_font_size || null,
          price_font_weight: customizationForm.price_font_weight || null,
          
          // Add Button Customization
          add_button_bg_color: customizationForm.add_button_bg_color || null,
          add_button_text_color: customizationForm.add_button_text_color || null,
          add_button_border_radius: customizationForm.add_button_border_radius || null,
          add_button_hover_bg_color: customizationForm.add_button_hover_bg_color || null,
          
          // Quantity Control Customization
          quantity_button_bg_color: customizationForm.quantity_button_bg_color || null,
          quantity_button_text_color: customizationForm.quantity_button_text_color || null,
          quantity_text_color: customizationForm.quantity_text_color || null,
          
          // Image Customization
          image_border_radius: customizationForm.image_border_radius || null,
          image_aspect_ratio: customizationForm.image_aspect_ratio || null,
          
          // Cart Button Customization
          cart_border_color: customizationForm.cart_border_color || null,
          cart_total_text_color: customizationForm.cart_total_text_color || null,
          cart_continue_button_bg: customizationForm.cart_continue_button_bg || null,
          cart_continue_button_text_color: customizationForm.cart_continue_button_text_color || null,
          
          // Cart Dialog Customization
          cart_dialog_bg_color: customizationForm.cart_dialog_bg_color || null,
          cart_dialog_header_bg_color: customizationForm.cart_dialog_header_bg_color || null,
          cart_dialog_header_text_color: customizationForm.cart_dialog_header_text_color || null,
          cart_dialog_border_radius: customizationForm.cart_dialog_border_radius || null,
          cart_item_bg_color: customizationForm.cart_item_bg_color || null,
          cart_item_text_color: customizationForm.cart_item_text_color || null,
          cart_remove_button_color: customizationForm.cart_remove_button_color || null,
          
          // WhatsApp Button Customization
          whatsapp_button_color: customizationForm.whatsapp_button_color || null,
          whatsapp_button_text_color: customizationForm.whatsapp_button_text_color || null,
          whatsapp_button_text: customizationForm.whatsapp_button_text || null,
          whatsapp_button_style: customizationForm.whatsapp_button_style || null,
          whatsapp_button_price_bg: customizationForm.whatsapp_button_price_bg || null,
          whatsapp_button_price_color: customizationForm.whatsapp_button_price_color || null,
          whatsapp_button_bg_color: customizationForm.whatsapp_button_bg_color || null,
          whatsapp_button_border_radius: customizationForm.whatsapp_button_border_radius || null,
          
          // Category Button Customization
          category_button_bg_color: customizationForm.category_button_bg_color || null,
          category_button_text_color: customizationForm.category_button_text_color || null,
          category_button_active_bg_color: customizationForm.category_button_active_bg_color || null,
          category_button_active_text_color: customizationForm.category_button_active_text_color || null,
          category_button_border_radius: customizationForm.category_button_border_radius || null,
          
          // Search Bar Customization
          search_bg_color: customizationForm.search_bg_color || null,
          search_text_color: customizationForm.search_text_color || null,
          search_border_radius: customizationForm.search_border_radius || null,
          
          // Animations
          show_animations: customizationForm.show_animations !== false,
        };
      } else {
        // Clear ALL customization fields when disabled
        updateData = {
          brand_color: null,
          secondary_color: null,
          text_color: null,
          card_background: null,
          font_family: null,
          heading_font_family: null,
          heading_font_size: null,
          body_font_size: null,
          body_line_height: null,
          background_style: null,
          background_color: null,
          background_image: null,
          background_video: null,
          background_youtube_url: null,
          menu_layout: null,
          card_style: null,
          button_style: null,
          card_shadow: null,
          global_border_radius: null,
          global_spacing: null,
          show_logo_border: null,
          show_animations: null,
          logo_url: null,
          logo_border_width: null,
          logo_border_color: null,
          logo_border_radius: null,
          logo_show_border: null,
          header_background_overlay: null,
          header_text_shadow: null,
          header_text_color: null,
          header_font_size: null,
          header_font_weight: null,
          card_background_color: null,
          card_border_color: null,
          card_border_radius: null,
          card_padding: null,
          price_text_color: null,
          price_font_size: null,
          price_font_weight: null,
          add_button_bg_color: null,
          add_button_text_color: null,
          add_button_border_radius: null,
          add_button_hover_bg_color: null,
          quantity_button_bg_color: null,
          quantity_button_text_color: null,
          quantity_text_color: null,
          image_border_radius: null,
          image_aspect_ratio: null,
          cart_button_bg_color: null,
          cart_button_text_color: null,
          cart_button_border_radius: null,
          cart_dialog_bg_color: null,
          cart_dialog_header_bg_color: null,
          cart_dialog_header_text_color: null,
          cart_dialog_border_radius: null,
          cart_item_bg_color: null,
          cart_item_text_color: null,
          cart_remove_button_color: null,
          cart_border_color: null,
          cart_total_text_color: null,
          cart_continue_button_bg: null,
          cart_continue_button_text_color: null,
          whatsapp_button_color: null,
          whatsapp_button_text_color: null,
          whatsapp_button_text: null,
          whatsapp_button_style: null,
          whatsapp_button_price_bg: null,
          whatsapp_button_price_color: null,
          whatsapp_button_bg_color: null,
          whatsapp_button_border_radius: null,
          category_button_bg_color: null,
          category_button_text_color: null,
          category_button_active_bg_color: null,
          category_button_active_text_color: null,
          category_button_border_radius: null,
          search_bg_color: null,
          search_text_color: null,
          search_border_radius: null,
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
                  <div className="grid gap-2">
                    <Label htmlFor="group-currency" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Currency
                    </Label>
                    <Select
                      value={groupForm.currency}
                      onValueChange={handleCurrencyChange}
                    >
                      <SelectTrigger id="group-currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RWF">RWF - Rwandan Franc</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Currency for all menu items in this group. Default: RWF.
                      {menuItemCount > 0 && (
                        <span className="block mt-1 text-orange-600">
                          ⚠️ Changing currency will affect {menuItemCount} menu item{menuItemCount !== 1 ? 's' : ''}.
                        </span>
                      )}
                    </p>
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
                <Tabs defaultValue="global" className="w-full mt-6">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="global">🎨 Global Settings</TabsTrigger>
                    <TabsTrigger value="advanced">⚙️ Advanced Settings</TabsTrigger>
                  </TabsList>

                  {/* GLOBAL CUSTOMIZATION TAB */}
                  <TabsContent value="global" className="space-y-6">
                    {/* Brand Colors */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🎨</span>
                          Brand Colors
                        </CardTitle>
                        <CardDescription>Set primary colors that affect buttons, highlights, and accents across the menu</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Controls */}
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm font-medium mb-1 block">Brand Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={customizationForm.brand_color || '#F97316'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, brand_color: e.target.value})}
                                  className="h-9 w-16"
                                />
                                <Input
                                  type="text"
                                  value={customizationForm.brand_color || '#F97316'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, brand_color: e.target.value})}
                                  className="h-9 flex-1 font-mono text-sm"
                                  placeholder="#F97316"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium mb-1 block">Secondary Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={customizationForm.secondary_color || '#FFFFFF'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, secondary_color: e.target.value})}
                                  className="h-9 w-16"
                                />
                                <Input
                                  type="text"
                                  value={customizationForm.secondary_color || '#FFFFFF'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, secondary_color: e.target.value})}
                                  className="h-9 flex-1 font-mono text-sm"
                                  placeholder="#FFFFFF"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium mb-1 block">Text Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={customizationForm.text_color || '#000000'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, text_color: e.target.value})}
                                  className="h-9 w-16"
                                />
                                <Input
                                  type="text"
                                  value={customizationForm.text_color || '#000000'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, text_color: e.target.value})}
                                  className="h-9 flex-1 font-mono text-sm"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right: Live Preview */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Live Preview</Label>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                              <p className="text-xs text-muted-foreground mb-3 text-center">Color Palette</p>
                              
                              {/* Color swatches */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-950 rounded border">
                                  <div 
                                    className="w-12 h-12 rounded-lg border-2 shadow-sm"
                                    style={{ backgroundColor: customizationForm.brand_color || '#F97316' }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Brand</p>
                                    <p className="text-xs text-muted-foreground font-mono">{customizationForm.brand_color || '#F97316'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-950 rounded border">
                                  <div 
                                    className="w-12 h-12 rounded-lg border-2 shadow-sm"
                                    style={{ backgroundColor: customizationForm.secondary_color || '#FFFFFF' }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Secondary</p>
                                    <p className="text-xs text-muted-foreground font-mono">{customizationForm.secondary_color || '#FFFFFF'}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-950 rounded border">
                                  <div 
                                    className="w-12 h-12 rounded-lg border-2 shadow-sm"
                                    style={{ backgroundColor: customizationForm.text_color || '#000000' }}
                                  />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium">Text</p>
                                    <p className="text-xs text-muted-foreground font-mono">{customizationForm.text_color || '#000000'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Sample button */}
                              <div className="mt-3 text-center">
                                <button 
                                  className="px-4 py-2 rounded-lg text-sm font-medium"
                                  style={{ 
                                    backgroundColor: customizationForm.brand_color || '#F97316',
                                    color: '#FFFFFF'
                                  }}
                                >
                                  Sample Button
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  {/* Font & Typography */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Typography
                      </CardTitle>
                      <CardDescription>Choose fonts that match your restaurant's personality</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left: Font Controls */}
                        <div className="space-y-4">
                          {/* Body Font */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Body Font</Label>
                            <Select 
                              value={customizationForm.font_family || "default"}
                              onValueChange={(value) => setCustomizationForm({...customizationForm, font_family: value === "default" ? "" : value})}
                            >
                              <SelectTrigger className="w-full h-12">
                                <SelectValue placeholder="Select body font" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                <SelectItem value="default" className="font-sans">Default (System Font)</SelectItem>
                                
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sans-Serif</div>
                                <SelectItem value="Inter" className="h-12" style={{fontFamily: 'Inter'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Inter'}}>Inter</span>
                                    <span className="text-xs text-muted-foreground">Clean & Modern</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Poppins" className="h-12" style={{fontFamily: 'Poppins'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Poppins'}}>Poppins</span>
                                    <span className="text-xs text-muted-foreground">Friendly</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Roboto" className="h-12" style={{fontFamily: 'Roboto'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Roboto'}}>Roboto</span>
                                    <span className="text-xs text-muted-foreground">Universal</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Open Sans" className="h-12" style={{fontFamily: 'Open Sans'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Open Sans'}}>Open Sans</span>
                                    <span className="text-xs text-muted-foreground">Versatile</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Montserrat" className="h-12" style={{fontFamily: 'Montserrat'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Montserrat'}}>Montserrat</span>
                                    <span className="text-xs text-muted-foreground">Bold</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Lato" className="h-12" style={{fontFamily: 'Lato'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Lato'}}>Lato</span>
                                    <span className="text-xs text-muted-foreground">Classic</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Work Sans" className="h-12" style={{fontFamily: 'Work Sans'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Work Sans'}}>Work Sans</span>
                                    <span className="text-xs text-muted-foreground">Professional</span>
                                  </div>
                                </SelectItem>
                                
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Serif</div>
                                <SelectItem value="Playfair Display" className="h-12" style={{fontFamily: 'Playfair Display'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Playfair Display'}}>Playfair Display</span>
                                    <span className="text-xs text-muted-foreground">Elegant</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Merriweather" className="h-12" style={{fontFamily: 'Merriweather'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Merriweather'}}>Merriweather</span>
                                    <span className="text-xs text-muted-foreground">Traditional</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="Lora" className="h-12" style={{fontFamily: 'Lora'}}>
                                  <div className="flex items-center justify-between w-full">
                                    <span style={{fontFamily: 'Lora'}}>Lora</span>
                                    <span className="text-xs text-muted-foreground">Sophisticated</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Used for menu item descriptions and details
                            </p>
                          </div>

                          {/* Heading Font */}
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Heading Font</Label>
                            <Select 
                              value={customizationForm.heading_font_family || "default"}
                              onValueChange={(value) => setCustomizationForm({...customizationForm, heading_font_family: value === "default" ? "" : value})}
                            >
                              <SelectTrigger className="w-full h-12">
                                <SelectValue placeholder="Select heading font" />
                              </SelectTrigger>
                              <SelectContent className="max-h-80">
                                <SelectItem value="default" className="font-sans">Same as Body Font</SelectItem>
                                
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sans-Serif</div>
                                <SelectItem value="Inter" className="h-12" style={{fontFamily: 'Inter'}}>
                                  <span style={{fontFamily: 'Inter'}}>Inter</span>
                                </SelectItem>
                                <SelectItem value="Poppins" className="h-12" style={{fontFamily: 'Poppins'}}>
                                  <span style={{fontFamily: 'Poppins'}}>Poppins</span>
                                </SelectItem>
                                <SelectItem value="Montserrat" className="h-12" style={{fontFamily: 'Montserrat'}}>
                                  <span style={{fontFamily: 'Montserrat'}}>Montserrat</span>
                                </SelectItem>
                                
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Serif</div>
                                <SelectItem value="Playfair Display" className="h-12" style={{fontFamily: 'Playfair Display'}}>
                                  <span style={{fontFamily: 'Playfair Display'}}>Playfair Display</span>
                                </SelectItem>
                                <SelectItem value="Merriweather" className="h-12" style={{fontFamily: 'Merriweather'}}>
                                  <span style={{fontFamily: 'Merriweather'}}>Merriweather</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1.5">
                              Used for menu item names and section titles
                            </p>
                          </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">Live Preview</Label>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <div className="space-y-4">
                              {/* Menu Item Preview */}
                              <div className="bg-white dark:bg-gray-950 p-4 rounded-lg shadow-sm border">
                                <h3 
                                  className="text-lg font-bold mb-1"
                                  style={{ fontFamily: customizationForm.heading_font_family || customizationForm.font_family || 'inherit' }}
                                >
                                  Grilled Salmon
                                </h3>
                                <p 
                                  className="text-sm text-muted-foreground mb-2"
                                  style={{ fontFamily: customizationForm.font_family || 'inherit' }}
                                >
                                  Fresh Atlantic salmon with herbs and lemon butter sauce
                                </p>
                                <div 
                                  className="text-base font-semibold"
                                  style={{ 
                                    fontFamily: customizationForm.font_family || 'inherit',
                                    color: customizationForm.brand_color || '#F97316'
                                  }}
                                >
                                  12,500 RWF
                                </div>
                              </div>

                              {/* Category Preview */}
                              <div className="space-y-2">
                                <h4 
                                  className="text-sm font-semibold uppercase tracking-wide"
                                  style={{ fontFamily: customizationForm.heading_font_family || customizationForm.font_family || 'inherit' }}
                                >
                                  Main Courses
                                </h4>
                                <p 
                                  className="text-xs text-muted-foreground"
                                  style={{ fontFamily: customizationForm.font_family || 'inherit' }}
                                >
                                  All main courses served with sides
                                </p>
                              </div>

                              {/* Font Info */}
                              <div className="pt-3 border-t space-y-1">
                                <p className="text-xs font-medium">
                                  Heading: <span className="text-muted-foreground">{customizationForm.heading_font_family || customizationForm.font_family || 'Default'}</span>
                                </p>
                                <p className="text-xs font-medium">
                                  Body: <span className="text-muted-foreground">{customizationForm.font_family || 'Default'}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card & Button Styling */}
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">🎴</span>
                        Layout & Styling
                      </CardTitle>
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
                  <Card className="border-2 hover:border-primary/50 transition-colors">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">🖼️</span>
                        Background
                      </CardTitle>
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

                      {customizationForm.background_style === 'image' && (
                        <div className="space-y-3">
                          <Label htmlFor="bg-image" className="text-base font-semibold">Background Image</Label>
                          <p className="text-sm text-muted-foreground mb-2">Enter image URL for menu background (Note: Background is fixed, won't scroll)</p>
                          <Input
                            id="bg-image"
                            type="url"
                            value={customizationForm.background_image || ''}
                            onChange={(e) => setCustomizationForm({...customizationForm, background_image: e.target.value})}
                            placeholder="https://example.com/your-background.jpg"
                            className="h-12"
                          />
                          {customizationForm.background_image && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-2">Preview:</p>
                              <div 
                                className="w-full h-32 rounded-lg border-2 border-gray-200 bg-cover bg-center"
                                style={{ backgroundImage: `url(${customizationForm.background_image})` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {customizationForm.background_style === 'gradient' && (
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Gradient Colors</Label>
                          <p className="text-sm text-muted-foreground mb-2">Two colors that will blend smoothly (Note: Background is fixed, won't scroll)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Start Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.background_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, background_color: e.target.value})}
                                className="h-12 w-full cursor-pointer"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">End Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.secondary_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, secondary_color: e.target.value})}
                                className="h-12 w-full cursor-pointer"
                              />
                            </div>
                          </div>
                          <div 
                            className="w-full h-20 rounded-lg border-2 border-gray-200 mt-3"
                            style={{ 
                              backgroundImage: `linear-gradient(135deg, ${customizationForm.background_color || customizationForm.brand_color || '#F97316'}, ${customizationForm.secondary_color || customizationForm.brand_color || '#F97316'})`
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                    {/* Global Border Radius */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">⭕</span>
                          Global Roundness
                        </CardTitle>
                        <CardDescription>Set the overall roundness level for all elements</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Roundness Level</Label>
                          <select
                            value={customizationForm.global_border_radius || ''}
                            onChange={(e) => setCustomizationForm({...customizationForm, global_border_radius: e.target.value})}
                            className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base font-medium cursor-pointer"
                          >
                            <option value="">Default</option>
                            <option value="none">None - Sharp Corners</option>
                            <option value="sm">Small - Slightly Rounded</option>
                            <option value="md">Medium - Moderately Rounded</option>
                            <option value="lg">Large - Very Rounded</option>
                            <option value="xl">Extra Large - Maximum Roundness</option>
                            <option value="full">Full - Circular/Pills</option>
                          </select>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ADVANCED CUSTOMIZATION TAB */}
                  <TabsContent value="advanced" className="space-y-6">
                    
                    {/* ========== SECTION 1: HEADER ========== */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-blue-900 dark:text-blue-100">
                        <span className="text-3xl">📱</span>
                        SECTION 1: Header (Logo + Restaurant Name)
                      </h2>
                      <p className="text-blue-700 dark:text-blue-300 mt-2">
                        Customize how your logo and restaurant name appear at the top of the menu
                      </p>
                    </div>

                    {/* Logo Customization */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 border-b">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🏷️</span>
                          Logo Styling
                        </CardTitle>
                        <CardDescription>Customize how your logo appears</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Left: Controls */}
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Border Width</Label>
                              <Input
                                type="text"
                                placeholder="4px"
                                value={customizationForm.logo_border_width || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, logo_border_width: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Border Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={customizationForm.logo_border_color || customizationForm.brand_color || '#F97316'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, logo_border_color: e.target.value})}
                                  className="w-16 h-10"
                                />
                                <Input
                                  type="text"
                                  value={customizationForm.logo_border_color || customizationForm.brand_color || '#F97316'}
                                  onChange={(e) => setCustomizationForm({...customizationForm, logo_border_color: e.target.value})}
                                  className="flex-1"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Border Radius</Label>
                              <select
                                value={customizationForm.logo_border_radius || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, logo_border_radius: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default (Full Circle)</option>
                                <option value="rounded-none">Square</option>
                                <option value="rounded-lg">Rounded</option>
                                <option value="rounded-full">Circle</option>
                              </select>
                            </div>
                          </div>

                          {/* Right: Live Preview */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Live Preview</Label>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center min-h-[200px]">
                              <div className="text-center">
                                <div 
                                  className="w-24 h-24 mx-auto flex items-center justify-center bg-white dark:bg-gray-950 text-4xl font-bold"
                                  style={{
                                    border: `${customizationForm.logo_border_width || '4px'} solid ${customizationForm.logo_border_color || customizationForm.brand_color || '#F97316'}`,
                                    borderRadius: customizationForm.logo_border_radius === 'rounded-none' ? '0' :
                                                 customizationForm.logo_border_radius === 'rounded-lg' ? '0.5rem' :
                                                 customizationForm.logo_border_radius === 'rounded-full' ? '9999px' : '9999px'
                                  }}
                                >
                                  🍕
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">Restaurant Logo</p>
                                <p className="text-xs font-mono mt-1">
                                  {customizationForm.logo_border_width || '4px'} • {customizationForm.logo_border_radius || 'Circle'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ========== SECTION 2: MENU ITEM CARDS ========== */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-6 rounded-xl border-2 border-green-200 dark:border-green-800 mt-8">
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-green-900 dark:text-green-100">
                        <span className="text-3xl">🃏</span>
                        SECTION 2: Menu Item Cards
                      </h2>
                      <p className="text-green-700 dark:text-green-300 mt-2">
                        Customize every element of menu item cards: background, borders, item name, description, price, images, buttons, and variations/extras
                      </p>
                    </div>

                    {/* Card Item Customization */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📦</span>
                          Card Container
                        </CardTitle>
                        <CardDescription>Customize the appearance of menu item cards</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Background Color</Label>
                            <Input
                              type="color"
                              value={customizationForm.card_background_color || '#FFFFFF'}
                              onChange={(e) => setCustomizationForm({...customizationForm, card_background_color: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Color</Label>
                            <Input
                              type="color"
                              value={customizationForm.card_border_color || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, card_border_color: e.target.value})}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <select
                              value={customizationForm.card_border_radius || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, card_border_radius: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="rounded-none">Square</option>
                              <option value="rounded-md">Small</option>
                              <option value="rounded-lg">Medium</option>
                              <option value="rounded-xl">Large</option>
                              <option value="rounded-2xl">Extra Large</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Padding</Label>
                            <select
                              value={customizationForm.card_padding || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, card_padding: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="p-2">Compact</option>
                              <option value="p-4">Normal</option>
                              <option value="p-6">Spacious</option>
                              <option value="p-8">Extra Spacious</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Item Text Customization */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">✏️</span>
                          Item Name & Description
                        </CardTitle>
                        <CardDescription>Customize item text appearance</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Item Name */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Item Name</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.item_name_color || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, item_name_color: e.target.value})}
                                placeholder="Optional"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Font Size</Label>
                              <select
                                value={customizationForm.item_name_font_size || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, item_name_font_size: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="text-sm">Small</option>
                                <option value="text-base">Base</option>
                                <option value="text-lg">Large</option>
                                <option value="text-xl">Extra Large</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Font Weight</Label>
                              <select
                                value={customizationForm.item_name_font_weight || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, item_name_font_weight: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="font-normal">Normal</option>
                                <option value="font-medium">Medium</option>
                                <option value="font-semibold">Semi-Bold</option>
                                <option value="font-bold">Bold</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Item Description */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Item Description</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.item_description_color || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, item_description_color: e.target.value})}
                                placeholder="Optional"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Font Size</Label>
                              <select
                                value={customizationForm.item_description_font_size || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, item_description_font_size: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="text-xs">Extra Small</option>
                                <option value="text-sm">Small</option>
                                <option value="text-base">Base</option>
                                <option value="text-lg">Large</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Price Customization */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          Price Display
                        </CardTitle>
                        <CardDescription>Customize how prices are displayed</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <Input
                              type="color"
                              value={customizationForm.price_text_color || customizationForm.brand_color || '#F97316'}
                              onChange={(e) => setCustomizationForm({...customizationForm, price_text_color: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Font Size</Label>
                            <select
                              value={customizationForm.price_font_size || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, price_font_size: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="text-sm">Small</option>
                              <option value="text-base">Base</option>
                              <option value="text-lg">Large</option>
                              <option value="text-xl">Extra Large</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Font Weight</Label>
                            <select
                              value={customizationForm.price_font_weight || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, price_font_weight: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="font-normal">Normal</option>
                              <option value="font-semibold">Semi-Bold</option>
                              <option value="font-bold">Bold</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Button Customizations */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🔘</span>
                          Button Styling
                        </CardTitle>
                        <CardDescription>Customize Add, Quantity, Cart, and WhatsApp buttons</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Add Button */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Add Button</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Background</Label>
                              <Input
                                type="color"
                                value={customizationForm.add_button_bg_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, add_button_bg_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.add_button_text_color || '#FFFFFF'}
                                onChange={(e) => setCustomizationForm({...customizationForm, add_button_text_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Border Radius</Label>
                              <select
                                value={customizationForm.add_button_border_radius || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, add_button_border_radius: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="rounded-none">Square</option>
                                <option value="rounded-md">Rounded</option>
                                <option value="rounded-lg">Large</option>
                                <option value="rounded-full">Pill</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Quantity Controls (+/-)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Button Background</Label>
                              <Input
                                type="color"
                                value={customizationForm.quantity_button_bg_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, quantity_button_bg_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Button Text</Label>
                              <Input
                                type="color"
                                value={customizationForm.quantity_button_text_color || '#FFFFFF'}
                                onChange={(e) => setCustomizationForm({...customizationForm, quantity_button_text_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Number Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.quantity_text_color || '#000000'}
                                onChange={(e) => setCustomizationForm({...customizationForm, quantity_text_color: e.target.value})}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cart Button */}
                        <div className="space-y-3">
                          <h4 className="font-medium">Cart Button (View Order)</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Background</Label>
                              <Input
                                type="color"
                                value={customizationForm.cart_button_bg_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, cart_button_bg_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.cart_button_text_color || '#FFFFFF'}
                                onChange={(e) => setCustomizationForm({...customizationForm, cart_button_text_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Border Radius</Label>
                              <select
                                value={customizationForm.cart_button_border_radius || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, cart_button_border_radius: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="rounded-none">Square</option>
                                <option value="rounded-md">Rounded</option>
                                <option value="rounded-lg">Large</option>
                                <option value="rounded-full">Pill</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Button */}
                        <div className="space-y-3">
                          <h4 className="font-medium">WhatsApp Order Button</h4>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Background</Label>
                              <Input
                                type="color"
                                value={customizationForm.whatsapp_button_bg_color || customizationForm.brand_color || '#F97316'}
                                onChange={(e) => setCustomizationForm({...customizationForm, whatsapp_button_bg_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Text Color</Label>
                              <Input
                                type="color"
                                value={customizationForm.whatsapp_button_text_color || '#FFFFFF'}
                                onChange={(e) => setCustomizationForm({...customizationForm, whatsapp_button_text_color: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Border Radius</Label>
                              <select
                                value={customizationForm.whatsapp_button_border_radius || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, whatsapp_button_border_radius: e.target.value})}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                              >
                                <option value="">Default</option>
                                <option value="rounded-none">Square</option>
                                <option value="rounded-md">Rounded</option>
                                <option value="rounded-lg">Large</option>
                                <option value="rounded-full">Pill</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ========== SECTION 3: CART & NAVIGATION ========== */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6 rounded-xl border-2 border-purple-200 dark:border-purple-800 mt-8">
                      <h2 className="text-2xl font-bold flex items-center gap-3 text-purple-900 dark:text-purple-100">
                        <span className="text-3xl">🛒</span>
                        SECTION 3: Cart & Navigation
                      </h2>
                      <p className="text-purple-700 dark:text-purple-300 mt-2">
                        Customize cart dialog, floating cart button, category navigation, and order actions
                      </p>
                    </div>

                    {/* Category Buttons */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📑</span>
                          Category Navigation
                        </CardTitle>
                        <CardDescription>Customize category button appearance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Controls */}
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Inactive State</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Background</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.category_button_bg_color || '#FFFFFF'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, category_button_bg_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Text</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.category_button_text_color || '#374151'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, category_button_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Active State</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Background</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.category_button_active_bg_color || customizationForm.brand_color || '#F97316'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, category_button_active_bg_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Text</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.category_button_active_text_color || '#FFFFFF'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, category_button_active_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Border Radius</Label>
                              <select
                                value={customizationForm.category_button_border_radius || ''}
                                onChange={(e) => setCustomizationForm({...customizationForm, category_button_border_radius: e.target.value})}
                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                              >
                                <option value="">Default (rounded-lg)</option>
                                <option value="rounded-none">Square</option>
                                <option value="rounded-md">Rounded</option>
                                <option value="rounded-lg">Large</option>
                                <option value="rounded-full">Pill</option>
                              </select>
                            </div>
                          </div>

                          {/* Right: Live Preview */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Live Preview</Label>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                              <p className="text-xs text-muted-foreground mb-3 text-center">Category Buttons</p>
                              <div className="flex flex-wrap gap-2 justify-center">
                                {/* Inactive Button Example */}
                                <button
                                  className={`px-4 py-2 text-sm font-medium transition-colors ${customizationForm.category_button_border_radius || 'rounded-lg'}`}
                                  style={{
                                    backgroundColor: customizationForm.category_button_bg_color || '#FFFFFF',
                                    color: customizationForm.category_button_text_color || '#374151'
                                  }}
                                >
                                  Inactive
                                </button>
                                
                                {/* Active Button Example */}
                                <button
                                  className={`px-4 py-2 text-sm font-medium transition-colors ring-2 ring-offset-2 ${customizationForm.category_button_border_radius || 'rounded-lg'}`}
                                  style={{
                                    backgroundColor: customizationForm.category_button_active_bg_color || customizationForm.brand_color || '#F97316',
                                    color: customizationForm.category_button_active_text_color || '#FFFFFF',
                                    '--tw-ring-color': customizationForm.category_button_active_bg_color || customizationForm.brand_color || '#F97316'
                                  } as React.CSSProperties}
                                >
                                  Active ✓
                                </button>
                              </div>
                              
                              <div className="mt-4 space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800">
                                  <span className="text-muted-foreground">Inactive:</span>
                                  <div className="flex gap-2 items-center">
                                    <div 
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: customizationForm.category_button_bg_color || '#FFFFFF' }}
                                    />
                                    <span className="font-mono text-xs">{customizationForm.category_button_bg_color || '#FFFFFF'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 rounded border border-gray-200 dark:border-gray-800">
                                  <span className="text-muted-foreground">Active:</span>
                                  <div className="flex gap-2 items-center">
                                    <div 
                                      className="w-4 h-4 rounded border border-gray-300"
                                      style={{ backgroundColor: customizationForm.category_button_active_bg_color || customizationForm.brand_color || '#F97316' }}
                                    />
                                    <span className="font-mono text-xs">{customizationForm.category_button_active_bg_color || customizationForm.brand_color || '#F97316'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Cart Dialog */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🛒</span>
                          Cart Dialog - Full Control
                        </CardTitle>
                        <CardDescription>Customize every element in the order review modal</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Controls */}
                          <div className="space-y-4">
                            {/* Dialog Colors */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Dialog Colors</Label>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Background</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_dialog_bg_color || '#FFFFFF'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_dialog_bg_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Header Background</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_dialog_header_bg_color || customizationForm.brand_color || '#F97316'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_dialog_header_bg_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Header Text Color</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_dialog_header_text_color || '#000000'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_dialog_header_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Cart Item Cards */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Cart Item Cards</Label>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Card Background</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_item_bg_color || '#F9FAFB'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_item_bg_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_item_text_color || '#000000'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_item_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Remove Button</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_remove_button_color || '#EF4444'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_remove_button_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Total & Buttons */}
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Total & Buttons</Label>
                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Total Text Color</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_total_text_color || '#000000'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_total_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Continue Button BG</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_continue_button_bg || '#FFFFFF'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_continue_button_bg: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Continue Button Text</Label>
                                  <Input
                                    type="color"
                                    value={customizationForm.cart_continue_button_text_color || '#000000'}
                                    onChange={(e) => setCustomizationForm({...customizationForm, cart_continue_button_text_color: e.target.value})}
                                    className="h-8 w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Live Preview */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">Live Preview</Label>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                              <p className="text-xs text-muted-foreground mb-2 text-center">Cart Dialog</p>
                              
                              {/* Mini cart preview */}
                              <div 
                                className="rounded-lg p-3 text-xs"
                                style={{ backgroundColor: customizationForm.cart_dialog_bg_color || '#FFFFFF' }}
                              >
                                {/* Header */}
                                <div 
                                  className="flex justify-between items-center mb-2 -mx-3 -mt-3 px-3 py-2 rounded-t-lg"
                                  style={{ backgroundColor: customizationForm.cart_dialog_header_bg_color || customizationForm.brand_color || '#F97316' }}
                                >
                                  <span 
                                    className="font-medium"
                                    style={{ color: customizationForm.cart_dialog_header_text_color || '#000000' }}
                                  >
                                    Your Order
                                  </span>
                                  <span 
                                    className="text-xs"
                                    style={{ color: customizationForm.cart_dialog_header_text_color || '#000000' }}
                                  >
                                    ✕
                                  </span>
                                </div>

                                {/* Cart Item */}
                                <div 
                                  className="flex justify-between items-center p-2 rounded mb-2"
                                  style={{ 
                                    backgroundColor: customizationForm.cart_item_bg_color || '#F9FAFB',
                                    color: customizationForm.cart_item_text_color || '#000000'
                                  }}
                                >
                                  <span>Item Name</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">$10</span>
                                    <span 
                                      className="text-xs"
                                      style={{ color: customizationForm.cart_remove_button_color || '#EF4444' }}
                                    >
                                      ✕
                                    </span>
                                  </div>
                                </div>

                                {/* Total */}
                                <div 
                                  className="flex justify-between font-bold py-2 border-t"
                                  style={{ 
                                    color: customizationForm.cart_total_text_color || '#000000',
                                    borderColor: customizationForm.cart_item_bg_color || '#E5E7EB'
                                  }}
                                >
                                  <span>Total:</span>
                                  <span>$10</span>
                                </div>

                                {/* Buttons */}
                                <div className="flex gap-2 mt-2">
                                  <div 
                                    className="flex-1 text-center py-1 px-2 rounded text-xs"
                                    style={{ 
                                      backgroundColor: customizationForm.cart_continue_button_bg || '#FFFFFF',
                                      color: customizationForm.cart_continue_button_text_color || '#000000',
                                      border: '1px solid #D1D5DB'
                                    }}
                                  >
                                    Continue
                                  </div>
                                  <div 
                                    className="flex-1 text-center py-1 px-2 rounded text-xs text-white"
                                    style={{ backgroundColor: customizationForm.whatsapp_button_bg_color || customizationForm.brand_color || '#25D366' }}
                                  >
                                    Order
                                  </div>
                                </div>
                              </div>

                              {/* Color codes */}
                              <div className="mt-3 space-y-1 text-xs">
                                <div className="flex justify-between items-center p-1 bg-white dark:bg-gray-950 rounded">
                                  <span className="text-muted-foreground">Dialog:</span>
                                  <span className="font-mono text-xs">{customizationForm.cart_dialog_bg_color || '#FFFFFF'}</span>
                                </div>
                                <div className="flex justify-between items-center p-1 bg-white dark:bg-gray-950 rounded">
                                  <span className="text-muted-foreground">Items:</span>
                                  <span className="font-mono text-xs">{customizationForm.cart_item_bg_color || '#F9FAFB'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Image Styling */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🖼️</span>
                          Menu Item Images
                        </CardTitle>
                        <CardDescription>Customize how item images appear</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <select
                              value={customizationForm.image_border_radius || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, image_border_radius: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="rounded-none">Square</option>
                              <option value="rounded-md">Small</option>
                              <option value="rounded-lg">Medium</option>
                              <option value="rounded-xl">Large</option>
                              <option value="rounded-full">Circle</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Search Bar */}
                    <Card className="border-2 hover:border-primary/50 transition-colors">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">🔍</span>
                          Search Bar
                        </CardTitle>
                        <CardDescription>Customize the search input</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Background</Label>
                            <Input
                              type="color"
                              value={customizationForm.search_bg_color || 'rgba(255,255,255,0.9)'}
                              onChange={(e) => setCustomizationForm({...customizationForm, search_bg_color: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Text Color</Label>
                            <Input
                              type="color"
                              value={customizationForm.search_text_color || '#000000'}
                              onChange={(e) => setCustomizationForm({...customizationForm, search_text_color: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Border Radius</Label>
                            <select
                              value={customizationForm.search_border_radius || ''}
                              onChange={(e) => setCustomizationForm({...customizationForm, search_border_radius: e.target.value})}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                            >
                              <option value="">Default</option>
                              <option value="rounded-none">Square</option>
                              <option value="rounded-md">Small</option>
                              <option value="rounded-lg">Medium</option>
                              <option value="rounded-full">Pill</option>
                            </select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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

        {/* Currency Conversion Dialog */}
        <CurrencyConversionDialog
          open={showCurrencyDialog}
          onOpenChange={setShowCurrencyDialog}
          oldCurrency={menuGroup?.currency || "RWF"}
          newCurrency={pendingCurrency || "RWF"}
          itemCount={menuItemCount}
          onConfirm={handleCurrencyConversion}
        />
      </div>
    </ModernDashboardLayout>
  );
}
