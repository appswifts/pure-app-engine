import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { AuthProvider } from "@/hooks/useAuth";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { errorService } from "@/services/errorService";
import { initializeI18n } from "@/lib/i18n";
import { useEffect } from "react";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PasswordReset from "./pages/PasswordReset";
import Dashboard from "./pages/Dashboard";
import PublicMenu from "./pages/PublicMenu";
import MenuGroupSelect from "./pages/MenuGroupSelect";
import RestaurantSettings from "./pages/RestaurantSettings";
import UserSettings from "./pages/UserSettings";
import RestaurantsGrid from "./pages/RestaurantsGrid";
import RestaurantOverview from "./pages/RestaurantOverview";
import MenuGroupManagement from "./pages/MenuGroupManagement";
import MenuGroupSettings from "./pages/MenuGroupSettings";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import PricingPage from "./pages/PricingPage";
import Payment from "./pages/Payment";
import SeedPage from "./pages/SeedPage";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import EmbedMenu from "./components/EmbedMenu";
import AIMenuImport from "./pages/AIMenuImport";
import UserProfile from "./pages/UserProfile";
import TablesAndQR from "./pages/TablesAndQR";
import { RedirectToOverview } from "./components/RedirectToOverview";
import {
  ProtectedRoute,
  AdminProtectedRoute,
} from "./components/ProtectedRoute";

import { createOptimizedQueryClient } from "@/lib/queryOptimization";

const queryClient = createOptimizedQueryClient();

const App = () => {
  // Initialize i18n system on app start
  useEffect(() => {
    initializeI18n().catch(console.error);
  }, []);
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to error service
    errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      errorType: "critical",
    });
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <HeroUIProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <SecurityProvider>
                <TooltipProvider delayDuration={0}>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/checkout" element={<PricingPage />} />

                    {/* Auth Routes - unified authentication */}
                    <Route
                      path="/auth"
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <Auth />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/password-reset"
                      element={
                        <ProtectedRoute requireAuth={false}>
                          <PasswordReset />
                        </ProtectedRoute>
                      }
                    />

                    {/* Legacy route redirects for backward compatibility */}
                    <Route path="/admin/login" element={<Auth />} />
                    <Route path="/signup-flow" element={<Auth />} />
                    <Route path="/restaurant-signup" element={<Auth />} />

                    {/* Protected Dashboard Routes */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/overview"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/restaurant/:slug"
                      element={
                        <ProtectedRoute>
                          <RestaurantOverview />
                        </ProtectedRoute>
                      }
                    />
                    {/* Redirect old manage route to overview */}
                    <Route
                      path="/dashboard/restaurant/:slug/manage"
                      element={<RedirectToOverview />}
                    />
                    <Route
                      path="/dashboard/restaurant/:slug/group/:groupSlug"
                      element={
                        <ProtectedRoute>
                          <MenuGroupManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/restaurant/:slug/group/:groupSlug/settings"
                      element={
                        <ProtectedRoute>
                          <MenuGroupSettings />
                        </ProtectedRoute>
                      }
                    />
                    {/* Clean URL routes for menu groups (by slug) */}
                    <Route
                      path="/dashboard/menu-groups/:slug"
                      element={
                        <ProtectedRoute>
                          <MenuGroupManagement />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/menu-groups/:slug/settings"
                      element={
                        <ProtectedRoute>
                          <MenuGroupSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/qr"
                      element={
                        <ProtectedRoute>
                          <TablesAndQR />
                        </ProtectedRoute>
                      }
                    />
                    {/* Redirect old tables route to QR page */}
                    <Route
                      path="/dashboard/tables"
                      element={<Navigate to="/dashboard/qr" replace />}
                    />
                    <Route
                      path="/dashboard/embed"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/ai-import"
                      element={
                        <ProtectedRoute>
                          <AIMenuImport />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/subscription"
                      element={
                        <ProtectedRoute>
                          <Subscription />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/settings"
                      element={
                        <ProtectedRoute>
                          <UserSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/restaurant-settings"
                      element={
                        <ProtectedRoute>
                          <RestaurantSettings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/restaurants"
                      element={
                        <ProtectedRoute>
                          <RestaurantsGrid />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/profile"
                      element={
                        <ProtectedRoute>
                          <UserProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/payment"
                      element={
                        <ProtectedRoute>
                          <Payment />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/payment"
                      element={
                        <ProtectedRoute>
                          <Payment />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/overview"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/restaurants"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/packages"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/payment-gateways"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/subscriptions"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/manual-payments"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/whatsapp"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Public Menu Routes */}
                    <Route
                      path="/menu/:restaurantSlug/:tableSlug/select-group"
                      element={<MenuGroupSelect />}
                    />
                    <Route
                      path="/menu/:restaurantSlug/:tableSlug"
                      element={<PublicMenu />}
                    />
                    <Route
                      path="/embed/:restaurantSlug"
                      element={<EmbedMenu />}
                    />

                    {/* Legacy Routes for backward compatibility */}
                    <Route
                      path="/public-menu/:restaurantSlug/:tableSlug"
                      element={<PublicMenu />}
                    />
                    <Route
                      path="/user/:restaurantSlug/:tableSlug"
                      element={<PublicMenu />}
                    />

                    {/* Development/Testing Route */}
                    <Route path="/seed" element={<SeedPage />} />

                    {/* 404 Not Found */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </SecurityProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
      </HeroUIProvider>
    </ErrorBoundary>
  );
};

export default App;
