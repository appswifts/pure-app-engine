import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  DollarSign, 
  Plus, 
  Minus, 
  ShoppingCart,
  MessageCircle,
  Star,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MenuVariant {
  id: string;
  name: string;
  price_adjustment: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  base_price: number;
  category_id: string;
  image_url?: string;
  is_available: boolean;
  price?: number;
  currency?: string;
  item_variations?: MenuVariant[];
  category?: {
    name: string;
  };
}

interface Restaurant {
  id: string;
  name: string;
  whatsapp_number: string;
  brand_color?: string;
  secondary_color?: string;
}

interface CartItem {
  itemId: string;
  variantId?: string;
  quantity: number;
  name: string;
  variantName?: string;
  price: number;
}

const CustomerMenu = () => {
  const { restaurantId, tableId } = useParams();
  const { toast } = useToast();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${restaurantId}-${tableId}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }
    }
  }, [restaurantId, tableId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart-${restaurantId}-${tableId}`, JSON.stringify(cart));
    } else {
      localStorage.removeItem(`cart-${restaurantId}-${tableId}`);
    }
  }, [cart, restaurantId, tableId]);

  // QR scan tracking disabled - table not available

  // Load restaurant and menu data
  useEffect(() => {
    const loadData = async () => {
      if (!restaurantId) return;

      try {
        setLoading(true);
        setError(null);

        // Load restaurant data
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          setError('Restaurant not found');
          return;
        }

        // Restaurant access is available for authenticated restaurants

        setRestaurant(restaurantData);

        // Load categories first
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('display_order');

        if (categoriesError) {
          console.warn('Categories error:', categoriesError);
        }

        // Load menu items
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*, categories(name)')
          .eq('restaurant_id', restaurantId)
          .eq('is_available', true)
          .order('display_order');

        if (menuError) throw menuError;

        // Transform data to match interface
        const transformedMenuItems = (menuData || []).map(item => ({
          ...item,
          price: item.base_price,
          currency: 'RWF',
          category: item.categories
        }));

        setMenuItems(transformedMenuItems);

        // Set categories
        const categoryNames = (categoriesData || []).map(cat => cat.name);
        setCategories(['All', ...categoryNames]);

      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load menu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [restaurantId]);

  const filteredItems = selectedCategory === "All" 
    ? menuItems
    : menuItems.filter(item => item.category?.name === selectedCategory);

  const addToCart = (item: MenuItem, variant?: MenuVariant) => {
    const basePrice = item.price;
    const variantPrice = variant ? basePrice + variant.price_adjustment : basePrice;
    
    setCart(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.itemId === item.id && cartItem.variantId === variant?.id
      );

      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.itemId === item.id && cartItem.variantId === variant?.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, {
          itemId: item.id,
          variantId: variant?.id,
          quantity: 1,
          name: item.name,
          variantName: variant?.name,
          price: variantPrice
        }];
      }
    });

    toast({
      title: "Added to cart!",
      description: `${item.name}${variant ? ` (${variant.name})` : ''} added successfully`,
    });
  };

  const removeFromCart = (itemId: string, variantId?: string) => {
    setCart(prev => {
      return prev.reduce((acc, cartItem) => {
        if (cartItem.itemId === itemId && cartItem.variantId === variantId) {
          if (cartItem.quantity > 1) {
            acc.push({ ...cartItem, quantity: cartItem.quantity - 1 });
          }
          // If quantity is 1, don't add to acc (removes item)
        } else {
          acc.push(cartItem);
        }
        return acc;
      }, [] as CartItem[]);
    });
  };

  const getCartItemQuantity = (itemId: string, variantId?: string) => {
    const cartItem = cart.find(item => 
      item.itemId === itemId && item.variantId === variantId
    );
    return cartItem?.quantity || 0;
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const sendWhatsAppOrder = () => {
    if (!restaurant || cart.length === 0) return;

    const orderItems = cart.map(item => 
      `${item.quantity}x ${item.name}${item.variantName ? ` (${item.variantName})` : ''} - ${(item.price * item.quantity).toLocaleString()} ${menuItems[0]?.currency || 'RWF'}`
    ).join('\n');

    const message = `🍽️ New Order - Table ${tableId?.toUpperCase()}

${orderItems}

💰 Total: ${getCartTotal().toLocaleString()} ${menuItems[0]?.currency || 'RWF'}

📍 Restaurant: ${restaurant.name}
🪑 Table: ${tableId?.toUpperCase()}

Thank you for your order!`;

    const whatsappUrl = `https://wa.me/${restaurant.whatsapp_number.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Clear cart after sending order
    setCart([]);
    
    toast({
      title: "Order Sent!",
      description: "Your order has been sent via WhatsApp. The restaurant will prepare it shortly.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Menu</h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Restaurant Header */}
      <div 
        className="relative overflow-hidden text-white"
        style={{
          background: restaurant.brand_color 
            ? `linear-gradient(135deg, ${restaurant.brand_color}, ${restaurant.secondary_color || restaurant.brand_color})`
            : 'linear-gradient(135deg, hsl(24.6 95% 53.1%), hsl(12 76% 61%))'
        }}
      >
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        <div className="relative container mx-auto px-6 py-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl animate-fade-in">
            🍽️
          </div>
          <h1 className="text-3xl font-bold mb-2 animate-fade-in">{restaurant.name}</h1>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm text-white border-white/30">
              Table {tableId?.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category 
                    ? "shadow-glow" 
                    : "hover-scale"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-4 mb-24">
          {filteredItems.map((item, index) => (
            <Card 
              key={item.id} 
              className={`group overflow-hidden border-0 shadow-elegant hover:shadow-glow transition-all duration-300 hover-scale bg-card/80 backdrop-blur-sm animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-0">
                <div className="flex items-start gap-0">
                  {/* Image */}
                  {item.image_url && (
                    <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden">
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                          {item.name}
                        </h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                         {/* Single Price - variations not implemented yet */}
                         <div className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                           <div className="flex items-center gap-2">
                             <div className="flex items-center gap-1 text-sm font-bold text-primary">
                               <DollarSign className="h-3 w-3" />
                               <span>{item.price?.toLocaleString()} {item.currency || 'RWF'}</span>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2">
                             {getCartItemQuantity(item.id) > 0 ? (
                               <div className="flex items-center gap-2 bg-primary/10 rounded-full p-1">
                                 <Button 
                                   size="sm" 
                                   variant="ghost"
                                   onClick={() => removeFromCart(item.id)}
                                   className="h-6 w-6 rounded-full hover:bg-destructive/20 p-0"
                                 >
                                   <Minus className="h-3 w-3" />
                                 </Button>
                                 <span className="w-6 text-center text-sm font-bold text-primary">
                                   {getCartItemQuantity(item.id)}
                                 </span>
                                 <Button 
                                   size="sm" 
                                   variant="ghost"
                                   onClick={() => addToCart(item)}
                                   className="h-6 w-6 rounded-full hover:bg-primary/20 p-0"
                                 >
                                   <Plus className="h-3 w-3" />
                                 </Button>
                               </div>
                             ) : (
                               <Button 
                                 size="sm" 
                                 className="rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-primary to-primary-glow h-7 px-3 text-xs"
                                 onClick={() => addToCart(item)}
                               >
                                 <Plus className="h-3 w-3 mr-1" />
                                 Add
                               </Button>
                             )}
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* How to Order Card */}
        <Card className="bg-gradient-to-r from-secondary/10 to-accent/10 border-0 shadow-elegant mb-8">
          <CardContent className="p-6 text-center">
            <div className="mb-4 text-4xl">📱</div>
            <h3 className="font-bold text-lg mb-2">How to Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your items → Add to cart → Review → Send via WhatsApp → Enjoy!
            </p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>✓ Multiple sizes available</span>
              <span>✓ Instant ordering</span>
              <span>✓ Direct to kitchen</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Cart */}
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-in-right">
          <Card className="border-0 shadow-glow bg-gradient-to-r from-primary to-primary-glow text-white overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">
                      {getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''}
                    </div>
                    <div className="text-lg font-bold">
                      {getCartTotal().toLocaleString()} {menuItems[0]?.currency || 'RWF'}
                    </div>
                  </div>
                </div>
                <Button 
                  variant="secondary"
                  size="lg"
                  onClick={sendWhatsAppOrder}
                  className="bg-white text-primary hover:bg-white/90 font-bold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Order Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;