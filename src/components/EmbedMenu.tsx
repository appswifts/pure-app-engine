import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  MessageCircle, 
  Plus, 
  Minus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag 
} from "lucide-react";
import { SimpleMenuCard } from "@/components/menu/SimpleMenuCard";
import { SafeImage } from "@/components/ui/safe-image";
import { MenuCard } from "@/components/menu/MenuCard";

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

export default function EmbedMenu() {
  const { restaurantSlug } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [variations, setVariations] = useState<ItemVariation[]>([]);
  const [accompaniments, setAccompaniments] = useState<Accompaniment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (restaurantSlug) {
      loadRestaurantData();
    }
  }, [restaurantSlug]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);

      // Load restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();

      if (restaurantError || !restaurantData) {
        console.error("Restaurant not found");
        setLoading(false);
        return;
      }

      setRestaurant(restaurantData);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .order("display_order");

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

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
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
    message += `📋 *Order Details:*\n`;
    
    Object.values(orderSummary).forEach((item: any) => {
      message += `\n• ${item.quantity}x ${item.name}`;
      if (item.variation) {
        message += ` (${item.variation.name})`;
      }
      if (item.accompaniments.length > 0) {
        message += ` + ${item.accompaniments.map((acc: any) => acc.name).join(', ')}`;
      }
      message += ` - ${formatPrice(item.totalPrice)}`;
    });

    const total = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    message += `\n\n💰 *Total: ${formatPrice(total)}*`;

    const whatsappUrl = `https://wa.me/${restaurant.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Clear cart and customer name after order
    setCart([]);
    setCustomerName("");
    setShowCart(false);
  };

  // Filter items based on search and category
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get background style
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
          ? { backgroundImage: `url(${restaurant.background_image})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }
          : { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
      default:
        return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
    }
  };

  const getButtonStyle = (isActive: boolean = false) => {
    const buttonStyle = restaurant?.button_style || 'rounded';
    const brandColor = restaurant?.brand_color || '#F97316';
    
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
    const cardStyle = restaurant?.card_style || 'rounded';
    const shadowStyle = restaurant?.card_shadow || 'medium';
    
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
      style: { backgroundColor: restaurant?.card_background || '#FFFFFF' }
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-600">The requested menu could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden embed-container"
      style={{
        ...getBackgroundStyle(),
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif'
      }}
    >
      {/* Hide all scrollbars */}
      <style>{`
        .embed-container {
          overflow: hidden;
        }
        .embed-container ::-webkit-scrollbar {
          display: none;
        }
        .embed-container * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .embed-container *::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
                    style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif' }}
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
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  cart.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.variation && (
                            <p className="text-sm text-gray-600">Variation: {item.variation.name}</p>
                          )}
                          {item.accompaniments.length > 0 && (
                            <p className="text-sm text-gray-600">
                              + {item.accompaniments.map(acc => acc.name).join(', ')}
                            </p>
                          )}
                          <p className="text-sm font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                  ))
                )}
              </div>
              
              {/* Total */}
              {cart.length > 0 && (
                <>
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
                      disabled={!restaurant.whatsapp_number || !customerName.trim()}
                      className={`flex-1 font-bold py-3 px-6 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        (restaurant.whatsapp_button_style || restaurant.button_style) === 'pill' ? 'rounded-full' :
                        (restaurant.whatsapp_button_style || restaurant.button_style) === 'sharp' ? 'rounded-none' : 'rounded-lg'
                      }`}
                      style={{
                        backgroundColor: restaurant.whatsapp_button_color || '#00E061',
                        color: restaurant.whatsapp_button_text_color || '#FFFFFF'
                      }}
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>Order</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
