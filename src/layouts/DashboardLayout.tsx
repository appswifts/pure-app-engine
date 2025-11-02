import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Menu as MenuIcon, X } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { RestaurantLoadingSkeleton } from "@/components/RestaurantLoadingSkeleton";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/overview') return 'overview';
    if (path === '/dashboard/menu') return 'menu';
    if (path === '/dashboard/ai-import') return 'ai-import';
    if (path === '/dashboard/tables') return 'tables';
    if (path === '/dashboard/qr') return 'qr';
    if (path === '/dashboard/embed') return 'embed';
    if (path === '/dashboard/subscription') return 'subscription';
    if (path === '/dashboard/settings') return 'settings';
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate("/auth");
          return;
        }
        
        setUser(session.user);
        
        // Check if user is admin
        const { data: adminData } = await supabase.rpc('is_admin', { _user_id: session.user.id });
        setIsAdmin(!!adminData);
        
        // Fetch restaurants
        const { data: userRestaurants } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        
        if (userRestaurants && userRestaurants.length > 0) {
          const storedRestaurantId = localStorage.getItem('selectedRestaurantId');
          const selectedRestaurant = storedRestaurantId 
            ? userRestaurants.find(r => r.id === storedRestaurantId)
            : null;
          
          setRestaurant(selectedRestaurant || userRestaurants[0]);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const sidebarItems = [
    { id: "overview", label: "Dashboard", materialIcon: "dashboard" },
    { id: "menu", label: "Menu Management", materialIcon: "restaurant_menu" },
    { id: "ai-import", label: "AI Menu Import", materialIcon: "smart_toy" },
    { id: "tables", label: "Tables", materialIcon: "table_restaurant" },
    { id: "qr", label: "QR Code Generator", materialIcon: "qr_code_2" },
    { id: "embed", label: "Embed Code", materialIcon: "code" },
    { id: "subscription", label: "Subscription", materialIcon: "credit_card" },
    { id: "settings", label: "Settings", materialIcon: "settings" }
  ];

  if (loading) {
    return <RestaurantLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
      {/* Mobile Header */}
      <div className="lg:hidden bg-background-light dark:bg-background-dark border-b border-primary-green/20 dark:border-primary-green/30 p-4 flex items-center justify-between sticky top-0 z-30">
        <BrandLogo size="responsive" restaurant={restaurant} />
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar - Fixed/Sticky */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-background-light dark:bg-background-dark p-4 flex flex-col justify-between border-r border-primary-green/20 dark:border-primary-green/30 transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <div>
            {/* Mobile Close Button */}
            <div className="lg:hidden mb-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-3 mb-8">
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 flex-shrink-0"
                style={{backgroundImage: `url(${user?.user_metadata?.avatar_url || restaurant?.logo_url || 'https://via.placeholder.com/48'})`}}
              />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {user?.user_metadata?.full_name || restaurant?.name || 'Restaurant Owner'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Owner</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-2">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <a
                    key={item.id}
                    onClick={() => {
                      const urlMap: Record<string, string> = {
                        'overview': '/dashboard/overview',
                        'menu': '/dashboard/menu',
                        'ai-import': '/dashboard/ai-import',
                        'tables': '/dashboard/tables',
                        'qr': '/dashboard/qr',
                        'embed': '/dashboard/embed',
                        'subscription': '/dashboard/subscription',
                        'settings': '/dashboard/settings'
                      };
                      navigate(urlMap[item.id] || '/dashboard/overview');
                      setSidebarOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${
                      isActive 
                        ? 'bg-primary-green/20 dark:bg-primary-green/30 text-gray-900 dark:text-white font-medium' 
                        : 'hover:bg-primary-green/10 dark:hover:bg-primary-green/20 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.materialIcon}</span>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="flex flex-col gap-2">
            <a
              onClick={() => {
                navigate("/dashboard/restaurants");
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-green/10 dark:hover:bg-primary-green/20 cursor-pointer text-gray-700 dark:text-gray-300"
            >
              <span className="material-symbols-outlined">store</span>
              <span>My Restaurants</span>
            </a>
            {isAdmin && (
              <a
                onClick={() => {
                  navigate("/admin");
                  setSidebarOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-green/10 dark:hover:bg-primary-green/20 cursor-pointer text-gray-700 dark:text-gray-300"
              >
                <span className="material-symbols-outlined">shield</span>
                <span>Admin Panel</span>
              </a>
            )}
            <a
              onClick={() => {
                handleSignOut();
                setSidebarOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-primary-green/10 dark:hover:bg-primary-green/20 cursor-pointer text-gray-700 dark:text-gray-300"
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Sign Out</span>
            </a>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - Offset for Sidebar */}
        <main className="flex-1 min-h-screen overflow-auto lg:ml-64 w-full">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
