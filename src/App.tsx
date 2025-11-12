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
import RestaurantsGrid from "./pages/RestaurantsGrid";
import RestaurantOverview from "./pages/RestaurantOverview";
import MenuGroupManagement from "./pages/MenuGroupManagement";
import MenuGroupSettings from "./pages/MenuGroupSettings";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import SeedPage from "./pages/SeedPage";
import NotFound from "./pages/NotFound";
import AIMenuImport from "./pages/AIMenuImport";
import UserProfile from "./pages/UserProfile";
import TablesAndQR from "./pages/TablesAndQR";
import { RedirectToOverview } from "./components/RedirectToOverview";
import {
  ProtectedRoute,
  AdminProtectedRoute,
} from "./components/ProtectedRoute";
import { LoadingDebugPanel } from "./components/LoadingDebugPanel";
import { AuthCleanup } from "@/utils/authCleanup";

import { createOptimizedQueryClient } from "@/lib/queryOptimization";

const queryClient = createOptimizedQueryClient();

const App = () => {
  // Initialize i18n system on app start
  useEffect(() => {
    initializeI18n().catch(console.error);
    
    // Validate auth tokens on startup
    AuthCleanup.validateTokens().then(isValid => {
      if (!isValid) {
        console.warn('Auth tokens may need refresh - run AuthCleanup.fixAuthLoading() if experiencing issues');
      }
    });
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
                  <LoadingDebugPanel />
                  <BrowserRouter>
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/terms" element={<Terms />} />

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
                      path="/dashboard/ai-import"
                      element={
                        <ProtectedRoute>
                          <AIMenuImport />
                        </ProtectedRoute>
                      }
                    />
                    {/* Settings routes removed - pages deleted */}
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
                      path="/admin/users"
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
                      path="/admin/subscriptions"
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
                      path="/admin/subscriptions"
                      element={
                        <ProtectedRoute adminOnly>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
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
                      element={<PublicMenu />}
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
