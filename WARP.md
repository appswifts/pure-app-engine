# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**MenuForest** is a production-ready restaurant ordering system where restaurants can:
1. Sign up and subscribe to service packages (Basic, Premium, Enterprise)
2. Create menu items with categories, variations, and accompaniments
3. Generate table QR codes
4. Customers scan QR codes → view menu → order via WhatsApp

Built with: Vite, React 18, TypeScript, Supabase (backend + auth), shadcn/ui, Tailwind CSS

## Common Development Commands

### Development
```powershell
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build with sourcemaps
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Database Type Generation (PowerShell)
```powershell
npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

## Project Structure

### Core Architecture

**Authentication System:**
- Two separate auth flows: Restaurant (Supabase Auth) and Admin (custom localStorage)
- `useAuth` hook provides restaurant authentication state
- Admin uses separate session management with localStorage
- Protected routes in `ProtectedRoute.tsx` for restaurants
- Admin pages protected by checking localStorage admin session

**Key Directories:**
- `src/pages/` - Main page components with route-level logic
  - `admin/` - Admin-specific pages (restaurants, packages, payments, subscriptions)
  - `dashboard/` - Restaurant dashboard pages
- `src/components/` - Reusable UI components
  - `admin/` - Admin-only components (AdminOverview, AdminPaymentGateways, etc.)
  - `dashboard/` - Restaurant dashboard components (EnhancedItemManager, MenuManager, QRGenerator)
  - `ui/` - shadcn/ui components
  - `security/` - SecurityProvider for security monitoring
- `src/hooks/` - React hooks (useAuth, useRestaurant, useAdminQueries, useOptimizedAuth)
- `src/services/` - Business logic services
  - `subscriptionService.ts` - Subscription operations
  - `manualPaymentService.ts` - Payment processing
  - `errorService.ts` - Error logging and monitoring
- `src/integrations/supabase/` - Supabase client and generated types

### Database Schema (Supabase)

**Core Tables:**
- `restaurants` - Restaurant profiles (linked to auth.users via foreign key)
- `categories` - Menu categories (belongs to restaurant)
- `menu_items` - Menu items (belongs to category)
- `item_variations` - Size/style variations with price modifiers
- `accompaniments` - Sides, sauces, extras
- `tables` - Restaurant tables with QR code data
- `subscription_packages` - Available service packages
- `subscription_orders` - Restaurant subscription purchases
- `manual_payments` - Payment proof submissions
- `manual_payment_config` - System payment configuration (bank, mobile money)
- `admin_notifications` - System notifications

**Key Relationships:**
- `restaurants.id` ← `categories.restaurant_id`
- `categories.id` ← `menu_items.category_id`
- `menu_items.id` ← `item_variations.menu_item_id`
- `menu_items.id` ← `accompaniments.menu_item_id`

**Critical Constraint:**
- Auth users MUST have corresponding restaurant records (enforced by database trigger)
- Use `ensureRestaurantExists()` function as fallback in pages if needed

### Routing Structure

**Public Routes:**
- `/` - Landing page
- `/pricing` - Package pricing page
- `/menu/:restaurantSlug/:tableSlug` - Customer menu view
- `/user/:restaurantSlug/:tableSlug` - Alternative customer menu route
- `/embed/:restaurantSlug` - Embeddable menu widget

**Restaurant Routes (Protected):**
- `/auth` - Restaurant login
- `/restaurant-signup` - Restaurant registration
- `/dashboard` - Main dashboard with tabs (overview, menu, qr, embed)
- `/dashboard/subscription` - Subscription management
- `/dashboard/settings` - Restaurant settings (customization, branding)
- `/dashboard/payment` - Payment submission

**Admin Routes (Protected):**
- `/admin/login` - Admin login
- `/admin` - Admin dashboard with tabs:
  - overview - System statistics
  - restaurants - Restaurant management
  - packages - Package CRUD
  - payment-gateways - Payment configuration
  - subscriptions - Subscription orders management
  - whatsapp - WhatsApp settings

## Key Features & Implementation Details

### Menu Management System

**Menu Items:**
- Support for image URLs (stored in `menu-images` Supabase bucket)
- Pricing in Rwandan Francs (RWF)
- Items belong to categories
- Can have multiple variations (sizes, styles) with price modifiers

**Variations & Accompaniments:**
- `EnhancedItemManager.tsx` - Comprehensive CRUD for items
- `VariationAccompanimentManager.tsx` - Manage variations and accompaniments
- `CategoryManager.tsx` - Category management
- Tabbed interface in MenuManagement page

### QR Code & Public Menu

**QR Code Generation:**
- Format: `/menu/:restaurantSlug/:tableSlug`
- Generated in `QRGenerator.tsx` component
- QR codes stored as data URLs in database
- Tracks table scan analytics

**Public Menu Features:**
- Linktree-style compact layout optimized for mobile
- Shopping cart system with WhatsApp button
- Plus/minus quantity controls for each item
- Variation selection support
- Real-time total calculation
- WhatsApp order integration with formatted message

### Customization System

**Restaurant Branding (RestaurantSettings.tsx):**
- Background types: solid color, gradient, or image URL
- Primary and secondary brand colors
- Custom backgrounds for public menu
- Mobile preview of menu appearance

### Subscription & Payment Flow

**Subscription Workflow:**
1. Restaurant selects package on pricing page
2. Submits payment proof (bank transfer or mobile money)
3. Creates `subscription_orders` record (status: Pending)
4. Admin verifies payment in admin dashboard
5. Admin confirms → activates subscription → creates `subscriptions` record
6. Restaurant account activated with package features

**Payment Configuration:**
- Managed in admin panel (`AdminPaymentGateways.tsx`)
- Supports bank transfer and mobile money (MTN, Airtel)
- Configuration stored in `manual_payment_config` table
- Payment details displayed to restaurants during checkout

### Admin Features

**Admin Dashboard Tabs:**
- **Overview**: System stats, recent activities
- **Restaurants**: CRUD operations, activation/suspension
- **Packages**: Manage subscription packages
- **Payment Gateways**: Configure payment methods
- **Subscriptions**: Approve/reject subscription orders, activate subscriptions
- **WhatsApp**: WhatsApp notification settings

**Admin Operations:**
- Restaurant activation/deactivation
- Payment verification
- Subscription order management
- Package creation and editing

## Development Best Practices

### Authentication Patterns

**Restaurant Authentication:**
```typescript
import { useAuth } from "@/hooks/useAuth";

const { session, loading, restaurant, signOut } = useAuth();

if (loading) return <div>Loading...</div>;
if (!session) return <Navigate to="/auth" />;
```

**Admin Authentication:**
```typescript
const adminSession = localStorage.getItem('adminSession');
if (!adminSession) {
  navigate('/admin/login');
  return null;
}
```

### Database Operations

**Always use Supabase client:**
```typescript
import { supabase } from "@/integrations/supabase/client";

// Query with RLS
const { data, error } = await supabase
  .from('menu_items')
  .select('*, categories(*)')
  .eq('restaurant_id', restaurantId);
```

**Handle foreign key constraints:**
- Ensure restaurant record exists before creating related records
- Use `ensureRestaurantExists()` helper when needed
- Check for constraint violations in error handling

### Error Handling

**Use errorService for logging:**
```typescript
import { errorService } from "@/services/errorService";

try {
  // Operation
} catch (error) {
  errorService.logError(error, { context: 'menu-creation' });
  toast.error('Failed to create menu item');
}
```

### TypeScript Best Practices

**Use generated Supabase types:**
```typescript
import { Database } from "@/integrations/supabase/types";

type MenuItem = Database['public']['Tables']['menu_items']['Row'];
type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];
```

**TypeScript Configuration Notes:**
- `noImplicitAny: false` - Allows implicit any for rapid development
- `strictNullChecks: false` - Relaxed null checking
- `skipLibCheck: true` - Faster compilation
- Regenerate types when database schema changes

## Environment Variables

Required variables (see `.env.example`):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BANK_NAME=Bank of Kigali
VITE_BANK_ACCOUNT=1234567890
VITE_BANK_ACCOUNT_NAME=MenuForest Ltd
VITE_MTN_NUMBER=+250788123456
VITE_AIRTEL_NUMBER=+250732123456
VITE_APP_URL=/
```

## Testing Workflow

1. Create test restaurant account via signup flow
2. Submit payment proof to activate subscription
3. Use admin panel to verify and activate subscription
4. Create menu categories and items
5. Generate QR codes for tables
6. Scan QR code to view public menu
7. Test WhatsApp ordering integration

**Critical Foreign Key Fix:**
- Database trigger automatically creates restaurant records for new auth users
- Prevents foreign key constraint violations
- Fallback: `ensureRestaurantExists()` function in components

## Build & Deployment

**Production Build:**
```powershell
npm run build
```

**Build Configuration (vite.config.ts):**
- Dev server on port 8080
- React SWC for fast refresh
- Path alias: `@` → `./src`
- Optimized chunks for production
- lovable-tagger plugin for development

**Build Output:**
- All assets in `dist/assets/` directory
- ES module format
- Hashed filenames for cache busting

## Known Issues & Solutions

**Issue**: Menu categories not appearing  
**Solution**: Ensure restaurant record exists in database, verify foreign key relationship

**Issue**: QR codes not generating correct URLs  
**Solution**: Check table slugs are unique and properly formatted, verify routing in App.tsx

**Issue**: Payment verification not updating UI  
**Solution**: Use force refresh mechanism, check filter state after verification operations

**Issue**: TypeScript errors after schema changes  
**Solution**: Regenerate Supabase types using `npx supabase gen types` command

## Special Notes

- **Currency**: All prices use Rwandan Francs (RWF)
- **Mobile-First**: Public menu optimized for mobile devices
- **WhatsApp Integration**: Orders sent as formatted messages via WhatsApp API
- **Image Storage**: Menu images stored in Supabase `menu-images` bucket
- **QR Scan Analytics**: Track scans in database for analytics
- **Logout Functionality**: Available in sidebar footers for both restaurant and admin
- **Security**: Comprehensive RLS policies on all tables
- **Performance**: Optimized queries with proper indexes and caching
