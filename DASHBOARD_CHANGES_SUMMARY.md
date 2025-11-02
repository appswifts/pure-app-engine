# Dashboard UI Changes - Implementation Summary

## ✅ Completed

### 1. Fonts & Icons Added
- Work Sans font family
- Material Symbols Outlined icons
- Updated tailwind.config.ts with custom colors

### 2. Required Code Changes for Dashboard.tsx

#### Import Changes
```typescript
// REMOVE these Lucide imports:
import { ChefHat, LogOut, Plus, QrCode, Settings, Menu as MenuIcon, Shield, BarChart3, Utensils, CreditCard, AlertTriangle, Clock, X, Wallet, Code, Sparkles, Grid3x3 } from "lucide-react";

// KEEP these for functionality:
import { LogOut, Menu as MenuIcon, X, AlertTriangle, Plus } from "lucide-react";
```

#### Sidebar Items Update
```typescript
const sidebarItems = [
  {
    id: "overview",
    label: "Dashboard",
    materialIcon: "dashboard", // Material Symbols name
    description: "Dashboard overview and quick stats"
  },
  {
    id: "menu",
    label: "Menu Management",
    materialIcon: "restaurant_menu",
    description: "Manage your menu items"
  },
  {
    id: "ai-import",
    label: "AI Menu Import",
    materialIcon: "smart_toy",
    description: "Import menu from images"
  },
  {
    id: "tables",
    label: "Tables",
    materialIcon: "table_restaurant",
    description: "Manage tables"
  },
  {
    id: "qr",
    label: "QR Code Generator",
    materialIcon: "qr_code_2",
    description: "Generate QR codes"
  },
  {
    id: "embed",
    label: "Embed Code",
    materialIcon: "code",
    description: "Website embed codes"
  },
  {
    id: "subscription",
    label: "Subscription",
    materialIcon: "credit_card",
    description: "Manage subscription"
  },
  {
    id: "settings",
    label: "Settings",
    materialIcon: "settings",
    description: "Settings and preferences"
  }
];
```

#### Main Container Update
```typescript
// OLD:
<div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5">

// NEW:
<div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
```

#### Sidebar Container Update
```typescript
// OLD:
<aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-card/80 backdrop-blur-sm border-r flex flex-col transition-transform duration-300 ease-in-out`}>

// NEW:
<aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed inset-y-0 left-0 z-50 w-64 bg-background-light dark:bg-background-dark p-4 flex flex-col justify-between border-r border-primary-green/20 dark:border-primary-green/30 transition-transform duration-300 ease-in-out`}>
```

#### Sidebar Header with Profile
```typescript
// Replace the existing sidebar header section with:
<div>
  <div className="flex items-center gap-3 mb-8">
    <div 
      className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
      style={{backgroundImage: `url(${user?.user_metadata?.avatar_url || restaurant?.logo_url || 'https://via.placeholder.com/48'})`}}
    />
    <div>
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        {user?.user_metadata?.full_name || restaurant?.name || 'Restaurant Owner'}
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">Owner</p>
    </div>
  </div>

  {/* Restaurant Switcher - keep existing */}
  {user && (
    <RestaurantSwitcher
      currentRestaurant={restaurant}
      onRestaurantChange={(newRestaurant) => {
        localStorage.setItem('selectedRestaurantId', newRestaurant.id);
        setRestaurant(newRestaurant);
        window.location.reload();
      }}
      userId={user.id}
    />
  )}

  <nav className="flex flex-col gap-2 mt-4">
    {sidebarItems.map((item) => {
      const isActive = activeTab === item.id;
      return (
        <a
          key={item.id}
          onClick={() => {
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
            setSidebarOpen(false);
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
```

#### Sidebar Footer Update
```typescript
// At the bottom of sidebar:
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
```

#### Main Content Header Update
```typescript
// In the overview tab:
{activeTab === "overview" && (
  <div className="space-y-6">
    <header className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        Welcome back, {restaurant?.name || 'Restaurant Owner'}
      </p>
    </header>

    {/* Quick Actions */}
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
      <div className="flex gap-4">
        <button 
          onClick={() => navigate("/dashboard/menu")}
          className="flex-1 text-center py-3 rounded-lg bg-primary-green text-black font-bold shadow-sm hover:bg-primary-green/80 transition-colors"
        >
          Manage Menu
        </button>
        <button 
          onClick={() => navigate("/dashboard/qr")}
          className="flex-1 text-center py-3 rounded-lg bg-primary-green/20 dark:bg-primary-green/30 text-gray-800 dark:text-white font-bold hover:bg-primary-green/30 dark:hover:bg-primary-green/40 transition-colors"
        >
          Generate QR Codes
        </button>
      </div>
    </section>

    {/* Stats Section */}
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Restaurant Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Total Menu Items</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {/* Add actual count */}
            0
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-2">Active Tables</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {/* Add actual count */}
            0
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 mb-2">QR Codes Generated</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {/* Add actual count */}
            0
          </p>
        </div>
      </div>
    </section>
  </div>
)}
```

## Implementation Steps

1. ✅ Update tailwind.config.ts
2. ✅ Add fonts to index.html
3. ⏳ Update Dashboard.tsx:
   - Change sidebar items array
   - Update main container className
   - Update sidebar styling
   - Add profile section
   - Replace icon components with Material Symbols
   - Update navigation button rendering
   - Update main content headers
   - Add Quick Actions section
   - Update stats cards
   - Update button styles

4. ⏳ Test all dashboard pages
5. ⏳ Verify dark mode
6. ⏳ Test mobile responsiveness

## Notes

- Keep all existing props and state management
- Keep all navigation logic
- Keep all data fetching
- Only change visual presentation
- Material Symbols use `<span className="material-symbols-outlined">icon_name</span>`
- Lucide icons only needed for mobile menu toggle and logout (keep those)
