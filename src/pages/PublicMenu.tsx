import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RestrictedMenuView from "@/components/RestrictedMenuView";
import { SafeImage } from "@/components/ui/safe-image";
import { supabaseCache } from "@/lib/supabaseCache";
import CacheStatusIndicator from "@/components/CacheStatusIndicator";

// ===== INTERFACES =====
interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  brand_color?: string;
  secondary_color?: string;
  text_color?: string;
  font_family?: string;
  background_style?: string;
  background_color?: string;
  background_image?: string;
  card_style?: string;
  button_style?: string;
  card_shadow?: string;
  logo_url?: string;
  slug?: string;
  whatsapp_button_color?: string;
  whatsapp_button_text_color?: string;
  whatsapp_button_text?: string;
  subscription_status?: 'active' | 'pending' | 'expired' | 'cancelled';
  subscription_end_date?: string;
  is_menu_active?: boolean;
}

interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  // Added properties
  logo_url?: string;
  payment_instructions?: string;
  restaurant_id?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  // Base customization
  brand_color?: string;
  secondary_color?: string;
  text_color?: string;
  font_family?: string;
  background_color?: string;
  background_style?: string;
  background_image?: string;
  card_style?: string;
  button_style?: string;
  // Logo customization
  logo_border_width?: string;
  logo_border_color?: string;
  logo_border_radius?: string;
  logo_show_border?: boolean;
  // Card customization
  card_background_color?: string;
  card_border_color?: string;
  card_border_radius?: string;
  card_padding?: string;
  // Item text customization
  item_name_color?: string;
  item_name_font_size?: string;
  item_name_font_weight?: string;
  item_description_color?: string;
  item_description_font_size?: string;
  // Price customization
  price_text_color?: string;
  price_font_size?: string;
  price_font_weight?: string;
  // Add button customization
  add_button_bg_color?: string;
  add_button_text_color?: string;
  add_button_border_radius?: string;
  add_button_hover_bg_color?: string;
  // Quantity control customization
  quantity_button_bg_color?: string;
  quantity_button_text_color?: string;
  quantity_text_color?: string;
  // Image customization
  image_border_radius?: string;
  image_aspect_ratio?: string;
  // Cart button customization
  cart_button_bg_color?: string;
  cart_button_text_color?: string;
  cart_button_border_radius?: string;
  // Cart dialog customization
  cart_dialog_bg_color?: string;
  cart_dialog_header_bg_color?: string;
  cart_dialog_header_text_color?: string;
  cart_dialog_border_radius?: string;
  cart_item_bg_color?: string;
  cart_item_text_color?: string;
  cart_remove_button_color?: string;
  cart_border_color?: string;
  cart_total_text_color?: string;
  cart_continue_button_bg?: string;
  cart_continue_button_text_color?: string;
  // WhatsApp button customization
  whatsapp_button_bg_color?: string;
  whatsapp_button_text_color?: string;
  whatsapp_button_border_radius?: string;
  // Category button customization
  category_button_bg_color?: string;
  category_button_text_color?: string;
  category_button_active_bg_color?: string;
  category_button_active_text_color?: string;
  category_button_border_radius?: string;
  // Global typography
  heading_font_family?: string;
  heading_font_size?: string;
  body_font_size?: string;
  body_line_height?: string;
  // Global spacing
  global_border_radius?: string;
  global_spacing?: string;
  // Header customization
  header_background_overlay?: string;
  header_text_shadow?: boolean;
  // Search bar customization
  search_bg_color?: string;
  search_text_color?: string;
  search_border_radius?: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  menu_group_id?: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
}

interface ItemVariation {
  id: string;
  menu_item_id: string;
  name: string;
  price_modifier: number;
}

interface Accompaniment {
  id: string;
  menu_item_id: string;
  name: string;
  price: number;
}

interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  variation?: ItemVariation;
  accompaniments: Accompaniment[];
  totalPrice: number;
}

// ===== MAIN COMPONENT =====
const PublicMenu = () => {
  const { restaurantSlug, tableSlug, tableId, groupSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [selectedMenuGroup, setSelectedMenuGroup] = useState<MenuGroup | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [variations, setVariations] = useState<ItemVariation[]>([]);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const [isGroupPreselected, setIsGroupPreselected] = useState(false);

  // ===== LOAD DATA =====
  useEffect(() => {
    if (restaurantSlug) {
      loadMenuData();
    }
  }, [restaurantSlug]);

  // Reset category selection when menu group changes
  useEffect(() => {
    setSelectedCategory(null);
  }, [selectedMenuGroup]);

  const loadMenuData = async () => {
    try {
      setLoading(true);

      // Load restaurant data
      const { data: restaurantDataRaw, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', restaurantSlug!)
        .single();

      if (restaurantError || !restaurantDataRaw) {
        console.error('Restaurant not found:', restaurantError);
        setLoading(false);
        return;
      }

      const restaurantData = restaurantDataRaw as any;

      // Load restaurant owner's subscription with package features
      const { data: subscriptionData, error: subError } = await (supabase as any)
        .from('user_subscriptions')
        .select(`
          *,
          package:subscription_packages!user_subscriptions_package_name_fkey(
            feature_public_menu_access,
            feature_qr_codes,
            feature_whatsapp_orders,
            feature_analytics,
            feature_custom_branding,
            feature_priority_support,
            feature_multiple_restaurants,
            feature_api_access,
            max_restaurants,
            max_menu_items
          )
        `)
        .eq('user_id', restaurantData.user_id)
        .in('status', ['active', 'pending', 'cancelled']) // Include cancelled subscriptions
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Enhanced subscription check logic
      // 1. First check if subscription exists and is active
      // Cancelled subscriptions should NEVER be considered active
      const hasActiveSubscription = subscriptionData && 
        subscriptionData.status !== 'cancelled' && (
          subscriptionData.status === 'active' ||
          (
            subscriptionData.status === 'pending' &&
            subscriptionData.started_at &&
            new Date(subscriptionData.started_at) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ) ||
          (
            subscriptionData.status === 'expired' &&
            subscriptionData.expires_at &&
            new Date(subscriptionData.expires_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        );

      // 2. Check if subscription package allows public menu access
      // Don't allow access for cancelled subscriptions even if their package allows it
      const packageAllowsMenuAccess = 
        (subscriptionData?.status !== 'cancelled' && subscriptionData?.package?.feature_public_menu_access === true) || 
        (!subscriptionData && process.env.NODE_ENV === 'development'); // Allow access in dev if no subscription data
      
      console.log('Subscription check:', { 
        hasActiveSubscription, 
        packageAllowsMenuAccess,
        subscriptionData: subscriptionData ? {
          status: subscriptionData.status,
          package: subscriptionData.package?.feature_public_menu_access
        } : 'No subscription data'
      });

      // 3. Override access for specific restaurants if needed (for compatibility)
      // But never allow access if subscription is explicitly cancelled
      const forceAccess = subscriptionData?.status !== 'cancelled' && 
                        (restaurantData?.is_menu_active === true || 
                         process.env.NODE_ENV === 'development');
      
      // When user has an active subscription, all their restaurant menus should be live
      // regardless of their explicit is_menu_active setting
      // But NEVER allow access if subscription is cancelled
      const isMenuAccessible = hasActiveSubscription || forceAccess;
      
      // Update the restaurant's is_menu_active flag in memory to reflect subscription status
      if (restaurantData) {
        restaurantData.is_menu_active = isMenuAccessible;  
      }

      if (!isMenuAccessible) {
        setRestaurant(restaurantData as Restaurant);
        let message = 'This menu is currently unavailable.';
        let reason = '';
        let status = '';
        let showPaymentButton = true;
        let paymentAction = 'subscribe';
        
        if (!subscriptionData) {
          message = 'The restaurant owner needs to activate their subscription.';
          reason = 'This restaurant requires a valid subscription';
          status = 'no_subscription';
        } else if (!packageAllowsMenuAccess) {
          message = 'The restaurant owner\'s subscription plan needs an upgrade.';
          reason = 'Current plan does not include public menu access';
          status = 'plan_limitation';
          paymentAction = 'upgrade';
        } else if (subscriptionData.status === 'expired') {
          message = 'The restaurant owner\'s subscription has expired.';
          reason = 'Subscription expired and needs renewal';
          status = 'trial_expired';
          paymentAction = 'reactivate';
        } else if (subscriptionData.status === 'cancelled') {
          message = 'The restaurant owner\'s subscription has been cancelled by an admin.';
          reason = 'Subscription has been cancelled and requires reactivation';
          status = 'cancelled';
          paymentAction = 'reactivate';
        } else if (subscriptionData.status === 'pending') {
          message = 'The restaurant owner\'s subscription is pending activation.';
          reason = 'Subscription payment is being processed';
          status = 'pending_payment';
          paymentAction = 'complete_payment';
        } else {
          message = 'The restaurant\'s subscription status is invalid.';
          reason = 'Subscription status needs to be reviewed by admin';
          status = 'canceled';
        }
        
        setAccessInfo({ 
          hasAccess: false, 
          restaurant: restaurantData as Restaurant,
          message,
          reason,
          status,
          showPaymentButton,
          paymentAction,
          urgent: status === 'expired' || status === 'pending_payment'
        });
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData as Restaurant);
      setAccessInfo({ hasAccess: true, restaurant: restaurantData });

      // Load menu groups (cached for 10 minutes)
      const groupsData = await supabaseCache.getMenuGroups(restaurantData.id);

      if (groupsData) {
        setMenuGroups(groupsData);

        // Select menu group
        let selectedGroup: MenuGroup | null = null;
        const groupParam = groupSlug || searchParams.get("group");

        if (groupParam) {
          selectedGroup = groupsData.find(g => 
            g.name.toLowerCase() === groupParam.toLowerCase() || g.id === groupParam
          ) || groupsData[0] || null;
          
          // Mark that group was pre-selected from URL
          console.log('Group pre-selected from URL param:', groupParam);
          setIsGroupPreselected(true);
        } else if (groupsData.length === 1) {
          selectedGroup = groupsData[0];
        } else if (groupsData.length > 1) {
          // If tableSlug exists, redirect to group selection
          if (tableSlug || tableId) {
            // Check if we're already on the select-group page
            if(window.location.pathname.includes('/select-group')) {
              // We're on select-group page, so set isGroupPreselected for when user selects a group
              console.log('On select-group page, pre-selecting group:', selectedGroup?.name || 'none yet');
              setIsGroupPreselected(true);
            } else {
              navigate(`/menu/${restaurantSlug}/${tableSlug || tableId}/select-group`);
              return;
            }
          }
          // For embed (no tableSlug), auto-select default or first group
          selectedGroup = groupsData[0] || null;
        }

        setSelectedMenuGroup(selectedGroup);
      }

      // Load all data in parallel using cache (5-10 min caching)
      const [categoriesData, itemsData, variationsData, accompanimentsData] = await Promise.all([
        supabaseCache.getCategories(restaurantData.id),
        supabaseCache.getMenuItems(restaurantData.id),
        supabaseCache.getVariations(),
        supabaseCache.getAccompaniments()
      ]);

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
      setVariations(variationsData || []);
      setAccompaniments(accompanimentsData || []);

    } catch (error: any) {
      console.error("Error loading menu:", error);
      toast({
        title: "Error loading menu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== STYLE HELPERS =====
  const getStyle = (property: keyof MenuGroup | keyof Restaurant, defaultValue: string): string => {
    // Priority: Menu Group > Restaurant > Default
    const groupValue = selectedMenuGroup?.[property as keyof MenuGroup];
    const restaurantValue = restaurant?.[property as keyof Restaurant];
    const value = groupValue || restaurantValue || defaultValue;
    // Ensure we always return a string
    return typeof value === 'string' ? value : defaultValue;
  };

  // Get all style values - no hardcoded defaults
  const brandColor = getStyle("brand_color" as any, "");
  const textColor = getStyle("text_color" as any, "");
  const fontFamily = getStyle("font_family" as any, "Work Sans") || "Work Sans";
  const cardStyle = getStyle("card_style" as any, "rounded") || "rounded";
  const buttonStyle = getStyle("button_style" as any, "rounded") || "rounded";
  const bgColor = getStyle("background_color" as any, "");
  const bgStyle = getStyle("background_style" as any, "");

  // Memoize background style to prevent recalculation and flickering
  const getBackgroundStyle = useMemo(() => {
    // If no restaurant data yet (loading), use clean white background
    if (!restaurant) {
      return { backgroundColor: '#ffffff', backgroundAttachment: 'fixed' };
    }

    // Check menu group background_image first, then restaurant background_image
    const backgroundImage = selectedMenuGroup?.background_image || restaurant.background_image;
    const primary = selectedMenuGroup?.background_color || restaurant.secondary_color || "";
    const secondary = selectedMenuGroup?.secondary_color || restaurant.brand_color || "";

    // Only apply background if explicitly set
    if (bgStyle === "solid" && bgColor) {
      return { backgroundColor: bgColor, backgroundAttachment: 'fixed' };
    }
    
    if (bgStyle === "image" && backgroundImage) {
      return { 
        backgroundImage: `url(${backgroundImage})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center",
        backgroundAttachment: 'fixed'
      };
    }
    
    if (bgStyle === "gradient" && (primary || secondary)) {
      return { 
        backgroundImage: `linear-gradient(135deg, ${primary || '#ffffff'}, ${secondary || primary || '#ffffff'})`,
        backgroundAttachment: 'fixed'
      };
    }

    // Default: clean white background
    return { backgroundColor: '#ffffff', backgroundAttachment: 'fixed' };
  }, [restaurant, selectedMenuGroup, bgStyle, bgColor, brandColor]);

  const getCardClass = () => {
    const base = "p-4 bg-white ";
    const rounded = cardStyle === "extra-rounded" ? "rounded-2xl" : cardStyle === "sharp" ? "rounded-none" : "rounded-xl";
    const shadow = "shadow-md";
    return base + rounded + " " + shadow;
  };

  const getButtonClass = (isActive: boolean = false) => {
    const base = "px-6 py-2 text-sm font-medium transition-colors ";
    const rounded = buttonStyle === "pill" ? "rounded-full" : buttonStyle === "sharp" ? "rounded-none" : "rounded-lg";
    const color = isActive ? `text-white` : "bg-white text-gray-700 hover:bg-gray-100";
    return base + rounded + " " + color;
  };

  // ===== CART FUNCTIONS =====
  const addToCart = (item: MenuItem, variation?: ItemVariation, selectedAccompaniments: Accompaniment[] = []) => {
    const basePrice = variation ? variation.price_modifier : item.base_price;
    const accompanimentPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
    const totalPrice = basePrice + accompanimentPrice;

    const cartItem: CartItem = {
      id: Date.now().toString() + Math.random().toString(),
      name: item.name,
      basePrice,
      variation,
      accompaniments: selectedAccompaniments,
      totalPrice,
    };

    setCart([...cart, cartItem]);
    toast({ title: "Added to cart!" });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const formatPrice = (price: number) => {
    // Use menu group's currency if available, or fallback to restaurant's primary_currency or default "RWF"
    const currencyCode = (selectedMenuGroup as any)?.currency || restaurant?.primary_currency || "RWF";
    
    // Log currency for debugging
    console.log('Using currency:', currencyCode, 'for menu group:', selectedMenuGroup?.name);
    
    // Get appropriate locale based on currency
    let locale = "en";
    if (currencyCode === "RWF") locale = "en-RW";
    else if (currencyCode === "KES") locale = "en-KE";
    else if (currencyCode === "UGX") locale = "en-UG";
    else if (currencyCode === "TZS") locale = "en-TZ";
    else if (currencyCode === "USD") locale = "en-US";
    else if (currencyCode === "EUR") locale = "en-DE";
    else if (currencyCode === "GBP") locale = "en-GB";
    
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatWhatsAppOrder = () => {
    if (!customerName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    // Define interface for consolidated items
    interface ConsolidatedItem {
      name: string;
      variation?: ItemVariation;
      accompaniments: Accompaniment[];
      quantity: number;
      price: number;
    }

    // Group items by name to consolidate quantities
    const consolidatedItems: Record<string, ConsolidatedItem> = {};
    
    cart.forEach((item) => {
      const itemKey = item.name + (item.variation ? `-${item.variation.name}` : '');
      if (!consolidatedItems[itemKey]) {
        consolidatedItems[itemKey] = {
          name: item.name,
          variation: item.variation,
          accompaniments: item.accompaniments,
          quantity: 1,
          price: item.totalPrice
        };
      } else {
        consolidatedItems[itemKey].quantity += 1;
        consolidatedItems[itemKey].price += item.totalPrice;
      }
    });

    // Calculate total price
    const totalPrice = cart.reduce((sum, item) => sum + item.totalPrice, 0);

    // Start building the message
    let message = `*New Order from ${customerName}*\n`;
    
    // Add table info if available
    if (tableSlug || tableId) {
      message += `*Table:* ${tableSlug || tableId}\n`;
    }
    
    // Add group name if available
    if (selectedMenuGroup) {
      message += `*Menu:* ${selectedMenuGroup.name}\n`;
    }
    
    message += `\n`;
    
    // Add items with quantities
    Object.values(consolidatedItems).forEach((item) => {
      message += `• ${item.name} x${item.quantity}`;
      if (item.variation) message += ` (${item.variation.name})`;
      message += ` — ${formatPrice(item.price)}\n`;
      
      // Add accompaniments indented
      if (item.accompaniments.length > 0) {
        message += `   Add-ons: ${item.accompaniments.map(a => a.name).join(", ")}\n`;
      }
    });
    
    message += `\n*Total: ${formatPrice(totalPrice)}*`;
    
    // Add payment instructions if available
    const paymentInstructions = (selectedMenuGroup as any)?.payment_instructions;
    if (paymentInstructions) {
      message += `\n\n*Payment Options:*\n${paymentInstructions}`;
    }

    const whatsappNumber = restaurant?.whatsapp_number?.replace(/[^0-9]/g, "");
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
    setCart([]);
    setCustomerName("");
    setShowCart(false);
  };

  // ===== FILTER DATA =====
  const filteredCategories = categories.filter(cat => {
    if (selectedMenuGroup && menuGroups.length > 0) {
      if (cat.menu_group_id && cat.menu_group_id !== selectedMenuGroup.id) return false;
    }
    
    // Only show categories that have at least one menu item
    const hasItems = menuItems.some(item => item.category_id === cat.id);
    return hasItems;
  });

  const filteredItems = menuItems.filter(item => {
    const itemCategory = categories.find(c => c.id === item.category_id);
    
    // Filter by group
    if (selectedMenuGroup && menuGroups.length > 0 && itemCategory) {
      if (itemCategory.menu_group_id && itemCategory.menu_group_id !== selectedMenuGroup.id) {
        return false;
      }
    }

    // Filter by category
    if (selectedCategory && item.category_id !== selectedCategory) return false;

    // Filter by search
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (!item.description || !item.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return false;
    }

    return true;
  });

  // ===== MAIN RENDER (Keep background consistent) =====
  // Background style is now memoized to prevent flickering

  // ===== ERROR STATES (Only show errors when not loading) =====
  if (!loading && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
        </div>
      </div>
    );
  }

  if (!loading && accessInfo && !accessInfo.hasAccess) {
    return <RestrictedMenuView restaurant={restaurant} accessInfo={accessInfo} />;
  }

  // ===== MAIN RENDER =====
  return (
    <div 
      className="min-h-screen relative" 
      style={{ ...getBackgroundStyle, fontFamily: `${fontFamily}, sans-serif` }}
    >
      {/* Loading State - Shows on custom background */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Loading menu...</p>
          </div>
        </div>
      )}
      
      {restaurant && (
      <div className="relative z-10">
        {/* Restaurant Header */}
        <div className="text-center pt-12 pb-8">
          <div className="mb-6">
            <div 
              className="w-20 h-20 rounded-full overflow-hidden border-4 mb-4 mx-auto" 
              style={{ borderColor: brandColor || undefined }}
            >
              {(selectedMenuGroup?.logo_url || restaurant.logo_url) ? (
                <SafeImage 
                  src={selectedMenuGroup?.logo_url || restaurant.logo_url} 
                  alt={selectedMenuGroup?.name || restaurant.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gray-200 text-gray-700"
                  style={{ backgroundColor: brandColor || undefined }}
                >
                  {(selectedMenuGroup?.name || restaurant.name).charAt(0)}
                </div>
              )}
            </div>
          </div>
          <h1 
            className="text-2xl font-bold mb-2 text-gray-900" 
            style={{ 
              color: textColor || undefined,
              textShadow: selectedMenuGroup?.header_text_shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : undefined
            }}
          >
            {restaurant.name}
          </h1>
        </div>

        {/* Menu Group Selector - COMPLETELY DISABLED */}
        {false && menuGroups.length > 1 && (
          <div className="px-4 mb-4">
            <div className="max-w-md mx-auto">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {menuGroups.map((group) => {
                  const isActive = selectedMenuGroup?.id === group.id;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedMenuGroup(group)}
                      className={`px-6 py-2 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 rounded-lg border-2`}
                      style={{
                        backgroundColor: isActive ? (brandColor || '#3B82F6') : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : (brandColor || '#3B82F6'),
                        borderColor: brandColor || '#3B82F6'
                      }}
                    >
                      {group.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Category Navigation / Search */}
        <div className="px-4 mb-8">
          <div className="max-w-md mx-auto">
            {!showSearch ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-2 flex-1 overflow-x-auto pb-2 scrollbar-hide">
                  {/* All Categories Button */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-6 py-2 text-sm font-medium transition-colors text-left whitespace-nowrap flex-shrink-0 ${selectedMenuGroup?.category_button_border_radius || 'rounded-lg'}`}
                    style={{ 
                      backgroundColor: selectedCategory === null 
                        ? (selectedMenuGroup?.category_button_active_bg_color || brandColor)
                        : (selectedMenuGroup?.category_button_bg_color || '#FFFFFF'),
                      color: selectedCategory === null
                        ? (selectedMenuGroup?.category_button_active_text_color || '#FFFFFF')
                        : (selectedMenuGroup?.category_button_text_color || '#374151')
                    }}
                  >
                    All
                  </button>
                  
                  {filteredCategories.map((category) => {
                    const isActive = category.id === selectedCategory;
                    const categoryBg = isActive 
                      ? (selectedMenuGroup?.category_button_active_bg_color || brandColor)
                      : (selectedMenuGroup?.category_button_bg_color || '#FFFFFF');
                    const categoryText = isActive
                      ? (selectedMenuGroup?.category_button_active_text_color || '#FFFFFF')
                      : (selectedMenuGroup?.category_button_text_color || '#374151');
                    const categoryRadius = selectedMenuGroup?.category_button_border_radius || 'rounded-lg';
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
                        className={`px-6 py-2 text-sm font-medium transition-colors text-left whitespace-nowrap flex-shrink-0 ${categoryRadius}`}
                        style={{ backgroundColor: categoryBg, color: categoryText }}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex-shrink-0 text-gray-900"
                  style={{ color: textColor || undefined }}
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 ${selectedMenuGroup?.search_border_radius || 'rounded-lg'}`}
                    style={{
                      backgroundColor: selectedMenuGroup?.search_bg_color || 'rgba(255,255,255,0.9)',
                      color: selectedMenuGroup?.search_text_color || '#000000'
                    }}
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm"
                  style={{ color: textColor }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-24">
          <div className="max-w-md mx-auto space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 className="text-lg font-medium mb-2" style={{ color: textColor }}>
                  No items available
                </h3>
              </div>
            ) : (
              filteredItems.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  variations={variations.filter(v => v.menu_item_id === item.id)}
                  accompaniments={accompaniments.filter(a => a.menu_item_id === item.id)}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  cart={cart}
                  formatPrice={formatPrice}
                  cardClass={getCardClass()}
                  brandColor={brandColor}
                  fontFamily={fontFamily}
                  menuGroup={selectedMenuGroup}
                />
              ))
            )}
          </div>
        </div>

        {/* Fixed Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setShowCart(true)}
                className={`w-full py-4 px-6 ${selectedMenuGroup?.cart_button_border_radius || 'rounded-lg'} font-bold flex items-center justify-between shadow-lg bg-gray-900 text-white`}
                style={{ 
                  backgroundColor: selectedMenuGroup?.cart_button_bg_color || brandColor || undefined, 
                  color: selectedMenuGroup?.cart_button_text_color || textColor || undefined
                }}
              >
                <span>View Order ({cart.length})</span>
                <span>{formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
              </button>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
            <div 
              className={`w-full max-w-md mx-auto ${selectedMenuGroup?.cart_dialog_border_radius || 'rounded-t-2xl'} p-6 max-h-[80vh] overflow-y-auto`}
              style={{ backgroundColor: selectedMenuGroup?.cart_dialog_bg_color || '#FFFFFF' }}
            >
              <div 
                className="flex items-center justify-between mb-4 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl"
                style={{ backgroundColor: selectedMenuGroup?.cart_dialog_header_bg_color || '#f3f4f6' }}
              >
                <h3 
                  className="text-lg font-bold"
                  style={{ color: selectedMenuGroup?.cart_dialog_header_text_color || '#000000' }}
                >
                  Your Order
                </h3>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" style={{ color: selectedMenuGroup?.cart_dialog_header_text_color || '#000000' }} />
                </button>
              </div>

              <div className="mb-4">
                <Label 
                  htmlFor="customerName"
                  style={{ color: selectedMenuGroup?.cart_dialog_header_text_color || '#000000' }}
                >
                  Your Name
                </Label>
                <Input
                  id="customerName"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: selectedMenuGroup?.cart_item_bg_color || '#f9fafb' }}
                  >
                    <div className="flex-1">
                      <h4 
                        className="font-medium"
                        style={{ color: selectedMenuGroup?.cart_item_text_color || '#000000' }}
                      >
                        {item.name}
                      </h4>
                      {item.variation && (
                        <p 
                          className="text-sm"
                          style={{ color: selectedMenuGroup?.cart_item_text_color || '#6b7280' }}
                        >
                          Size: {item.variation.name}
                        </p>
                      )}
                      {item.accompaniments.length > 0 && (
                        <p 
                          className="text-sm"
                          style={{ color: selectedMenuGroup?.cart_item_text_color || '#6b7280' }}
                        >
                          Add-ons: {item.accompaniments.map(a => a.name).join(", ")}
                        </p>
                      )}
                      <p 
                        className="text-sm font-medium"
                        style={{ color: selectedMenuGroup?.cart_item_text_color || '#000000' }}
                      >
                        {formatPrice(item.totalPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 hover:bg-red-50 rounded-full"
                      style={{ color: selectedMenuGroup?.cart_remove_button_color || '#ef4444' }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-4" style={{ borderColor: selectedMenuGroup?.cart_border_color || '#e5e7eb' }}>
                <div 
                  className="flex justify-between items-center text-lg font-bold"
                  style={{ color: selectedMenuGroup?.cart_total_text_color || '#000000' }}
                >
                  <span>Total:</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 px-4 border rounded-lg font-medium hover:opacity-90"
                  style={{ 
                    backgroundColor: selectedMenuGroup?.cart_continue_button_bg || '#ffffff',
                    borderColor: '#d1d5db',
                    color: selectedMenuGroup?.cart_continue_button_text_color || '#000000'
                  }}
                >
                  Continue Shopping
                </button>
                <button
                  onClick={formatWhatsAppOrder}
                  className={`flex-1 py-3 px-4 ${selectedMenuGroup?.whatsapp_button_border_radius || 'rounded-lg'} font-medium flex items-center justify-center gap-2 bg-green-600 text-white`}
                  style={{ 
                    backgroundColor: selectedMenuGroup?.whatsapp_button_bg_color || brandColor || undefined, 
                    color: selectedMenuGroup?.whatsapp_button_text_color || textColor || undefined
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Order Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Cache Status Indicator (only shows in debug mode) */}
      <CacheStatusIndicator restaurantSlug={restaurantSlug} />
    </div>
  );
};

// ===== MENU ITEM CARD COMPONENT =====
const MenuItemCard = ({ 
  item, 
  variations, 
  accompaniments, 
  onAddToCart, 
  onRemoveFromCart,
  cart,
  formatPrice, 
  cardClass, 
  brandColor,
  fontFamily,
  menuGroup
}: {
  item: MenuItem;
  variations: ItemVariation[];
  accompaniments: Accompaniment[];
  onAddToCart: (item: MenuItem, variation?: ItemVariation, accompaniments?: Accompaniment[]) => void;
  onRemoveFromCart: (id: string) => void;
  cart: CartItem[];
  formatPrice: (price: number) => string;
  cardClass: string;
  brandColor: string;
  fontFamily: string;
  menuGroup: MenuGroup | null;
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ItemVariation | undefined>();
  const [selectedAccompaniments, setSelectedAccompaniments] = useState<Accompaniment[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  const basePrice = selectedVariation ? selectedVariation.price_modifier : item.base_price;
  const accompanimentPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
  const totalPrice = basePrice + accompanimentPrice;

  // Get quantity of this exact item (with same variation and accompaniments) in cart
  const getQuantityInCart = () => {
    return cart.filter(cartItem => {
      if (cartItem.name !== item.name) return false;
      // Match variation
      const cartVariationId = cartItem.variation?.id || null;
      const selectedVariationId = selectedVariation?.id || null;
      if (cartVariationId !== selectedVariationId) return false;
      // Match accompaniments
      const cartAccIds = cartItem.accompaniments.map(a => a.id).sort().join(',');
      const selectedAccIds = selectedAccompaniments.map(a => a.id).sort().join(',');
      return cartAccIds === selectedAccIds;
    }).length;
  };

  const quantity = getQuantityInCart();

  const handleAddToCart = () => {
    onAddToCart(item, selectedVariation, selectedAccompaniments);
  };

  const handleRemoveOne = () => {
    // Find and remove one matching item from cart
    const matchingItem = cart.find(cartItem => {
      if (cartItem.name !== item.name) return false;
      const cartVariationId = cartItem.variation?.id || null;
      const selectedVariationId = selectedVariation?.id || null;
      if (cartVariationId !== selectedVariationId) return false;
      const cartAccIds = cartItem.accompaniments.map(a => a.id).sort().join(',');
      const selectedAccIds = selectedAccompaniments.map(a => a.id).sort().join(',');
      return cartAccIds === selectedAccIds;
    });
    if (matchingItem) {
      onRemoveFromCart(matchingItem.id);
    }
  };

  // Get customization styles - no hardcoded colors
  const addButtonBg = menuGroup?.add_button_bg_color || brandColor;
  const addButtonText = menuGroup?.add_button_text_color;
  const addButtonRadius = menuGroup?.add_button_border_radius || 'rounded-lg';
  const quantityButtonBg = menuGroup?.quantity_button_bg_color || brandColor;
  const quantityButtonText = menuGroup?.quantity_button_text_color;
  const quantityTextColor = menuGroup?.quantity_text_color;
  const priceColor = menuGroup?.price_text_color || brandColor;
  const priceFontSize = menuGroup?.price_font_size || 'text-base';
  const priceFontWeight = menuGroup?.price_font_weight || 'font-bold';
  const imageRadius = menuGroup?.image_border_radius || 'rounded-lg';
  const cardBg = menuGroup?.card_background_color || '#FFFFFF';
  const cardBorderColor = menuGroup?.card_border_color;
  const cardBorderRadius = menuGroup?.card_border_radius || 'rounded-xl';
  const cardPadding = menuGroup?.card_padding || 'p-4';
  const itemNameColor = menuGroup?.item_name_color;
  const itemNameSize = menuGroup?.item_name_font_size || 'text-base';
  const itemNameWeight = menuGroup?.item_name_font_weight || 'font-semibold';
  const itemDescColor = menuGroup?.item_description_color;
  const itemDescSize = menuGroup?.item_description_font_size || 'text-sm';

  return (
    <div 
      className={`${cardPadding} ${cardBorderRadius} shadow-md`}
      style={{ 
        fontFamily, 
        backgroundColor: cardBg,
        borderColor: cardBorderColor,
        borderWidth: cardBorderColor ? '1px' : undefined,
        borderStyle: cardBorderColor ? 'solid' : undefined
      }}
    >
      <div className="flex items-center gap-4">
        {item.image_url && (
          <div className={`w-16 h-16 flex-shrink-0 ${imageRadius} overflow-hidden bg-gray-100`}>
            <SafeImage src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 
            className={`${itemNameSize} ${itemNameWeight} text-gray-900`}
            style={{ color: itemNameColor || undefined }}
          >
            {item.name}
          </h3>
          {item.description && (
            <p 
              className={`${itemDescSize} text-gray-500 truncate`}
              style={{ color: itemDescColor || undefined }}
            >
              {item.description}
            </p>
          )}
          <p className={`${priceFontSize} ${priceFontWeight} text-gray-900`} style={{ color: priceColor || undefined }}>
            {formatPrice(totalPrice)}
          </p>
        </div>

        {/* Quantity Controls or Add Button */}
        {quantity === 0 ? (
          <button
            onClick={() => {
              if (variations.length > 0 || accompaniments.length > 0) {
                setShowOptions(!showOptions);
              } else {
                handleAddToCart();
              }
            }}
            className={`px-4 py-2 ${addButtonRadius} font-medium bg-gray-900 text-white`}
            style={{ backgroundColor: addButtonBg || undefined, color: addButtonText || undefined }}
          >
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveOne}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-900 text-white"
              style={{ backgroundColor: quantityButtonBg || undefined, color: quantityButtonText || undefined }}
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-gray-900" style={{ color: quantityTextColor || undefined }}>
              {quantity}
            </span>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-900 text-white"
              style={{ backgroundColor: quantityButtonBg || undefined, color: quantityButtonText || undefined }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {showOptions && (variations.length > 0 || accompaniments.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <p className="font-medium mb-2 text-gray-900">Size</p>
              <div className="space-y-2">
                {variations.map((variation) => (
                  <label key={variation.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVariation?.id === variation.id}
                      onChange={(e) => {
                        // If checking this box, uncheck others and set this one
                        // If unchecking, set to null
                        if (e.target.checked) {
                          setSelectedVariation(variation);
                        } else if (selectedVariation?.id === variation.id) {
                          setSelectedVariation(null);
                        }
                      }}
                      className="w-4 h-4 accent-gray-900"
                    />
                    <span className="text-gray-800">{variation.name} ({formatPrice(variation.price_modifier)})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Accompaniments */}
          {accompaniments.length > 0 && (
            <div>
              <p className="font-medium mb-2 text-gray-900">Add-ons</p>
              <div className="space-y-2">
                {accompaniments.map((accompaniment) => (
                  <label key={accompaniment.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAccompaniments.some(a => a.id === accompaniment.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAccompaniments([...selectedAccompaniments, accompaniment]);
                        } else {
                          setSelectedAccompaniments(selectedAccompaniments.filter(a => a.id !== accompaniment.id));
                        }
                      }}
                      className="w-4 h-4 accent-gray-900"
                    />
                    <span className="text-gray-800">{accompaniment.name} (+{formatPrice(accompaniment.price)})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              handleAddToCart();
              setShowOptions(false);
            }}
            className={`w-full py-2 ${addButtonRadius} font-medium bg-gray-900 text-white`}
            style={{ backgroundColor: addButtonBg || undefined, color: addButtonText || undefined }}
          >
            Add to Cart - {formatPrice(totalPrice)}
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;
