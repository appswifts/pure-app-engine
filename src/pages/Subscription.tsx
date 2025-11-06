import { useState, useEffect } from "react";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
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
      <ModernDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading subscription data...</p>
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Subscription & Payments</h1>
          <p className="text-muted-foreground">Manage your restaurant's subscription</p>
        </div>
        <UnifiedSubscriptionFlow />
      </div>
    </ModernDashboardLayout>
  );
};

export default Subscription;
