import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@supabase/supabase-js";
import MenuManager from "@/components/dashboard/MenuManager";
import EnhancedItemManager from "@/components/dashboard/EnhancedItemManager";
import EmbedCodeGenerator from "@/components/dashboard/EmbedCodeGenerator";
import PaymentStatusAlert from "@/components/PaymentStatusAlert";
import { simplePaymentAccessControl } from "@/services/simplePaymentAccessControl";
import { DiagnosticPanel } from "@/components/DiagnosticPanel";
import { RestaurantLoader } from "@/utils/restaurantLoader";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import ErrorFallback from "@/components/ErrorFallback";
import { RestaurantLoadingSkeleton } from "@/components/RestaurantLoadingSkeleton";
import RestaurantErrorBoundary from "@/components/RestaurantErrorBoundary";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { LoadingTracker, logError } from '@/utils/debugUtils';

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { errorState, handleError, clearError } = useErrorHandler({
    componentName: "Dashboard",
    showToast: true,
  });

  // Determine active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/dashboard/overview") return "overview";
    if (path === "/dashboard/menu") return "menu";
    if (path === "/dashboard/ai-import") return "ai-import";
    if (path === "/dashboard/embed") return "embed";
    if (path === "/dashboard/subscription") return "subscription";
    if (path === "/dashboard/settings") return "settings";
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  // Update active tab when location changes
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  useEffect(() => {
    const getUser = async () => {
      LoadingTracker.startLoading('Dashboard');
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          handleError(sessionError);
          return;
        }

        if (!session?.user) {
          navigate("/auth");
          return;
        }

        setUser(session.user);

        // Load restaurant data
        const restaurantData = await RestaurantLoader.loadRestaurantWithRetry(session.user.id);
        
        if (restaurantData.error && !restaurantData.restaurant) {
          // Try to create restaurant if it doesn't exist
          const createResult = await RestaurantLoader.createRestaurantWithRetry(
            session.user.id,
            session.user.email || ""
          );
          
          if (createResult.error) {
            handleError(createResult.error);
            setLoading(false);
            return;
          }
          
          setRestaurant(createResult.restaurant);
        } else {
          setRestaurant(restaurantData.restaurant);
        }

        // Check payment access
        if (restaurantData.restaurant) {
          const access = await simplePaymentAccessControl.checkRestaurantAccessBySlug(
            restaurantData.restaurant.slug
          );
          setAccessInfo(access);
        }

        setLoading(false);
        LoadingTracker.endLoading('Dashboard', true);
      } catch (err: any) {
        handleError(err);
        setLoading(false);
        LoadingTracker.endLoading('Dashboard', false);
        logError('Dashboard', err);
      }
    };

    getUser();
  }, [navigate]);

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
      <ModernDashboardLayout>
        <div className="space-y-6">
          {activeTab === "overview" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
                <p className="text-muted-foreground">
                  Welcome back! Here's what's happening with your restaurant.
                </p>
              </div>

              {/* Diagnostic Panel - Temporary for debugging */}
              {!restaurant && <DiagnosticPanel />}

              {/* Payment Status Alert */}
              {accessInfo && !accessInfo.hasAccess && restaurant && (
                <div className="mb-6">
                  <PaymentStatusAlert
                    accessInfo={accessInfo}
                    restaurant={restaurant}
                    onPaymentClick={() => navigate("/pricing")}
                  />
                </div>
              )}

              {/* Welcome Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
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
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get started with these common tasks</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Button onClick={() => navigate("/dashboard/menu")}>
                    Add Menu Item
                  </Button>
                  <Button onClick={() => navigate("/dashboard/qr")} variant="outline">
                    Tables & QR Codes
                  </Button>
                  <Button onClick={() => navigate("/dashboard/embed")} variant="outline">
                    View Public Menu
                  </Button>
                </CardContent>
              </Card>

              {/* Getting Started Guide */}
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>Follow these steps to set up your QR menu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <div>
                      <h4 className="font-semibold">Create Menu Categories</h4>
                      <p className="text-sm text-muted-foreground">Organize your menu with categories like "Appetizers", "Main Courses", etc.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <div>
                      <h4 className="font-semibold">Add Menu Items</h4>
                      <p className="text-sm text-muted-foreground">Add dishes with descriptions, prices, and photos to each category.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <div>
                      <h4 className="font-semibold">Set Up Tables & QR Codes</h4>
                      <p className="text-sm text-muted-foreground">Create tables and generate QR codes for each table in your restaurant.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                    <div>
                      <h4 className="font-semibold">Print & Display</h4>
                      <p className="text-sm text-muted-foreground">Print QR codes and place them on tables for customers to scan.</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate("/dashboard/menu")} className="mt-4">
                    Start With Menu Items
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "menu" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Menu Items</h1>
                <p className="text-muted-foreground">
                  Manage your restaurant's menu items, categories, and options.
                </p>
              </div>
              {user && <EnhancedItemManager user={user} />}
            </>
          )}

          {activeTab === "ai-import" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Menu Import</h1>
                <p className="text-muted-foreground">
                  Import your menu from images using AI technology.
                </p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    AI menu import feature coming soon. Upload menu images and let AI extract items automatically.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "embed" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Embed Codes</h1>
                <p className="text-muted-foreground">
                  Generate embed codes to display your menu on any website.
                </p>
              </div>
              {restaurant && <EmbedCodeGenerator restaurant={restaurant} />}
            </>
          )}

          {activeTab === "subscription" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
                <p className="text-muted-foreground">
                  Manage your subscription and billing information.
                </p>
              </div>
              {user && restaurant && (
                <div className="space-y-4">
                  <PaymentStatusAlert
                    accessInfo={accessInfo}
                    restaurant={restaurant}
                    onPaymentClick={() => navigate("/pricing")}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "settings" && (
            <>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Restaurant Settings</h1>
                <p className="text-muted-foreground">
                  Configure your restaurant profile and preferences.
                </p>
              </div>
              {user && restaurant && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Restaurant settings interface coming soon...
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </ModernDashboardLayout>
    </RestaurantErrorBoundary>
  );
};

export default Dashboard;
