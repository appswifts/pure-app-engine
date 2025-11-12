# 🔧 COMPREHENSIVE FIX NEEDED - SUBSCRIPTION QUERIES

All these files are still querying deleted subscription tables/columns and need to be fixed:

## 📋 FILES WITH SUBSCRIPTION QUERIES (26 files)

### **Services (2 files)**
1. `src/services/simplePaymentAccessControl.ts`
   - Line 132: `restaurant.subscription_status`
   - Line 169: `restaurant.subscription_status`
   - **FIX:** Remove subscription status checks or default to `true`

2. `src/services/accessControlService.ts`
   - Line 272: `.select('id, subscription_status')`
   - **FIX:** Remove `subscription_status` from select

### **Pages (5 files)**
3. `src/pages/UserSettings.tsx`
   - Line 106: `.select("subscription_status, subscription_end_date, trial_end_date")`
   - Line 303: `subscription.subscription_status`
   - **FIX:** Remove subscription query and status checks

4. `src/pages/TableManagement.tsx`
   - Line 68: `subscription_status: 'inactive'`
   - **FIX:** Remove this field from insert

5. `src/pages/RestaurantSignup.tsx`
   - Line 150: `subscription_status: "inactive"`
   - **FIX:** Remove this field from insert

6. `src/pages/RestaurantSettings.tsx`
   - Lines 42, 130-131, 281: Multiple `subscription_status` references
   - **FIX:** Remove all subscription-related code

7. `src/pages/Billing.tsx`
   - Multiple subscription queries
   - **FIX:** Delete entire file (billing not used)

### **Libraries (2 files)**
8. `src/lib/global.ts`
   - Line 116: `.from("payment_gateways")`
   - **FIX:** Remove payment gateway query or return empty array

9. `src/lib/optimized-queries.ts`
   - Lines 83-86, 91, 173, 244-250: Multiple subscription references
   - **FIX:** Remove all subscription logic

### **Hooks (2 files)**
10. `src/hooks/useAdminQueries.tsx`
    - Line 13: `subscription_status` in select
    - **FIX:** Remove subscription fields from query

11. `src/hooks/useOptimizedAuth.tsx`
    - Lines 40, 65: `subscription_status` in selects
    - **FIX:** Remove subscription fields

### **Components (15 files)**
12. `src/components/AdminRestaurantManager.tsx`
    - Lines 60, 111, 140: `subscription_status` references
    - **FIX:** Remove subscription column from queries and display

13-26. **Other admin/subscription components**
    - Multiple files querying subscription tables
    - **FIX:** Delete or clean up

### **TypeScript Types**
27. `src/integrations/supabase/types.ts`
    - Lines 345, 539, 590, 641: `payment_gateways` and `subscription_status` types
    - **FIX:** Remove these type definitions

---

## 🎯 QUICKEST FIX STRATEGY

Since there are 26+ files with subscription code, the fastest approach is:

### **Option 1: Nuclear Approach** (Recommended)
Delete all files that are only/mostly about subscriptions:
- Billing pages
- Payment components  
- Admin payment/subscription components
- Subscription hooks
- Payment services

### **Option 2: Surgical Approach**
Edit each file to:
- Remove subscription column references
- Remove subscription table queries
- Default access checks to `true`
- Comment out subscription UI

---

## ⚠️ IMMEDIATE ERRORS TO FIX

1. **404 Route Error:** `/dashboard/embed` not found
   - Need to add this route back or remove link

2. **400 Errors:** Querying deleted tables
   - `customer_subscriptions` table
   - `subscriptions` table
   - `payment_gateways` table

3. **400 Errors:** Querying deleted columns
   - `restaurants.subscription_status`
   - `restaurants.subscription_end_date`
   - `restaurants.trial_end_date`

---

## 🚀 RECOMMENDED ACTION

**DELETE ALL SUBSCRIPTION-RELATED FILES NOW**

This is faster than editing 26+ files manually.
