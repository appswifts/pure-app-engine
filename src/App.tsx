import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { errorService } from "@/services/errorService";

import AdminLogin from "@/pages/AdminLogin";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PasswordReset from "./pages/PasswordReset";
import SignupFlow from "./pages/SignupFlow";
import Dashboard from "./pages/Dashboard";
import PublicMenu from "./pages/PublicMenu";
import RestaurantSettings from "./pages/RestaurantSettings";
import Terms from "./pages/Terms";
import AdminDashboard from "./pages/AdminDashboard";
import PricingPage from "./pages/PricingPage";
import Payment from "./pages/Payment";
import SeedPage from "./pages/SeedPage";
import Subscription from "./pages/Subscription";
import RestaurantSignupFlow from "./pages/RestaurantSignupFlow";
import NotFound from "./pages/NotFound";
import EmbedMenu from "./components/EmbedMenu";
import AIMenuImport from "./pages/AIMenuImport";
import MenuManagement from "./pages/MenuManagement";
import UserProfile from "./pages/UserProfile";
import { ProtectedRoute, AdminProtectedRoute } from "./components/ProtectedRoute";

import { createOptimizedQueryClient } from '@/lib/queryOptimization';

const queryClient = createOptimizedQueryClient();

const App = () => {
  const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to error service
    errorService.logError(error, {
      componentStack: errorInfo.componentStack,
      errorType: "critical",
    });
  };

  return (
    <ErrorBoundary onError={handleGlobalError}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
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
                  
                  {/* Auth Routes - redirect if already authenticated */}
                  <Route path="/auth" element={<ProtectedRoute requireAuth={false}><Auth /></ProtectedRoute>} />
                  <Route path="/password-reset" element={<ProtectedRoute requireAuth={false}><PasswordReset /></ProtectedRoute>} />
                  <Route path="/signup-flow" element={<ProtectedRoute requireAuth={false}><SignupFlow /></ProtectedRoute>} />
                  <Route path="/restaurant-signup" element={<ProtectedRoute requireAuth={false}><RestaurantSignupFlow /></ProtectedRoute>} />
                  
                  {/* Protected Dashboard Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/overview" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/menu" element={<ProtectedRoute><MenuManagement /></ProtectedRoute>} />
                  <Route path="/dashboard/qr" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/embed" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/ai-import" element={<ProtectedRoute><AIMenuImport /></ProtectedRoute>} />
                  <Route path="/dashboard/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                  <Route path="/dashboard/settings" element={<ProtectedRoute><RestaurantSettings /></ProtectedRoute>} />
                  <Route path="/dashboard/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                  <Route path="/dashboard/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/overview" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/restaurants" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/packages" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/payment-gateways" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/subscriptions" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/manual-payments" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/whatsapp" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                  
                  {/* Public Menu Routes */}
                  <Route path="/menu/:restaurantSlug/:tableSlug" element={<PublicMenu />} />
                  <Route path="/user/:restaurantSlug/:tableSlug" element={<PublicMenu />} />
                  <Route path="/embed/:restaurantSlug" element={<EmbedMenu />} />
                  
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
    </ErrorBoundary>
  );
};

export default App;
