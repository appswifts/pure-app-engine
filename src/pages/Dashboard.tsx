import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BrandLogo from "@/components/BrandLogo";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ChefHat, LogOut, Plus, QrCode, Settings, Menu as MenuIcon, Shield, BarChart3, Utensils, CreditCard, AlertTriangle, Clock, X, Wallet, Code, Sparkles, Grid3x3 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import MenuManager from "@/components/dashboard/MenuManager";
import SimpleMenuQRGenerator from "@/components/dashboard/SimpleMenuQRGenerator";
import TableManager from "@/components/dashboard/TableManager";
import EnhancedItemManager from "@/components/dashboard/EnhancedItemManager";
import EmbedCodeGenerator from "@/components/dashboard/EmbedCodeGenerator";
import PaymentStatusAlert from "@/components/PaymentStatusAlert";
import { simplePaymentAccessControl } from "@/services/simplePaymentAccessControl";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RestaurantLoader } from "@/utils/restaurantLoader";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorFallback from "@/components/ErrorFallback";
import { RestaurantLoadingSkeleton, DashboardOverviewSkeleton } from "@/components/RestaurantLoadingSkeleton";
import RestaurantErrorBoundary from "@/components/RestaurantErrorBoundary";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { errorState, handleError, clearError, tryExecute } = useErrorHandler({
    componentName: "Dashboard",
    showToast: true,
  });
  
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session?.user) {
          navigate("/auth");
          return;
        }
        
        setUser(session.user);
        
        // Check if user is admin using the correct function
        const { data: adminData, error: adminError } = await supabase.rpc('is_admin', { _user_id: session.user.id });
        if (adminError) {
          console.warn('Failed to check admin status:', adminError);
        }
        setIsAdmin(!!adminData);
        
        // Fetch all restaurants for the user
        const { data: userRestaurants, error: restaurantsError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });
        
        if (restaurantsError) {
          throw restaurantsError;
        }
        
        if (userRestaurants && userRestaurants.length > 0) {
          setRestaurants(userRestaurants);
          
          // Check if there's a stored restaurant ID in localStorage
          const storedRestaurantId = localStorage.getItem('selectedRestaurantId');
          const selectedRestaurant = storedRestaurantId 
            ? userRestaurants.find(r => r.id === storedRestaurantId)
            : null;
          
          // Use stored restaurant if found, otherwise use the first one
          setRestaurant(selectedRestaurant || userRestaurants[0]);
        } else {
          // No restaurant exists - user needs to create one manually
          console.log('No restaurants found. User should create one in Menu Management.');
          setRestaurant(null);
          setRestaurants([]);
        }
      } catch (error) {
        handleError(
          error,
          "error",
          "Failed to load dashboard data. Please refresh the page."
        );
      } finally {
        setLoading(false);
      }
    };

    tryExecute(getUser);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      handleError(error, "error", "Failed to sign out. Please try again.");
    }
  };

  const sidebarItems = [
    {
      id: "overview",
      label: "Dashboard",
      materialIcon: "dashboard",
      description: "Dashboard overview and quick stats"
    },
    {
      id: "menu",
      label: "Menu Management",
      materialIcon: "restaurant_menu",
      description: "Manage your menu items and categories"
    },
    {
      id: "ai-import",
      label: "AI Menu Import",
      materialIcon: "smart_toy",
      description: "Import menu from images using AI"
    },
    {
      id: "tables",
      label: "Tables",
      materialIcon: "table_restaurant",
      description: "Manage restaurant tables"
    },
    {
      id: "qr",
      label: "QR Code Generator",
      materialIcon: "qr_code_2",
      description: "Generate QR codes for tables"
    },
    {
      id: "embed",
      label: "Embed Code",
      materialIcon: "code",
      description: "Generate embed codes for websites"
    },
    {
      id: "subscription",
      label: "Subscription",
      materialIcon: "credit_card",
      description: "Manage subscription & payments"
    },
    {
      id: "settings",
      label: "Settings",
      materialIcon: "settings",
      description: "Restaurant settings and preferences"
    }
  ];

  if (loading) {
    return <RestaurantLoadingSkeleton />;
  }

  if (errorState.hasError && !restaurant) {
    return (
      <ErrorFallback
        error={errorState.error}
        errorType="general"
        resetError={clearError}
        showDetails={true}
      />
    );
  }

  return (
    <RestaurantErrorBoundary>
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
                      // Navigate to appropriate URL based on item id
                      const urlMap = {
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
                      setSidebarOpen(false); // Close sidebar on mobile after selection
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
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">Welcome back! Here's what's happening with your restaurant.</p>
              </div>
              
              {/* Diagnostic Panel - Temporary for debugging */}
              {!restaurant && (
                <DiagnosticPanel />
              )}
              
              {/* Payment Status Alert - Show prominently if payment action needed */}
              {accessInfo && !accessInfo.hasAccess && restaurant && (
                <div className="mb-6">
                  <PaymentStatusAlert 
                    accessInfo={accessInfo} 
                    restaurant={restaurant}
                    onPaymentClick={() => navigate('/pricing')}
                  />
                </div>
              )}
              
              <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Subscription Status - simplified for manual payments */}
                
                {/* Quick Stats */}
                <Card className={restaurant ? "col-span-1 md:col-span-2 lg:col-span-2" : "col-span-1 md:col-span-2 lg:col-span-3"}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChefHat className="h-5 w-5" />
                      Welcome to Your QR Menu Dashboard
                    </CardTitle>
                    <CardDescription>
                      Manage your restaurant's digital menu and generate QR codes for seamless customer experience
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Get started with these common tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/dashboard/menu")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Item
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/dashboard/qr")}
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate("/menu")}
                    >
                      <MenuIcon className="h-4 w-4 mr-2" />
                      View Public Menu
                    </Button>
                  </CardContent>
                </Card>

                {/* Getting Started Guide */}
                <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                    <CardDescription>Follow these steps to set up your QR menu</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                      <div>
                        <h4 className="font-medium">Create Menu Categories</h4>
                        <p className="text-sm text-muted-foreground">Organize your menu with categories like "Appetizers", "Main Courses", etc.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                      <div>
                        <h4 className="font-medium">Add Menu Items</h4>
                        <p className="text-sm text-muted-foreground">Add dishes with descriptions, prices, and photos to each category.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                      <div>
                        <h4 className="font-medium">Generate QR Codes</h4>
                        <p className="text-sm text-muted-foreground">Create unique QR codes for each table in your restaurant.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-semibold">4</div>
                      <div>
                        <h4 className="font-medium">Print & Display</h4>
                        <p className="text-sm text-muted-foreground">Print QR codes and place them on tables for customers to scan.</p>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button 
                        variant="gradient" 
                        size="lg"
                        onClick={() => navigate("/dashboard/menu")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start With Menu Items
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
                <p className="text-muted-foreground">Manage your restaurant's menu items, categories, and options.</p>
              </div>
              {user && (
                <EnhancedItemManager user={user} />
              )}
            </div>
          )}

          {activeTab === "tables" && (
            <div className="space-y-6">
              {user && (
                <TableManager />
              )}
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-6">
              {user && (
                <SimpleMenuQRGenerator />
              )}
            </div>
          )}

          {activeTab === "embed" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Embed Codes</h1>
                <p className="text-muted-foreground">Generate embed codes to display your menu on any website.</p>
              </div>
              {restaurant && (
                <EmbedCodeGenerator restaurant={restaurant} />
              )}
            </div>
          )}

          {activeTab === "subscription" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-muted-foreground">Manage your subscription and billing information.</p>
              </div>
              {user && restaurant && (
                <div className="space-y-4">
                  <PaymentStatusAlert 
                    accessInfo={accessInfo} 
                    restaurant={restaurant}
                    onPaymentClick={() => navigate('/pricing')}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
                <p className="text-muted-foreground">Configure your restaurant profile and preferences.</p>
              </div>
              {user && restaurant && (
                <div>
                  <p className="text-muted-foreground">Restaurant settings interface coming soon...</p>
                </div>
              )}
            </div>
          )}

          </div>
        </main>
      </div>
    </div>
    </RestaurantErrorBoundary>
  );
};

export default Dashboard;