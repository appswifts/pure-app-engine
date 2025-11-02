import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageCircle, Plus, Minus, X, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MenuCard } from "@/components/menu/MenuCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RestrictedMenuView from "@/components/RestrictedMenuView";
import { simplePaymentAccessControl } from "@/services/simplePaymentAccessControl";
import { SafeImage } from "@/components/ui/safe-image";

// Define interfaces for our data types
interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  subscription_status?: string;
  subscription_blocked?: boolean;
  brand_color?: string;
  secondary_color?: string;
  text_color?: string;
  card_background?: string;
  font_family?: string;
  background_style?: string;
  background_color?: string;
  background_image?: string;
  background_video?: string;
  background_youtube_url?: string;
  menu_layout?: string;
  card_style?: string;
  button_style?: string;
  card_shadow?: string;
  show_logo_border?: boolean;
  show_animations?: boolean;
  logo_url?: string;
  slug?: string;
  // WhatsApp button customization properties
  whatsapp_button_color?: string;
  whatsapp_button_text_color?: string;
  whatsapp_button_text?: string;
  whatsapp_button_style?: string;
  whatsapp_button_price_bg?: string;
  whatsapp_button_price_color?: string;
}

interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  restaurant_id: string;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  restaurant_id: string;
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
  is_required: boolean;
}

interface CartItem {
  id: string;
  name: string;
  basePrice: number;
  variation?: ItemVariation;
  accompaniments: Accompaniment[];
  totalPrice: number;
}

// Simple placeholder component for restaurant logo
const RestaurantLogo = ({ name, logoUrl }: { name: string; logoUrl?: string }) => {
  if (logoUrl) {
    return (
      <SafeImage 
        src={logoUrl}
        alt={`${name} logo`}
        className="h-12 w-12 object-cover rounded-lg border-2 border-primary/20"
      />
    );
  }
  
  return (
    <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
      <span className="text-purple-600 font-bold">{name.charAt(0)}</span>
    </div>
  );
};

// Simple loading spinner
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

const PublicMenu = () => {
  const { restaurantSlug, tableSlug, tableId, groupSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [selectedMenuGroup, setSelectedMenuGroup] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'single' | 'full' | 'default'>('default');
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [variations, setVariations] = useState<ItemVariation[]>([]);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tableName, setTableName] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    if (restaurantSlug) {
      // Check URL parameters for display mode
      // New pattern: /menu/:restaurantSlug/:tableId/group/:groupSlug
      if (groupSlug) {
        setDisplayMode('single');
        // Will load group by slug in loadMenuData
      } else {
        setDisplayMode('default');
      }
      
      loadMenuData();
    }
  }, [restaurantSlug, tableId, tableSlug, groupSlug, searchParams]);

  useEffect(() => {
    if (restaurant && selectedMenuGroup) {
      loadCategoriesAndItems();
    }
  }, [selectedMenuGroup]);

  const loadCategoriesAndItems = async () => {
    if (!restaurant) return;

    try {
      // Load categories for selected menu group
      let categoriesQuery = supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurant.id);

      if (selectedMenuGroup) {
        categoriesQuery = categoriesQuery.eq("menu_group_id", selectedMenuGroup);
      }

      const { data: categoriesData, error: categoriesError } = await categoriesQuery.order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("display_order");

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);
    } catch (error: any) {
      console.error("Error loading menu data:", error);
    }
  };

  const loadMenuData = async () => {
    try {
      setLoading(true);


      // STEP 1: Check restaurant access using simple access control
      const accessResult = await simplePaymentAccessControl.checkRestaurantAccessBySlug(restaurantSlug!);
      
      
      setAccessInfo(accessResult);
      setRestaurant(accessResult.restaurant);

      // CRITICAL: If no access, stop here and show restricted view
      if (!accessResult.hasAccess) {
        setLoading(false);
        return;
      }

      
      const restaurantData = accessResult.restaurant;

      // Load menu groups
      const { data: menuGroupsData, error: menuGroupsError } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("display_order");

      if (menuGroupsError) throw menuGroupsError;
      setMenuGroups(menuGroupsData || []);
      
      // Auto-select based on display mode
      if (groupSlug) {
        // Single group mode - find group by slug
        const group = menuGroupsData?.find((g: any) => g.slug === groupSlug);
        if (group) {
          setSelectedMenuGroup(group.id);
        } else if (menuGroupsData && menuGroupsData.length > 0) {
          // Fallback to first group if slug not found
          setSelectedMenuGroup(menuGroupsData[0].id);
        }
      } else if (menuGroupsData && menuGroupsData.length > 0) {
        // Default mode - auto-select first group
        setSelectedMenuGroup(menuGroupsData[0].id);
      }

      // Load table name if tableSlug or tableId exists
      const tableIdentifier = tableId || tableSlug;
      if (tableIdentifier) {
        const { data: tableData, error: tableError } = await supabase
          .from("tables")
          .select("name")
          .eq("slug", tableIdentifier)
          .eq("restaurant_id", restaurantData.id)
          .single();
        
        if (!tableError && tableData) {
          setTableName(tableData.name);
        }
      }

      // Load categories
      let categoriesQuery = supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id);

      // Filter by selected menu group if available
      if (selectedMenuGroup) {
        categoriesQuery = categoriesQuery.eq("menu_group_id", selectedMenuGroup);
      }

      const { data: categoriesData, error: categoriesError } = await categoriesQuery.order("display_order");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_available", true)
        .order("display_order");

      if (itemsError) throw itemsError;
      setMenuItems(itemsData || []);

      // Load variations
      const { data: variationsData, error: variationsError } = await supabase
        .from("item_variations")
        .select("*");

      if (variationsError) throw variationsError;
      setVariations(variationsData || []);

      // Load accompaniments
      const { data: accompanimentsData, error: accompanimentsError } = await supabase
        .from("accompaniments")
        .select("*");

      if (accompanimentsError) throw accompanimentsError;
      setAccompaniments(accompanimentsData || []);

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

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getItemVariations = (itemId: string) => {
    return variations.filter(v => v.menu_item_id === itemId);
  };

  const getItemAccompaniments = (itemId: string) => {
    return accompaniments.filter(a => a.menu_item_id === itemId);
  };

  const addToCart = (item: MenuItem, quantity: number = 1, selectedVariation?: ItemVariation, selectedAccompaniments: Accompaniment[] = []) => {
    const itemPrice = (selectedVariation ? selectedVariation.price_modifier : item.base_price) + 
      selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
    
    for (let i = 0; i < quantity; i++) {
      const cartItem: CartItem = {
        id: `${item.id}-${Date.now()}-${i}`,
        name: item.name,
        basePrice: item.base_price,
        variation: selectedVariation,
        accompaniments: selectedAccompaniments,
        totalPrice: itemPrice
      };
      setCart(prev => [...prev, cartItem]);
    }
  };

  const formatWhatsAppOrder = () => {
    if (cart.length === 0 || !restaurant) return;
    
    if (!customerName.trim()) {
      setShowCart(true);
      return;
    }

    // Group items by name, variation, and accompaniments to show quantities
    const orderSummary = cart.reduce((acc, item) => {
      const key = `${item.name}|${item.variation?.id || 'none'}|${item.accompaniments.map(a => a.id).sort().join(',')}`;
      
      if (!acc[key]) {
        acc[key] = {
          name: item.name,
          variation: item.variation,
          accompaniments: item.accompaniments,
          quantity: 0,
          unitPrice: item.totalPrice,
          totalPrice: 0
        };
      }
      
      acc[key].quantity += 1;
      acc[key].totalPrice += item.totalPrice;
      
      return acc;
    }, {} as any);

    let message = `🍽️ *New Order from ${restaurant.name}*\n\n`;
    message += `👤 Customer: ${customerName}\n`;
    message += `📍 Table: ${tableName || tableSlug}\n\n`;
    message += `📋 *Order Details:*\n`;
    
    Object.values(orderSummary).forEach((item: any) => {
      let itemText = `• ${item.quantity}x ${item.name}`;
      
      if (item.variation) {
        itemText += ` (${item.variation.name})`;
      }
      
      if (item.accompaniments.length > 0) {
        const accText = item.accompaniments.map(acc => acc.name).join(', ');
        itemText += ` + ${accText}`;
      }
      
      itemText += ` - ${formatPrice(item.totalPrice)}`;
      message += itemText + '\n';
    });
    
    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    message += `\n💰 *Total: ${formatPrice(total)}*`;
    
    const whatsappUrl = `https://wa.me/${restaurant.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };
  
  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  // Get dynamic styles based on restaurant settings
  const getBackgroundStyle = () => {
    if (!restaurant) return { background: 'linear-gradient(135deg, #EF4444, #F97316)' };
    
    const bgStyle = restaurant.background_style || 'gradient';
    const primaryColor = restaurant.secondary_color || '#EF4444';
    const secondaryColor = restaurant.brand_color || '#F97316';
    
    switch (bgStyle) {
      case 'solid':
        return { backgroundColor: primaryColor };
      case 'gradient':
        return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
      case 'pattern':
        return {
          backgroundColor: primaryColor,
          backgroundImage: `radial-gradient(circle at 20% 80%, ${secondaryColor}20 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${secondaryColor}20 0%, transparent 50%)`
        };
      case 'image':
        return restaurant.background_image 
          ? { backgroundImage: `url(${restaurant.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
      case 'video':
        return restaurant.background_video 
          ? { backgroundColor: primaryColor } // Video will be handled separately
          : { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
      default:
        return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getBackgroundStyle()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Restaurant Not Found</h2>
          <p className="text-red-100 mb-4">The restaurant you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Show restricted view if no access (payment pending, unpaid, etc.)
  if (accessInfo && !accessInfo.hasAccess) {
    return <RestrictedMenuView restaurant={restaurant} accessInfo={accessInfo} />;
  }

  // Filter items by menu group, category, and search query
  const filteredItems = menuItems.filter(item => {
    // Filter by menu group
    const itemCategory = categories.find(c => c.id === item.category_id);
    let menuGroupMatch = true;
    
    if (displayMode === 'single' && selectedMenuGroup) {
      // Single mode: only show items from selected group
      menuGroupMatch = itemCategory && (itemCategory as any).menu_group_id === selectedMenuGroup;
    } else if (displayMode === 'default' && selectedMenuGroup) {
      // Default mode: show items from selected group
      menuGroupMatch = itemCategory && (itemCategory as any).menu_group_id === selectedMenuGroup;
    }
    // Full mode: show all items (menuGroupMatch stays true)
    
    // Filter by category
    const categoryMatch = selectedCategory === null || item.category_id === selectedCategory;
    
    // Filter by search query
    const searchMatch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return menuGroupMatch && categoryMatch && searchMatch;
  });


  const getButtonStyle = (isActive: boolean = false) => {
    const buttonStyle = restaurant.button_style || 'rounded';
    const brandColor = restaurant.brand_color || '#F97316';
    
    let className = 'px-6 py-2 text-sm font-medium whitespace-nowrap transition-colors ';
    
    switch (buttonStyle) {
      case 'pill':
        className += 'rounded-full ';
        break;
      case 'sharp':
        className += 'rounded-none ';
        break;
      default:
        className += 'rounded-lg ';
        break;
    }
    
    if (isActive) {
      className += 'text-white';
      return { className, style: { backgroundColor: brandColor } };
    } else {
      className += 'bg-white text-gray-700 hover:bg-gray-100';
      return { className, style: {} };
    }
  };

  const getCardStyle = () => {
    const cardStyle = restaurant.card_style || 'rounded';
    const shadowStyle = restaurant.card_shadow || 'medium';
    
    let className = 'p-4 ';
    
    // Card corners
    switch (cardStyle) {
      case 'extra-rounded':
        className += 'rounded-2xl ';
        break;
      case 'sharp':
        className += 'rounded-none ';
        break;
      default:
        className += 'rounded-xl ';
        break;
    }
    
    // Card shadow
    switch (shadowStyle) {
      case 'large':
        className += 'shadow-lg ';
        break;
      case 'small':
        className += 'shadow-sm ';
        break;
      case 'none':
        className += 'shadow-none ';
        break;
      default:
        className += 'shadow-md ';
        break;
    }
    
    return {
      className,
      style: { backgroundColor: restaurant.card_background || '#FFFFFF' }
    };
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        ...getBackgroundStyle(),
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Video Background */}
      {restaurant.background_style === 'video' && (
        <>
          {/* YouTube Video Background (Priority) */}
          {restaurant.background_youtube_url && getYouTubeVideoId(restaurant.background_youtube_url) && (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeVideoId(restaurant.background_youtube_url)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeVideoId(restaurant.background_youtube_url)}&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1`}
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{ filter: 'brightness(0.7)', border: 'none' }}
              allow="autoplay; encrypted-media"
              allowFullScreen={false}
              title="Background Video"
            />
          )}
          
          {/* Uploaded Video Background (Fallback) */}
          {!restaurant.background_youtube_url && restaurant.background_video && (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
              style={{ filter: 'brightness(0.7)' }}
            >
              <source src={restaurant.background_video} type="video/mp4" />
            </video>
          )}
        </>
      )}
      
      {/* Content Overlay */}
      <div className="relative z-10">
        {/* Restaurant Header */}
        <div className="text-center pt-12 pb-8">
          <div className="mb-6">
            <div 
              className={`w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden ${
                restaurant.show_logo_border !== false ? 'border-4' : ''
              } ${restaurant.show_animations !== false ? 'transition-transform hover:scale-105' : ''}`}
              style={{
                borderColor: restaurant.brand_color || '#F97316'
              }}
            >
              {restaurant.logo_url ? (
                <SafeImage 
                  src={restaurant.logo_url} 
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: restaurant.brand_color || '#F97316' }}
                >
                  {restaurant.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: restaurant.text_color || '#FFFFFF' }}
          >
            {restaurant.name}
          </h1>
        </div>

        {/* Category Navigation with Search */}
        <div className="px-4 mb-8">
          <div className="max-w-md mx-auto">
            {!showSearch ? (
              /* Category Navigation */
              <div className="flex items-center gap-3">
                <div className="flex space-x-2 overflow-x-auto scrollbar-hide flex-1">
                  {(() => {
                    const activeStyle = getButtonStyle(true);
                    const inactiveStyle = getButtonStyle(false);
                    
                    return (
                      <>
                        <button
                          onClick={() => setSelectedCategory(null)}
                          className={`${selectedCategory === null ? activeStyle.className : inactiveStyle.className} flex-shrink-0`}
                          style={selectedCategory === null ? activeStyle.style : inactiveStyle.style}
                        >
                          All
                        </button>
                        {categories.map((category) => {
                          const isActive = selectedCategory === category.id;
                          const style = isActive ? activeStyle : inactiveStyle;
                          
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`${style.className} flex-shrink-0`}
                              style={style.style}
                            >
                              {category.name}
                            </button>
                          );
                        })}
                      </>
                    );
                  })()
                  }
                </div>
                
                {/* Search Toggle Icon */}
                <button
                  onClick={() => {
                    setShowSearch(true);
                    setSearchQuery("");
                  }}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex-shrink-0"
                  style={{ color: restaurant.text_color || '#FFFFFF' }}
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            ) : (
              /* Search Bar - Replaces Categories */
              <div className="flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/90 backdrop-blur-sm border-white/20 focus:border-white/40"
                    style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}
                    autoFocus
                  />
                </div>
                
                {/* Close Search Button */}
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex-shrink-0"
                  style={{ color: restaurant.text_color || '#FFFFFF' }}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="px-4 pb-32">
          <div className="max-w-md mx-auto space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 
                  className="text-lg font-medium mb-2"
                  style={{ color: restaurant.text_color || '#FFFFFF' }}
                >
                  No items available
                </h3>
                <p style={{ color: `${restaurant.text_color || '#FFFFFF'}80` }}>
                  There are no menu items in this category.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <SimpleMenuCard
                  key={item.id}
                  item={item}
                  variations={getItemVariations(item.id)}
                  accompaniments={getItemAccompaniments(item.id)}
                  onAddToCart={addToCart}
                  onRemoveFromCart={removeFromCart}
                  cart={cart}
                  formatPrice={formatPrice}
                  restaurant={restaurant}
                  cardStyle={getCardStyle()}
                  buttonStyle={restaurant.button_style || 'rounded'}
                />
              ))
            )}
          </div>
        </div>

        {/* Fixed WhatsApp Order Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50">
            <div className="max-w-md mx-auto flex gap-2">
              {/* Cart Review Button */}
              <button
                onClick={() => setShowCart(true)}
                className="p-4 rounded-lg backdrop-blur-sm hover:opacity-80 transition-colors relative"
                style={{ 
                  backgroundColor: restaurant.whatsapp_button_color || '#00E061',
                  color: restaurant.whatsapp_button_text_color || '#FFFFFF'
                }}
              >
                <ShoppingBag className="h-5 w-5" />
                {cart.length > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: restaurant.whatsapp_button_text_color || '#FFFFFF',
                      color: restaurant.whatsapp_button_color || '#00E061'
                    }}
                  >
                    {cart.length}
                  </span>
                )}
              </button>
              
              {/* WhatsApp Order Button */}
              <button
                onClick={formatWhatsAppOrder}
                className={`flex-1 font-bold py-4 px-6 flex items-center justify-center space-x-2 shadow-lg transition-colors ${
                  (restaurant.whatsapp_button_style || restaurant.button_style) === 'pill' ? 'rounded-full' :
                  (restaurant.whatsapp_button_style || restaurant.button_style) === 'sharp' ? 'rounded-none' : 'rounded-lg'
                } ${
                  restaurant.show_animations !== false ? 'hover:scale-105 transform transition-transform' : ''
                }`}
                style={{ 
                  backgroundColor: restaurant.whatsapp_button_color || '#00E061',
                  color: restaurant.whatsapp_button_text_color || '#FFFFFF',
                  fontFamily: restaurant.font_family || 'Open Sans, sans-serif'
                }}
              >
                <MessageCircle className="h-5 w-5" />
                <span>{restaurant.whatsapp_button_text || 'Whatsapp'}</span>
                <span 
                  className="px-2 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor: restaurant.whatsapp_button_price_bg || 'rgba(255, 255, 255, 0.2)',
                    color: restaurant.whatsapp_button_price_color || '#FFFFFF'
                  }}
                >
                  {formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Cart Review Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
            <div className="w-full max-w-md mx-auto bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Your Order</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Customer Name Input */}
              <div className="mb-4">
                <Label htmlFor="customerName">Your Name</Label>
                <Input
                  id="customerName"
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Cart Items */}
              <div className="space-y-3 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.variation && (
                        <p className="text-sm text-gray-600">Size: {item.variation.name}</p>
                      )}
                      {item.accompaniments.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Add-ons: {item.accompaniments.map(acc => acc.name).join(', ')}
                        </p>
                      )}
                      <p className="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setShowCart(false);
                    formatWhatsAppOrder();
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors duration-200"
                  style={{
                    backgroundColor: restaurant.brand_color || '#16a34a',
                    color: restaurant.text_color || '#ffffff'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLButtonElement;
                    const brandColor = restaurant.brand_color || '#16a34a';
                    // Darken the brand color on hover
                    const darkerColor = brandColor + 'cc'; // Add transparency for darker effect
                    target.style.backgroundColor = darkerColor;
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLButtonElement;
                    target.style.backgroundColor = restaurant.brand_color || '#16a34a';
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
    </div>
  );
};

// Simple Menu Card Component matching the screenshot design
const SimpleMenuCard = ({ item, variations, accompaniments, onAddToCart, onRemoveFromCart, cart, formatPrice, restaurant, cardStyle, buttonStyle }: {
  item: MenuItem;
  variations: ItemVariation[];
  accompaniments: Accompaniment[];
  onAddToCart: (item: MenuItem, quantity: number, variation?: ItemVariation, accompaniments?: Accompaniment[]) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  cart: CartItem[];
  formatPrice: (price: number) => string;
  restaurant: Restaurant;
  cardStyle: { className: string; style: any };
  buttonStyle: string;
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ItemVariation | undefined>();
  const [selectedAccompaniments, setSelectedAccompaniments] = useState<Accompaniment[]>([]);
  const [showOptions, setShowOptions] = useState(false);

  // Get current cart items for this menu item with current variation/accompaniments
  const getCurrentCartItems = () => {
    return cart.filter(cartItem => {
      // Match by item name
      if (cartItem.name !== item.name) return false;
      
      // Match variation (both undefined or same ID)
      const cartVariationId = cartItem.variation?.id || null;
      const selectedVariationId = selectedVariation?.id || null;
      if (cartVariationId !== selectedVariationId) return false;
      
      // Match accompaniments (compare sorted arrays of IDs)
      const cartAccompanimentIds = cartItem.accompaniments.map(a => a.id).sort();
      const selectedAccompanimentIds = selectedAccompaniments.map(a => a.id).sort();
      if (JSON.stringify(cartAccompanimentIds) !== JSON.stringify(selectedAccompanimentIds)) return false;
      
      return true;
    });
  };

  const currentCartItems = getCurrentCartItems();
  const quantity = currentCartItems.length;

  const handleQuantityChange = (change: number) => {
    if (change > 0) {
      // Add item to cart
      onAddToCart(item, 1, selectedVariation, selectedAccompaniments);
    } else if (change < 0 && quantity > 0) {
      // Remove one item from cart
      const itemToRemove = currentCartItems[currentCartItems.length - 1];
      if (itemToRemove) {
        onRemoveFromCart(itemToRemove.id);
      }
    }
  };

  const handleAddToCart = () => {
    onAddToCart(item, 1, selectedVariation, selectedAccompaniments);
  };

  // Update cart when variation or accompaniments change
  const handleVariationChange = (variation: ItemVariation) => {
    // If clicking on already selected variation, deselect it
    const newVariation = selectedVariation?.id === variation.id ? undefined : variation;
    setSelectedVariation(newVariation);
    // If there are existing items in cart, update them
    if (quantity > 0) {
      // Remove old items
      currentCartItems.forEach(cartItem => onRemoveFromCart(cartItem.id));
      // Add new items with updated variation
      for (let i = 0; i < quantity; i++) {
        onAddToCart(item, 1, newVariation, selectedAccompaniments);
      }
    }
  };

  const handleAccompanimentChange = (accompaniment: Accompaniment, checked: boolean) => {
    let newAccompaniments;
    if (checked) {
      newAccompaniments = [...selectedAccompaniments, accompaniment];
    } else {
      newAccompaniments = selectedAccompaniments.filter(a => a.id !== accompaniment.id);
    }
    setSelectedAccompaniments(newAccompaniments);
    
    // If there are existing items in cart, update them
    if (quantity > 0) {
      // Remove old items
      currentCartItems.forEach(cartItem => onRemoveFromCart(cartItem.id));
      // Add new items with updated accompaniments
      for (let i = 0; i < quantity; i++) {
        onAddToCart(item, 1, selectedVariation, newAccompaniments);
      }
    }
  };

  // Calculate price per item: variation replaces base price, accompaniments add to current price
  const basePrice = selectedVariation ? selectedVariation.price_modifier : item.base_price;
  const accompanimentPrice = selectedAccompaniments.reduce((sum, acc) => sum + acc.price, 0);
  const pricePerItem = basePrice + accompanimentPrice;
  
  // Display logic: always show current price based on selections, multiply by quantity if in cart
  const displayPrice = quantity === 0 ? pricePerItem : (pricePerItem * quantity);

  const getQuantityButtonClass = () => {
    let className = 'w-8 h-8 border-2 flex items-center justify-center text-sm transition-colors ';
    
    switch (buttonStyle) {
      case 'pill':
        className += 'rounded-full ';
        break;
      case 'sharp':
        className += 'rounded-none ';
        break;
      default:
        className += 'rounded-full ';
        break;
    }
    
    return className;
  };

  const brandColor = restaurant.brand_color || '#F97316';
  const quantityButtonClass = getQuantityButtonClass();

  return (
    <div 
      className={cardStyle.className}
      style={{
        ...cardStyle.style,
        fontFamily: restaurant.font_family || 'Open Sans, sans-serif'
      }}
    >
      <div className="flex items-center space-x-4">
        {/* Item Image */}
        <div className={`w-16 h-16 overflow-hidden bg-gray-100 flex-shrink-0 ${
          restaurant.card_style === 'extra-rounded' ? 'rounded-2xl' :
          restaurant.card_style === 'sharp' ? 'rounded-none' : 'rounded-xl'
        }`}>
          {item.image_url ? (
            <SafeImage 
              src={item.image_url} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${brandColor}20` }}
            >
              <span className="text-xl" style={{ color: `${brandColor}dd` }}>🍔</span>
            </div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-500 truncate" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>{item.description}</p>
          )}
          <p className="font-bold" style={{ color: brandColor, fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
            {formatPrice(pricePerItem)}{quantity > 0 && ` × ${quantity} = ${formatPrice(displayPrice)}`}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center space-x-3">
          {quantity === 0 ? (
            // Show only plus button when quantity is 0
            <button
              onClick={() => {
                handleQuantityChange(1);
                setShowOptions(true);
              }}
              className={quantityButtonClass}
              style={{ 
                borderColor: '#d1d5db',
                color: '#6b7280',
                fontFamily: restaurant.font_family || 'Open Sans, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = brandColor;
                e.currentTarget.style.color = brandColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              <span className="text-lg font-bold">+</span>
            </button>
          ) : (
            // Show all controls when quantity > 0
            <>
              <button
                onClick={() => handleQuantityChange(-1)}
                className={quantityButtonClass}
                style={{ 
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  fontFamily: restaurant.font_family || 'Open Sans, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColor;
                  e.currentTarget.style.color = brandColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <span className="text-lg font-bold">−</span>
              </button>
              <span className="font-semibold text-lg w-8 text-center" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>{quantity}</span>
              <button
                onClick={() => handleQuantityChange(1)}
                className={quantityButtonClass}
                style={{ 
                  borderColor: '#d1d5db',
                  color: '#6b7280',
                  fontFamily: restaurant.font_family || 'Open Sans, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = brandColor;
                  e.currentTarget.style.color = brandColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Options Toggle */}
      {(variations.length > 0 || accompaniments.length > 0) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="text-sm font-medium flex items-center space-x-1 transition-colors"
            style={{ color: brandColor }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = `${brandColor}dd`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = brandColor;
            }}
          >
            <span style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
              Customize {(selectedVariation || selectedAccompaniments.length > 0) && `(${formatPrice(pricePerItem)})`}
            </span>
            <ChevronRight className={`h-4 w-4 transition-transform ${showOptions ? 'rotate-90' : ''}`} />
          </button>
        </div>
      )}

      {/* Expanded Options */}
      {showOptions && (
        <div className="mt-4 space-y-4">
          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>Choose Size</h4>
              <div className="space-y-2">
                {variations.map((variation) => (
                  <label 
                    key={variation.id} 
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedVariation?.id === variation.id 
                        ? 'ring-2 ring-offset-1' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      '--tw-ring-color': brandColor,
                      backgroundColor: selectedVariation?.id === variation.id ? brandColor + '10' : 'transparent'
                    } as React.CSSProperties}
                  >
                    <input
                      type="radio"
                      name={`variation-${item.id}`}
                      checked={selectedVariation?.id === variation.id}
                      onChange={() => handleVariationChange(variation)}
                      className="w-4 h-4 border-2 border-gray-300 focus:ring-2 focus:ring-offset-2"
                      style={{ 
                        accentColor: brandColor,
                        '--tw-ring-color': brandColor + '40'
                      } as React.CSSProperties}
                    />
                    <span className="text-sm flex-1" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
                      {variation.name} 
                      <span className="font-medium ml-1" style={{ color: brandColor, fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
                        ({variation.price_modifier > 0 ? '+' : ''}{formatPrice(variation.price_modifier)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Accompaniments */}
          {accompaniments.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>Accompaniment</h4>
              <div className="space-y-2">
                {accompaniments.map((acc) => (
                  <label 
                    key={acc.id} 
                    className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedAccompaniments.some(a => a.id === acc.id)
                        ? 'ring-2 ring-offset-1' 
                        : 'hover:bg-gray-50'
                    }`}
                    style={{
                      '--tw-ring-color': brandColor,
                      backgroundColor: selectedAccompaniments.some(a => a.id === acc.id) ? brandColor + '10' : 'transparent'
                    } as React.CSSProperties}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccompaniments.some(a => a.id === acc.id)}
                      onChange={(e) => handleAccompanimentChange(acc, e.target.checked)}
                      className="w-4 h-4 border-2 border-gray-300 rounded focus:ring-2 focus:ring-offset-2"
                      style={{ 
                        accentColor: brandColor,
                        '--tw-ring-color': brandColor + '40'
                      } as React.CSSProperties}
                    />
                    <span className="text-sm flex-1" style={{ fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
                      {acc.name} 
                      <span className="font-medium ml-1" style={{ color: brandColor, fontFamily: restaurant.font_family || 'Open Sans, sans-serif' }}>
                        (+{formatPrice(acc.price)})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default PublicMenu;