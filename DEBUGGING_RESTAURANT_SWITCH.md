# Debugging Restaurant Switching Issue

## Changes Made

### 1. **Added Debugging Logs**
Multiple console.log statements to track the data flow:

```typescript
// When restaurant changes
console.log("Changing restaurant to:", restaurant.name, restaurantId);

// When useEffect triggers
console.log("selectedRestaurantId changed to:", selectedRestaurantId);

// When loading data
console.log("Loading data for restaurant:", targetRestaurantId);
console.log("Loaded tables:", tablesResult.data?.length || 0);
console.log("Loaded QR codes:", qrCodesResult.data?.length || 0);
```

### 2. **Immediate Data Clearing**
When switching restaurants, we now immediately clear stale data:

```typescript
const handleRestaurantChange = (restaurantId: string) => {
  const restaurant = restaurants.find(r => r.id === restaurantId);
  if (restaurant) {
    setSelectedRestaurantId(restaurantId);
    setCurrentRestaurant(restaurant);
    setSelectedTableId("");
    // Clear current data immediately to prevent stale data display
    setTables([]);
    setSavedQRCodes([]);
  }
};
```

### 3. **Data Flow**
```
User selects restaurant
    ↓
handleRestaurantChange() called
    ↓
Clear tables[] and savedQRCodes[]
    ↓
setSelectedRestaurantId(newId)
    ↓
useEffect triggers (dependency: selectedRestaurantId)
    ↓
loadData(selectedRestaurantId) called
    ↓
setLoading(true)
    ↓
Fetch data from Supabase
    ↓
setTables(newData)
setSavedQRCodes(newData)
    ↓
setLoading(false)
```

## How to Debug

1. Open browser DevTools Console
2. Navigate to `/dashboard/qr`
3. Change the restaurant in the dropdown
4. Check console logs:
   - "Changing restaurant to: [name] [id]"
   - "selectedRestaurantId changed to: [id]"
   - "Loading data for restaurant: [id]"
   - "Loaded tables: X"
   - "Loaded QR codes: Y"

## Expected Behavior

When you change restaurants:
1. Tables list should clear immediately
2. Loading spinner should appear
3. New tables should load for selected restaurant
4. QR codes should update for selected restaurant

## Common Issues & Solutions

### Issue: Tables not updating
**Check:**
- Console logs showing correct restaurant ID?
- Tables count in logs matches what you see?
- Are all tables actually from the same restaurant in database?

**Solution:**
- Verify `restaurant_id` column in `tables` table
- Check if tables are properly associated with restaurants

### Issue: Dropdown not showing restaurants
**Check:**
- Multiple restaurants in database for current user?
- Console showing restaurant load?

**Solution:**
- Verify user has multiple restaurants
- Check `restaurants` table for user_id association

### Issue: Stale data showing
**Check:**
- Are tables clearing before new data loads?
- Is loading state working?

**Solution:**
- Check React Developer Tools for state updates
- Verify `setTables([])` and `setSavedQRCodes([])` are called

## Database Query

The loadData function queries:
```sql
-- Tables for specific restaurant
SELECT * FROM tables
WHERE restaurant_id = '{targetRestaurantId}'
ORDER BY name;

-- QR codes for specific restaurant  
SELECT * FROM saved_qr_codes
WHERE restaurant_id = '{targetRestaurantId}'
ORDER BY created_at DESC;
```

## Testing Steps

1. **Create Test Data:**
   - Create 2+ restaurants
   - Add 2-3 tables to Restaurant A
   - Add 2-3 different tables to Restaurant B

2. **Test Switching:**
   - Select Restaurant A → Should show Restaurant A tables
   - Select Restaurant B → Should show Restaurant B tables
   - Switch back to A → Should show Restaurant A tables again

3. **Verify:**
   - Table count matches
   - Table names are correct
   - QR codes match restaurant

## Success Criteria

✅ Console logs show correct flow
✅ Tables list updates when restaurant changes
✅ QR codes list updates when restaurant changes  
✅ No stale data displayed
✅ Loading state shows during fetch
✅ Restaurant name in title updates

---

**Last Updated:** Nov 5, 2025
