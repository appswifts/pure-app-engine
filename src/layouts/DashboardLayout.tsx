import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu as MenuIcon, X, ChevronRight } from "lucide-react";
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
        
        const { data: adminData } = await supabase.rpc('is_admin', { _user_id: session.user.id });
        setIsAdmin(!!adminData);
        
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
    { id: "overview", label: "Dashboard", materialIcon: "dashboard", description: "Overview & stats" },
    { id: "menu", label: "Menu", materialIcon: "restaurant_menu", description: "Manage items" },
    { id: "ai-import", label: "AI Import", materialIcon: "smart_toy", description: "Auto-import menu" },
    { id: "tables", label: "Tables", materialIcon: "table_restaurant", description: "Table management" },
    { id: "qr", label: "QR Codes", materialIcon: "qr_code_2", description: "Generate codes" },
    { id: "embed", label: "Embed", materialIcon: "code", description: "Website integration" },
    { id: "subscription", label: "Billing", materialIcon: "credit_card", description: "Subscription" },
    { id: "settings", label: "Settings", materialIcon: "settings", description: "Preferences" }
  ];

  if (loading) {
    return <RestaurantLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Mobile Header */}
      <header className="lg:hidden bg-card/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
          <BrandLogo size="responsive" restaurant={restaurant} />
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-full">
          {sidebarOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar - Modern Glass Design */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 
          bg-card/80 backdrop-blur-xl border-r border-border/50
          transition-all duration-300 ease-out overflow-y-auto
          shadow-xl lg:shadow-none
        `}>
          <div className="flex flex-col h-full">
            {/* Mobile Close Button */}
            <div className="lg:hidden p-4 flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Profile Section */}
            <div className="px-4 py-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={user?.user_metadata?.avatar_url || restaurant?.logo_url} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(restaurant?.name || 'R')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold text-foreground truncate">
                    {restaurant?.name || 'My Restaurant'}
                  </h1>
                  <p className="text-xs text-muted-foreground">Restaurant Owner</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
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
                    className={`
                      group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                      transition-all duration-200 ease-out text-left
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.materialIcon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm block">{item.label}</span>
                      <span className="text-[10px] opacity-70 block">{item.description}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-4 w-4 animate-in slide-in-from-left-1" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 space-y-2 border-t border-border/50">
              {isAdmin && (
                <button
                  onClick={() => {
                    navigate("/admin");
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">shield</span>
                  <span className="text-sm font-medium">Admin Panel</span>
                </button>
              )}
              <button
                onClick={() => {
                  handleSignOut();
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen lg:ml-64 w-full">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
