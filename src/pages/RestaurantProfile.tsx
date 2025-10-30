import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageCircle, 
  Phone, 
  MapPin, 
  Clock, 
  Star, 
  Menu as MenuIcon,
  QrCode,
  Share2,
  ExternalLink,
  ChefHat,
  Utensils,
  Coffee,
  Wine,
  Cake,
  Store,
  Globe,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// Use the exact database types
type Restaurant = Tables<"restaurants">;
type MenuCategory = Tables<"categories"> & {
  item_count?: number;
};
type MenuItem = Tables<"menu_items"> & {
  item_variations?: any[];
};

const RestaurantProfile = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
    }
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      console.log("Loading restaurant profile for:", restaurantId);

      // Load restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", restaurantId)
        .single();

      if (restaurantError) throw new Error("Restaurant not found");
      setRestaurant(restaurantData);

      // Load menu categories with item counts
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select(`
          *,
          menu_items(count)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("is_active", true)
        .order("display_order");

      if (categoriesError) throw categoriesError;
      
      const categoriesWithCounts = categoriesData?.map(category => ({
        ...category,
        item_count: category.menu_items?.[0]?.count || 0
      })) || [];
      
      setCategories(categoriesWithCounts);

      // Load featured items (first 6 available items)
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select(`
          *,
          item_variations(*)
        `)
        .eq("restaurant_id", restaurantId)
        .eq("is_available", true)
        .order("display_order")
        .limit(6);

      if (itemsError) throw itemsError;
      setFeaturedItems(itemsData || []);

    } catch (error: any) {
      console.error("Error loading restaurant data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `${(price / 100).toLocaleString()} RWF`;
  };

  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('appetizer') || name.includes('starter')) return ChefHat;
    if (name.includes('main') || name.includes('entree')) return Utensils;
    if (name.includes('dessert') || name.includes('sweet')) return Cake;
    if (name.includes('drink') || name.includes('beverage')) return Coffee;
    if (name.includes('wine') || name.includes('alcohol')) return Wine;
    return MenuIcon;
  };

  const handleWhatsAppOrder = () => {
    if (restaurant?.whatsapp_number) {
      const message = `Hello! I'd like to place an order from ${restaurant.name}. Can you help me?`;
      const url = `https://wa.me/${restaurant.whatsapp_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const handleViewMenu = () => {
    navigate(`/public-menu/${restaurantId}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: restaurant?.name,
        text: `Check out ${restaurant?.name}'s menu!`,
        url: url
      });
    } else {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-semibold mb-2">Restaurant Not Found</h1>
          <p className="text-muted-foreground">The restaurant you're looking for doesn't exist or is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            ← Back
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Restaurant Profile */}
        <div className="text-center space-y-4">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/20">
            <AvatarImage src={restaurant.logo_url} alt={restaurant.name} />
            <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
              {restaurant.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="default">
                🟢 Open
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>4.8</span>
              </div>
            </div>
          </div>

          {/* Address section removed since column doesn't exist */}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={handleWhatsAppOrder}
            className="h-14 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Order via WhatsApp
          </Button>
          <Button 
            onClick={handleViewMenu}
            variant="outline" 
            className="h-14 border-2"
          >
            <MenuIcon className="h-5 w-5 mr-2" />
            View Full Menu
          </Button>
        </div>

        {/* Featured Menu Items */}
        {featuredItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Featured Items</h2>
              <Button variant="ghost" size="sm" onClick={handleViewMenu}>
                View All
                <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid gap-3">
              {featuredItems.slice(0, 3).map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      {/* Image */}
                      <div className="flex-shrink-0">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{item.name}</h3>
                          {item.item_variations && item.item_variations.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {item.item_variations.length} options
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatPrice(item.base_price)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Menu Categories */}
        {categories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Menu Categories</h2>
            <div className="grid gap-3">
              {categories.map((category) => {
                const IconComponent = getCategoryIcon(category.name);
                return (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    onClick={() => navigate(`/public-menu/${restaurantId}?category=${category.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{category.name}</h3>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {category.item_count} items
                          </Badge>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-3">
              {restaurant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{restaurant.phone}</span>
                </div>
              )}
              {restaurant.whatsapp_number && (
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{restaurant.whatsapp_number}</span>
                </div>
              )}
              {restaurant.email && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{restaurant.email}</span>
                </div>
              )}
              {/* Address field removed since column doesn't exist */}
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Operating Hours
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Monday - Thursday</span>
                <span className="text-muted-foreground">9:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Friday - Saturday</span>
                <span className="text-muted-foreground">9:00 AM - 11:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="text-muted-foreground">10:00 AM - 9:00 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </Button>
              <Button variant="outline" size="sm">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="outline" size="sm">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p>Powered by QR Dine</p>
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfile; 