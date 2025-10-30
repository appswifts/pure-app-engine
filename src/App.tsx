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
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                  <Route path="/signup-flow" element={<SignupFlow />} />
                  <Route path="/restaurant-signup" element={<RestaurantSignupFlow />} />
                  
                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/dashboard/overview" element={<Dashboard />} />
                  <Route path="/dashboard/menu" element={<Dashboard />} />
                  <Route path="/dashboard/qr" element={<Dashboard />} />
                  <Route path="/dashboard/embed" element={<Dashboard />} />
                  <Route path="/dashboard/ai-import" element={<AIMenuImport />} />
                  <Route path="/dashboard/subscription" element={<Subscription />} />
                  <Route path="/dashboard/settings" element={<RestaurantSettings />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/overview" element={<AdminDashboard />} />
                  <Route path="/admin/restaurants" element={<AdminDashboard />} />
                  <Route path="/admin/packages" element={<AdminDashboard />} />
                  <Route path="/admin/payment-gateways" element={<AdminDashboard />} />
                  <Route path="/admin/subscriptions" element={<AdminDashboard />} />
                  <Route path="/admin/manual-payments" element={<AdminDashboard />} />
                  <Route path="/admin/whatsapp" element={<AdminDashboard />} />
                  
                  <Route path="/dashboard/payment" element={<Payment />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/checkout" element={<PricingPage />} />
                  <Route path="/seed" element={<SeedPage />} />
                  <Route path="/menu/:restaurantSlug/:tableSlug" element={<PublicMenu />} />
                  <Route path="/user/:restaurantSlug/:tableSlug" element={<PublicMenu />} />
                  <Route path="/embed/:restaurantSlug" element={<EmbedMenu />} />
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
