import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { SafeImage } from "@/components/ui/safe-image";
import { ChevronRight } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  brand_color?: string;
  secondary_color?: string;
  text_color?: string;
  logo_url?: string;
  background_style?: string;
  background_color?: string;
  background_image?: string;
  slug?: string;
}

interface MenuGroup {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

const MenuGroupSelect = () => {
  const { restaurantSlug, tableId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantSlug && tableId) {
      loadData();
    }
  }, [restaurantSlug, tableId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load restaurant
      const { data: restaurantData, error: restaurantError } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", restaurantSlug)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurant(restaurantData);

      // Get selected group slugs from URL query parameter
      const groupsParam = searchParams.get("groups");
      const selectedGroupSlugs = groupsParam ? groupsParam.split(',') : [];

      // Load menu groups
      let query = supabase
        .from("menu_groups")
        .select("*")
        .eq("restaurant_id", restaurantData.id)
        .eq("is_active", true)
        .order("display_order");

      const { data: allGroupsData, error: groupsError } = await query;

      if (groupsError) throw groupsError;
      
      // Filter by selected group slugs if specified
      let filteredGroups = allGroupsData || [];
      if (selectedGroupSlugs.length > 0) {
        filteredGroups = filteredGroups.filter((g: any) => 
          selectedGroupSlugs.includes(g.slug)
        );
      }
      
      setMenuGroups(filteredGroups);

    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupSelect = (group: MenuGroup) => {
    // Navigate to single group URL: /menu/:restaurantSlug/:tableId/group/:groupSlug
    const groupSlug = (group as any).slug || 'menu';
    navigate(`/menu/${restaurantSlug}/${tableId}/group/${groupSlug}`);
  };

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
      default:
        return { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={getBackgroundStyle()}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
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
          <p className="text-red-100 mb-4">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        ...getBackgroundStyle(),
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="relative z-10">
        {/* Restaurant Header */}
        <div className="text-center pt-12 pb-8">
          <div className="mb-6">
            <div 
              className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 transition-transform hover:scale-105"
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
            className="text-3xl font-bold mb-2"
            style={{ color: restaurant.text_color || '#FFFFFF' }}
          >
            {restaurant.name}
          </h1>
          <p 
            className="text-lg opacity-90"
            style={{ color: restaurant.text_color || '#FFFFFF' }}
          >
            Choose Your Menu
          </p>
        </div>

        {/* Menu Group Selection */}
        <div className="px-4 pb-12">
          <div className="max-w-md mx-auto space-y-3">
            {menuGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🍽️</div>
                <h3 
                  className="text-lg font-medium mb-2"
                  style={{ color: restaurant.text_color || '#FFFFFF' }}
                >
                  No menus available
                </h3>
                <p style={{ color: `${restaurant.text_color || '#FFFFFF'}80` }}>
                  Please contact the restaurant.
                </p>
              </div>
            ) : (
              menuGroups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:scale-102 transition-transform shadow-lg"
                  onClick={() => handleGroupSelect(group)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight 
                        className="h-6 w-6 text-muted-foreground flex-shrink-0 ml-4"
                        style={{ color: restaurant.brand_color || '#F97316' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuGroupSelect;
