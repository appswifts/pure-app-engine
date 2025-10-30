# Testing Guide - MenuForest QR Menu System

## Complete User Flow Testing Checklist

This guide will help you test the entire user journey from signup to menu management after all fixes have been applied.

---

## Pre-Testing Setup

### 1. Database Cleanup (REQUIRED)
Before testing, you **must** clean up duplicate restaurants:

```sql
-- Step 1: Run in Supabase SQL Editor
-- Copy from: scripts/cleanup-duplicate-restaurants.sql

-- First, identify duplicates (Step 1)
SELECT 
    user_id,
    COUNT(*) as restaurant_count,
    ARRAY_AGG(id ORDER BY created_at) as restaurant_ids
FROM restaurants
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Then uncomment and run the DELETE statement from the script
```

### 2. Apply Database Migration
```sql
-- Step 2: Run in Supabase SQL Editor
-- Copy from: supabase/migrations/20250123_add_unique_constraint_restaurants_user_id.sql

-- This adds the unique constraint to prevent future duplicates
```

---

## Test Flow 1: New User Signup

### Prerequisites
- Clear browser cache and cookies
- Use an email that hasn't been registered before
- Have a valid phone number ready

### Steps

#### 1.1 Registration
- [ ] Navigate to `/auth`
- [ ] Fill in registration form:
  - Name
  - Email
  - Phone number
  - Password
- [ ] Submit form
- [ ] **Expected:** User is created successfully
- [ ] **Expected:** Redirected to dashboard
- [ ] **Expected:** Single restaurant is created automatically

#### 1.2 Restaurant Creation Verification
- [ ] Check browser console
- [ ] **Expected:** No 409 errors
- [ ] **Expected:** No duplicate restaurant warnings
- [ ] **Expected:** Restaurant is loaded successfully

#### 1.3 Dashboard Load
- [ ] **Expected:** Skeleton loader appears briefly
- [ ] **Expected:** Dashboard loads with "Welcome" message
- [ ] **Expected:** Sidebar shows restaurant name
- [ ] **Expected:** All menu items are empty (new account)

---

## Test Flow 2: Menu Management

### 2.1 Create Categories
- [ ] Navigate to Menu Management
- [ ] Click "Add Category"
- [ ] Create category: "Appetizers"
- [ ] **Expected:** Category appears in list
- [ ] Create category: "Main Courses"
- [ ] **Expected:** Both categories visible
- [ ] Try creating duplicate category name
- [ ] **Expected:** Error or warning shown

### 2.2 Add Menu Items
- [ ] Click "Add Menu Item"
- [ ] Fill in:
  - Name: "French Fries"
  - Category: "Appetizers"
  - Price: 2500
  - Description: "Crispy golden fries"
  - Mark as available
- [ ] Submit
- [ ] **Expected:** Item appears in menu list
- [ ] **Expected:** Price formatted correctly: "2,500 RWF"

### 2.3 Add Item with Image
- [ ] Click "Add Menu Item"
- [ ] Fill in details
- [ ] Upload image (PNG/JPG)
- [ ] **Expected:** Image preview shown
- [ ] Submit
- [ ] **Expected:** Item displays with image
- [ ] **Expected:** Image loads correctly

### 2.4 Edit Menu Item
- [ ] Click edit on an existing item
- [ ] Change price to 3000
- [ ] **Expected:** Form pre-filled with current data
- [ ] Submit changes
- [ ] **Expected:** Item updated successfully
- [ ] **Expected:** New price shown: "3,000 RWF"

### 2.5 Delete Menu Item
- [ ] Click delete on an item
- [ ] Confirm deletion
- [ ] **Expected:** Item removed from list
- [ ] **Expected:** No errors in console

---

## Test Flow 3: QR Code Generation

### 3.1 Create Table QR Code
- [ ] Navigate to QR Scan section
- [ ] Click "Add Table"
- [ ] Enter table name: "Table 1"
- [ ] **Expected:** QR code generated
- [ ] **Expected:** QR code image displayed
- [ ] **Expected:** URL shown: `/menu/{restaurant-slug}/table-1`

### 3.2 Download QR Code
- [ ] Click "Download QR Code"
- [ ] **Expected:** PNG file downloaded
- [ ] **Expected:** File opens correctly
- [ ] **Expected:** QR code is scannable

### 3.3 Test QR Code
- [ ] Use phone to scan QR code
- [ ] **Expected:** Opens menu in browser
- [ ] **Expected:** All menu items visible
- [ ] **Expected:** Prices formatted correctly
- [ ] **Expected:** WhatsApp button visible
- [ ] Click WhatsApp button
- [ ] **Expected:** Opens WhatsApp with pre-filled message

---

## Test Flow 4: Error Handling

### 4.1 Network Error Simulation
- [ ] Open browser DevTools
- [ ] Set network to "Offline"
- [ ] Try to load dashboard
- [ ] **Expected:** Error boundary shows network error
- [ ] **Expected:** "Reload Page" button visible
- [ ] Set network back to "Online"
- [ ] Click "Reload Page"
- [ ] **Expected:** Dashboard loads successfully

### 4.2 Duplicate Restaurant Handling
- [ ] In Supabase, manually create duplicate restaurant for test user
- [ ] Reload dashboard
- [ ] **Expected:** Warning in console about duplicates
- [ ] **Expected:** App uses oldest restaurant
- [ ] **Expected:** Dashboard loads successfully
- [ ] **Expected:** No crashes or errors

### 4.3 Loading States
- [ ] Throttle network to "Slow 3G" in DevTools
- [ ] Navigate to Menu Management
- [ ] **Expected:** Skeleton loader shows
- [ ] **Expected:** Smooth transition to content
- [ ] **Expected:** No layout shift

---

## Test Flow 5: Multi-Restaurant Support

### 5.1 Single Restaurant Per User
- [ ] Check restaurants table in Supabase
- [ ] **Expected:** Each user has exactly ONE restaurant
- [ ] Try to create second restaurant via API
- [ ] **Expected:** Unique constraint violation
- [ ] **Expected:** Error handled gracefully

### 5.2 Restaurant Switching (Future)
- [ ] Note: This is disabled for now
- [ ] Only one restaurant per user is allowed
- [ ] Restaurant switcher should not show if only 1 restaurant

---

## Test Flow 6: Performance & UX

### 6.1 Loading Performance
- [ ] Clear cache
- [ ] Load dashboard fresh
- [ ] **Expected:** Dashboard loads in < 3 seconds
- [ ] **Expected:** Skeleton shows immediately
- [ ] **Expected:** No blank screens

### 6.2 Navigation
- [ ] Navigate between all sections:
  - Overview
  - Menu Management
  - QR Codes
  - Subscriptions
  - Settings
- [ ] **Expected:** Each loads without errors
- [ ] **Expected:** Active tab highlighted correctly
- [ ] **Expected:** No 404 errors

### 6.3 Mobile Responsiveness
- [ ] Open on mobile device or DevTools mobile view
- [ ] Test all pages
- [ ] **Expected:** Sidebar collapses to hamburger menu
- [ ] **Expected:** All buttons accessible
- [ ] **Expected:** Forms usable on mobile

---

## Test Flow 7: Data Persistence

### 7.1 Refresh Test
- [ ] Add 3 menu items
- [ ] Add 2 categories
- [ ] Refresh the page
- [ ] **Expected:** All data still visible
- [ ] **Expected:** No duplicates created
- [ ] **Expected:** Order preserved

### 7.2 Logout & Login
- [ ] Create some menu items
- [ ] Log out
- [ ] Log back in
- [ ] **Expected:** All data still present
- [ ] **Expected:** Restaurant loaded correctly
- [ ] **Expected:** No permission errors

---

## Common Issues & Solutions

### Issue: 409 Conflict Errors
**Solution:** Run cleanup script, then apply migration

### Issue: Menu Items Not Loading
**Check:**
- Console for errors
- Restaurant ID is set
- No network issues

### Issue: Duplicate Restaurants
**Solution:**
1. Run cleanup script
2. Verify unique constraint is applied
3. Check application code for race conditions

### Issue: Loading Forever
**Check:**
- Network tab for failed requests
- Console for JavaScript errors
- Supabase connection status

---

## Post-Testing Verification

After completing all tests, verify:

- [ ] No console errors during normal operation
- [ ] All features working as expected
- [ ] Database has no duplicate restaurants
- [ ] Unique constraint is active
- [ ] Error boundaries catch and display errors properly
- [ ] Loading states show appropriately

---

## Reporting Issues

If you find bugs during testing:

1. **Note the exact steps** to reproduce
2. **Check browser console** for errors
3. **Take screenshots** of any errors
4. **Document** which test flow failed
5. **Include** any error messages from console

---

## Success Criteria

All tests must pass with:
- ✅ No 409 conflict errors
- ✅ No duplicate restaurants created
- ✅ All features functional
- ✅ Error boundaries working
- ✅ Loading states smooth
- ✅ Data persists correctly
- ✅ Mobile responsive

---

## Next Steps After Testing

Once all tests pass:
1. Document any remaining issues
2. Plan fixes for failed tests
3. Re-run failed tests after fixes
4. Deploy to production when all tests pass
