import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, MessageCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RestrictedMenuView from "@/components/RestrictedMenuView";
import { simplePaymentAccessControl } from "@/services/simplePaymentAccessControl";
import { SafeImage } from "@/components/ui/safe-image";

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
}

interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  // Base customization
  brand_color?: string;
  text_color?: string;
  font_family?: string;
  background_color?: string;
  background_style?: string;
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
  cart_dialog_border_radius?: string;
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

  // ===== LOAD DATA =====
  useEffect(() => {
    if (restaurantSlug) {
      loadMenuData();
    }
  }, [restaurantSlug]);

  const loadMenuData = async () => {
    try {
      setLoading(true);

      // Check access
      const access = await simplePaymentAccessControl.checkRestaurantAccessBySlug(restaurantSlug!);
      setAccessInfo(access);

      if (!access.hasAccess || !access.restaurant) {
        setLoading(false);
        return;
      }

      setRestaurant(access.restaurant);

      // Load menu groups
      const { data: groupsData } = await supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", access.restaurant.id)
        .eq("is_active", true)
        .order("display_order");

      if (groupsData) {
        setMenuGroups(groupsData);

        // Select menu group
        let selectedGroup: MenuGroup | null = null;
        const groupParam = groupSlug || searchParams.get("group");

        if (groupParam) {
          selectedGroup = groupsData.find(g => 
            g.name.toLowerCase() === groupParam.toLowerCase() || g.id === groupParam
          ) || groupsData[0] || null;
        } else if (groupsData.length === 1) {
          selectedGroup = groupsData[0];
        } else if (groupsData.length > 1 && (tableSlug || tableId)) {
          navigate(`/menu/${restaurantSlug}/${tableSlug || tableId}/select-group`);
          return;
        }

        setSelectedMenuGroup(selectedGroup);
      }

      // Load categories
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", access.restaurant.id)
        .order("display_order");

      setCategories(categoriesData || []);

      // Load menu items
      const { data: itemsData } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", access.restaurant.id)
        .eq("is_available", true)
        .order("display_order");

      setMenuItems(itemsData || []);

      // Load variations
      const { data: variationsData } = await supabase
        .from("item_variations")
        .select("*")
        .order("display_order");

      setVariations(variationsData || []);

      // Load accompaniments
      const { data: accompanimentsData } = await supabase
        .from("accompaniments")
        .select("*")
        .order("display_order");

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

  const brandColor = getStyle("brand_color" as any, "#F97316");
  const textColor = getStyle("text_color" as any, "#FFFFFF");
  const fontFamily = getStyle("font_family" as any, "Work Sans");
  const cardStyle = getStyle("card_style" as any, "rounded");
  const buttonStyle = getStyle("button_style" as any, "rounded");
  const bgColor = getStyle("background_color" as any, "");
  const bgStyle = getStyle("background_style" as any, "gradient");

  const getBackgroundStyle = () => {
    const primary = restaurant?.secondary_color || "#EF4444";
    const secondary = brandColor;

    switch (bgStyle) {
      case "solid":
        return { backgroundColor: bgColor || primary };
      case "image":
        return restaurant?.background_image
          ? { backgroundImage: `url(${restaurant.background_image})`, backgroundSize: "cover" }
          : { background: `linear-gradient(135deg, ${primary}, ${secondary})` };
      default:
        return { background: `linear-gradient(135deg, ${primary}, ${secondary})` };
    }
  };

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
    return new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
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

    let message = `*New Order from ${customerName}*\n\n`;
    cart.forEach((item) => {
      message += `• ${item.name}`;
      if (item.variation) message += ` (${item.variation.name})`;
      if (item.accompaniments.length > 0) {
        message += `\n  Add-ons: ${item.accompaniments.map(a => a.name).join(", ")}`;
      }
      message += `\n  ${formatPrice(item.totalPrice)}\n`;
    });
    message += `\n*Total: ${formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}*`;

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
    return menuItems.some(item => item.category_id === cat.id);
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

  // ===== LOADING STATE =====
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

  // ===== ERROR STATES =====
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Restaurant Not Found</h2>
        </div>
      </div>
    );
  }

  if (accessInfo && !accessInfo.hasAccess) {
    return <RestrictedMenuView restaurant={restaurant} accessInfo={accessInfo} />;
  }

  // ===== MAIN RENDER =====
  return (
    <div 
      className="min-h-screen relative" 
      style={{ ...getBackgroundStyle(), fontFamily: `${fontFamily}, sans-serif`, backgroundAttachment: "fixed" }}
    >
      <div className="relative z-10">
        {/* Restaurant Header */}
        <div className="text-center pt-12 pb-8">
          <div className="mb-6">
            <div 
              className={`w-24 h-24 mx-auto mb-4 overflow-hidden ${
                selectedMenuGroup?.logo_border_radius || 'rounded-full'
              } ${selectedMenuGroup?.logo_show_border !== false ? 'border-4' : ''}`}
              style={{ 
                borderColor: selectedMenuGroup?.logo_border_color || brandColor,
                borderWidth: selectedMenuGroup?.logo_border_width || '4px'
              }}
            >
              {restaurant.logo_url ? (
                <SafeImage src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  {restaurant.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          <h1 
            className="text-2xl font-bold mb-2" 
            style={{ 
              color: textColor,
              textShadow: selectedMenuGroup?.header_text_shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : undefined
            }}
          >
            {restaurant.name}
          </h1>
        </div>

        {/* Category Navigation / Search */}
        <div className="px-4 mb-8">
          <div className="max-w-md mx-auto">
            {!showSearch ? (
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex gap-2 flex-1">
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
                        className={`px-6 py-2 text-sm font-medium transition-colors ${categoryRadius}`}
                        style={{ backgroundColor: categoryBg, color: categoryText }}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
                  style={{ color: textColor }}
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
                className={`w-full py-4 px-6 ${selectedMenuGroup?.cart_button_border_radius || 'rounded-lg'} font-bold flex items-center justify-between shadow-lg`}
                style={{ 
                  backgroundColor: selectedMenuGroup?.cart_button_bg_color || brandColor, 
                  color: selectedMenuGroup?.cart_button_text_color || textColor 
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
                style={{ backgroundColor: selectedMenuGroup?.cart_dialog_header_bg_color }}
              >
                <h3 className="text-lg font-bold">Your Order</h3>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <Label htmlFor="customerName">Your Name</Label>
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
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.variation && <p className="text-sm text-gray-600">Size: {item.variation.name}</p>}
                      {item.accompaniments.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Add-ons: {item.accompaniments.map(a => a.name).join(", ")}
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

              <div className="border-t pt-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={formatWhatsAppOrder}
                  className={`flex-1 py-3 px-4 ${selectedMenuGroup?.whatsapp_button_border_radius || 'rounded-lg'} font-medium flex items-center justify-center gap-2`}
                  style={{ 
                    backgroundColor: selectedMenuGroup?.whatsapp_button_bg_color || brandColor, 
                    color: selectedMenuGroup?.whatsapp_button_text_color || textColor 
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

  // Get customization styles
  const addButtonBg = menuGroup?.add_button_bg_color || brandColor;
  const addButtonText = menuGroup?.add_button_text_color || '#FFFFFF';
  const addButtonRadius = menuGroup?.add_button_border_radius || 'rounded-lg';
  const quantityButtonBg = menuGroup?.quantity_button_bg_color || brandColor;
  const quantityButtonText = menuGroup?.quantity_button_text_color || '#FFFFFF';
  const quantityTextColor = menuGroup?.quantity_text_color || '#000000';
  const priceColor = menuGroup?.price_text_color || brandColor;
  const priceFontSize = menuGroup?.price_font_size || 'text-base';
  const priceFontWeight = menuGroup?.price_font_weight || 'font-bold';
  const imageRadius = menuGroup?.image_border_radius || 'rounded-lg';
  const cardBg = menuGroup?.card_background_color || '#FFFFFF';
  const cardBorderColor = menuGroup?.card_border_color;
  const cardBorderRadius = menuGroup?.card_border_radius || 'rounded-xl';
  const cardPadding = menuGroup?.card_padding || 'p-4';

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
          <h3 className="font-semibold text-gray-900">{item.name}</h3>
          {item.description && <p className="text-sm text-gray-500 truncate">{item.description}</p>}
          <p className={`${priceFontSize} ${priceFontWeight}`} style={{ color: priceColor }}>
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
            className={`px-4 py-2 ${addButtonRadius} font-medium`}
            style={{ backgroundColor: addButtonBg, color: addButtonText }}
          >
            Add
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemoveOne}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: quantityButtonBg, color: quantityButtonText }}
            >
              −
            </button>
            <span className="w-8 text-center font-semibold" style={{ color: quantityTextColor }}>
              {quantity}
            </span>
            <button
              onClick={handleAddToCart}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: quantityButtonBg, color: quantityButtonText }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {showOptions && (variations.length > 0 || accompaniments.length > 0) && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* Variations */}
          {variations.length > 0 && (
            <div>
              <p className="font-medium mb-2">Size</p>
              <div className="space-y-2">
                {variations.map((variation) => (
                  <label key={variation.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={selectedVariation?.id === variation.id}
                      onChange={() => setSelectedVariation(variation)}
                      className="w-4 h-4"
                    />
                    <span>{variation.name} ({formatPrice(variation.price_modifier)})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Accompaniments */}
          {accompaniments.length > 0 && (
            <div>
              <p className="font-medium mb-2">Add-ons</p>
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
                      className="w-4 h-4"
                    />
                    <span>{accompaniment.name} (+{formatPrice(accompaniment.price)})</span>
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
            className={`w-full py-2 ${addButtonRadius} font-medium`}
            style={{ backgroundColor: addButtonBg, color: addButtonText }}
          >
            Add to Cart - {formatPrice(totalPrice)}
          </button>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;
