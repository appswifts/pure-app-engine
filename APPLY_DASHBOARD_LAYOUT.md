# Apply DashboardLayout to Remaining Pages

## Status

✅ **AIMenuImport** - COMPLETE (wrapped with DashboardLayout)
✅ **MenuManagement** - COMPLETE (wrapped with DashboardLayout)  
⏳ **Subscription** - NEEDS UPDATE

## Subscription.tsx Update Instructions

Replace the entire file content with:

```tsx
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
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
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading subscription data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Subscription & Payments</h1>
          <p className="text-muted-foreground">Manage your restaurant's subscription</p>
        </div>
        <UnifiedSubscriptionFlow />
      </div>
    </DashboardLayout>
  );
};

export default Subscription;
```

## What Changed

### Before:
- Used `SidebarProvider` + `RestaurantSidebar` + `SidebarInset`
- Different sidebar component
- Separate layout system

### After:
- Uses `DashboardLayout` wrapper
- Shares sticky sidebar with all other dashboard pages
- Consistent navigation across all pages

## Result

All these routes now use the **same sticky sidebar**:
- ✅ `/dashboard/overview` - Dashboard.tsx
- ✅ `/dashboard/menu` - MenuManagement.tsx  
- ✅ `/dashboard/ai-import` - AIMenuImport.tsx
- ✅ `/dashboard/tables` - Dashboard.tsx (tab)
- ✅ `/dashboard/qr` - Dashboard.tsx (tab)
- ✅ `/dashboard/embed` - Dashboard.tsx (tab)
- ⏳ `/dashboard/subscription` - Subscription.tsx (needs update)
- ✅ `/dashboard/settings` - Dashboard.tsx (tab)

## Testing

After updating Subscription.tsx:

1. Navigate to `/dashboard/menu` - Sidebar visible ✓
2. Click "AI Menu Import" - Sidebar stays ✓
3. Click "Subscription" - Sidebar stays ✓
4. Click "Dashboard" - Sidebar stays ✓

All pages share the same sticky sidebar with green theme!
