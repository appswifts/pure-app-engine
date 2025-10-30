import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { RestaurantSidebar } from "@/components/RestaurantSidebar";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UnifiedSubscriptionFlow from "@/components/UnifiedSubscriptionFlow";

const Subscription = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <RestaurantSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading subscription data...</p>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RestaurantSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div>
              <h1 className="text-xl font-semibold">Subscription & Payments</h1>
              <p className="text-sm text-muted-foreground">Manage your restaurant's subscription with Stripe</p>
            </div>
          </header>

          <div className="flex-1 p-4 pt-6">
            <UnifiedSubscriptionFlow />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Subscription;