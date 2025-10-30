# Debugging EnhancedItemManager Component

## Quick Debug Setup

### 1. Add Debug Imports
```typescript
// Add to top of EnhancedItemManager.tsx
import { debugLog, debugError, debugSupabaseQuery } from '@/utils/debugHelpers';
```

### 2. Debug Component State
```typescript
// Add after your state declarations
useEffect(() => {
  debugLog('EnhancedItemManager', 'State Update', {
    restaurantId,
    loading,
    menuItemsCount: menuItems.length,
    categoriesCount: categories.length,
    selectedCategory,
    isDialogOpen
  });
}, [restaurantId, loading, menuItems, categories, selectedCategory, isDialogOpen]);
```

### 3. Debug Restaurant Hook
```typescript
// In useRestaurant hook or component
const { restaurantId, loading: restaurantLoading } = useRestaurant();

useEffect(() => {
  debugLog('useRestaurant', 'Hook Update', {
    restaurantId,
    loading: restaurantLoading,
    hasRestaurantId: !!restaurantId
  });
}, [restaurantId, restaurantLoading]);
```

## Common Issues & Solutions

### Issue 1: Menu Items Not Loading
```typescript
const fetchMenuItems = async () => {
  if (!restaurantId) {
    debugLog('EnhancedItemManager', 'Fetch Skipped', 'No restaurant ID');
    return;
  }

  setLoading(true);
  
  const result = await debugSupabaseQuery(
    'fetchMenuItems',
    supabase
      .from('menu_items')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('display_order')
  );

  if (result.error) {
    debugError('EnhancedItemManager', 'fetchMenuItems', result.error);
    toast({
      title: "Error",
      description: "Failed to load menu items",
      variant: "destructive",
    });
  } else {
    setMenuItems(result.data || []);
    debugLog('EnhancedItemManager', 'Menu Items Loaded', {
      count: result.data?.length || 0,
      items: result.data
    });
  }
  
  setLoading(false);
};
```

### Issue 2: Categories Not Loading
```typescript
const fetchCategories = async () => {
  if (!restaurantId) {
    debugLog('EnhancedItemManager', 'Categories Fetch Skipped', 'No restaurant ID');
    return;
  }

  const result = await debugSupabaseQuery(
    'fetchCategories',
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('display_order')
  );

  if (result.error) {
    debugError('EnhancedItemManager', 'fetchCategories', result.error);
  } else {
    setCategories(result.data || []);
    debugLog('EnhancedItemManager', 'Categories Loaded', {
      count: result.data?.length || 0,
      categories: result.data
    });
  }
};
```

### Issue 3: Item Creation Failing
```typescript
const handleCreateItem = async (formData: any) => {
  debugLog('EnhancedItemManager', 'Creating Item', {
    formData,
    restaurantId,
    selectedCategory
  });

  if (!restaurantId) {
    debugError('EnhancedItemManager', 'Create Item', 'No restaurant ID');
    return;
  }

  const itemData = {
    ...formData,
    restaurant_id: restaurantId, // Make sure this is set!
    category_id: selectedCategory,
    display_order: menuItems.length + 1
  };

  debugLog('EnhancedItemManager', 'Item Data to Insert', itemData);

  const result = await debugSupabaseQuery(
    'createMenuItem',
    supabase
      .from('menu_items')
      .insert(itemData)
      .select()
  );

  if (result.error) {
    debugError('EnhancedItemManager', 'createMenuItem', result.error);
    
    // Check specific error types
    if (result.error.code === '42501') {
      debugLog('EnhancedItemManager', 'RLS Policy Issue', 'Check if user owns restaurant');
    }
    
    toast({
      title: "Error",
      description: result.error.message,
      variant: "destructive",
    });
  } else {
    debugLog('EnhancedItemManager', 'Item Created Successfully', result.data);
    await fetchMenuItems(); // Refresh list
    setIsDialogOpen(false);
    toast({
      title: "Success",
      description: "Menu item created successfully",
    });
  }
};
```

## Browser Console Debugging Commands

Open your browser console and try these:

```javascript
// Check current auth state
supabase.auth.getSession().then(({data}) => console.log('Session:', data));

// Check restaurant data
// (Replace with your actual restaurant ID)
supabase.from('restaurants').select('*').eq('user_id', 'your-user-id').then(console.log);

// Test menu items query
supabase.from('menu_items').select('*').eq('restaurant_id', 'your-restaurant-id').then(console.log);

// Check RLS policies (run in Supabase SQL editor)
SELECT * FROM menu_items WHERE restaurant_id = 'your-restaurant-id';
```

## Network Tab Debugging

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Look for requests to `supabase.co`
4. Check:
   - Request headers (Authorization token)
   - Request payload
   - Response status and data

## Common Error Codes

- **401**: Authentication required - check if user is logged in
- **403**: Forbidden - RLS policy blocking access
- **409**: Conflict - duplicate key or constraint violation
- **500**: Server error - check Supabase logs

## Performance Debugging

```typescript
// Add performance monitoring
const [renderCount, setRenderCount] = useState(0);

useEffect(() => {
  setRenderCount(prev => prev + 1);
  debugLog('EnhancedItemManager', 'Render', { count: renderCount + 1 });
});

// Monitor expensive operations
const expensiveOperation = useMemo(() => {
  debugLog('EnhancedItemManager', 'Expensive Operation Running', menuItems.length);
  return menuItems.filter(item => item.is_available);
}, [menuItems]);
```

## Memory Debugging

```typescript
// Check for memory leaks
useEffect(() => {
  const subscription = supabase
    .channel('menu_items_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, 
      (payload) => {
        debugLog('EnhancedItemManager', 'Real-time Update', payload);
      }
    )
    .subscribe();

  return () => {
    debugLog('EnhancedItemManager', 'Cleaning Up Subscription', subscription);
    subscription.unsubscribe();
  };
}, []);
```
