# QR Code Flow Testing Guide

## Overview
This document explains the QR code flow and how to test each scenario.

## QR Code Types & Flow

### 1. Single Group QR Code
**Admin Action:**
- Admin selects QR type: "Single Menu Group"
- Selects a specific menu group (e.g., "Drinks")
- Selects a table
- Generates QR code

**Generated URL:**
```
/public-menu/{restaurantSlug}/{tableSlug}?group={groupId}
```

**Customer Experience:**
1. Customer scans QR code
2. Direct to PublicMenu page
3. Shows only items from the selected group (e.g., Drinks)
4. No group selection needed - direct to menu items

**Expected Behavior:**
- ✅ Displays restaurant header with logo
- ✅ Shows only the single selected menu group's items
- ✅ Category filters work within that group
- ✅ Can add items to cart and order via WhatsApp

---

### 2. Multi-Group QR Code
**Admin Action:**
- Admin selects QR type: "Multiple Menu Groups"
- Selects multiple menu groups (e.g., "Breakfast", "Lunch", "Dinner")
- Selects a table
- Generates QR code

**Generated URL:**
```
/menu-select/{restaurantSlug}/{tableSlug}?groups={groupId1,groupId2,groupId3}
```

**Customer Experience:**
1. Customer scans QR code
2. Arrives at MenuGroupSelect page
3. Sees only the pre-selected menu groups as cards
4. Clicks on a group card
5. Navigates to PublicMenu showing that group's items

**Expected Behavior:**
- ✅ Displays restaurant header with logo
- ✅ Shows only the pre-selected groups (not all groups)
- ✅ Each group card shows name and description
- ✅ Clicking a group navigates to menu with query: `?group={groupId}`
- ✅ Menu shows only items from selected group

---

### 3. Full Menu QR Code
**Admin Action:**
- Admin selects QR type: "Full Restaurant Menu"
- Selects a table
- Generates QR code

**Generated URL:**
```
/public-menu/{restaurantSlug}/{tableSlug}?mode=full
```

**Customer Experience:**
1. Customer scans QR code
2. Arrives at PublicMenu page
3. Sees menu group tabs at the top (if multiple groups exist)
4. Can switch between groups using tabs
5. All groups are available

**Expected Behavior:**
- ✅ Displays restaurant header with logo
- ✅ Shows menu group tabs (if more than 1 group)
- ✅ Can switch between groups using tabs
- ✅ Category filters work within selected group
- ✅ Shows all available groups

---

## Technical Implementation

### Routes (App.tsx)
```tsx
// QR Code Generated Routes
<Route path="/public-menu/:restaurantSlug/:tableSlug" element={<PublicMenu />} />
<Route path="/menu-select/:restaurantSlug/:tableSlug" element={<MenuGroupSelect />} />
```

### Query Parameters

**PublicMenu.tsx handles:**
- `?group={groupId}` → Single group mode
- `?mode=full` → Full menu mode with group tabs

**MenuGroupSelect.tsx handles:**
- `?groups={groupId1,groupId2}` → Filters to show only these groups

---

## Testing Checklist

### Single Group QR
- [ ] Generate single group QR code from dashboard
- [ ] Scan/visit generated URL
- [ ] Verify only selected group's items appear
- [ ] Verify no group selection screen
- [ ] Test category filtering
- [ ] Test cart and WhatsApp order

### Multi-Group QR
- [ ] Generate multi-group QR code from dashboard
- [ ] Scan/visit generated URL
- [ ] Verify group selection screen appears
- [ ] Verify only selected groups shown (not all)
- [ ] Click on a group
- [ ] Verify navigates to menu with that group
- [ ] Test cart and WhatsApp order

### Full Menu QR
- [ ] Generate full menu QR code from dashboard
- [ ] Scan/visit generated URL
- [ ] Verify menu group tabs appear (if multiple groups)
- [ ] Click different group tabs
- [ ] Verify items update per selected group
- [ ] Test category filtering per group
- [ ] Test cart and WhatsApp order

---

## Fixed Issues

1. **Route Mismatch**: Added `/public-menu/` and `/menu-select/` routes to App.tsx
2. **Query Parameter Handling**: PublicMenu now checks for `?group=` and `?mode=` parameters
3. **Group ID vs Slug**: MenuGroupSelect now filters by group IDs (not slugs) to match QR generation
4. **Full Menu UI**: Added menu group tabs for full menu mode
5. **Navigation**: MenuGroupSelect now navigates to correct URL format with group query parameter

---

## Code Changes Summary

### Files Modified:
1. `App.tsx` - Added new routes for QR code URLs
2. `PublicMenu.tsx` - Added query parameter handling and full menu group tabs
3. `MenuGroupSelect.tsx` - Fixed to use group IDs and correct navigation

### Key Functions:
- `PublicMenu`: Detects display mode from query params (`?group=`, `?mode=full`)
- `MenuGroupSelect`: Filters groups by IDs from query param (`?groups=`)
- QR Generator: Already generates correct URLs (no changes needed)
