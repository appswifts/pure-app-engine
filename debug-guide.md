# MenuForest Debugging Guide

## Browser Developer Tools

### Console Debugging
1. **Open DevTools**: F12 or Ctrl+Shift+I
2. **Console Tab**: View errors, warnings, and custom logs
3. **Network Tab**: Monitor API calls to Supabase
4. **Application Tab**: Check localStorage, sessionStorage, cookies

### Common Console Commands
```javascript
// Check current user session
console.log(await supabase.auth.getSession());

// Check restaurant data
console.log(restaurant);

// Monitor state changes
console.log('Component rendered with:', { menuItems, categories, loading });
```

## 2. React Component Debugging

### Add Debug Logs to Components
```typescript
// In EnhancedItemManager.tsx or any component
useEffect(() => {
  console.log('🔍 Component mounted/updated:', {
    restaurantId,
    loading,
    menuItems: menuItems.length,
    categories: categories.length
  });
}, [restaurantId, loading, menuItems, categories]);

// Debug API calls
const handleCreateItem = async (itemData) => {
  console.log('📝 Creating item:', itemData);
  try {
    const result = await supabase.from('menu_items').insert(itemData);
    console.log('✅ Item created:', result);
  } catch (error) {
    console.error('❌ Error creating item:', error);
  }
};
```

### React DevTools Extension
- Install React Developer Tools browser extension
- Inspect component props, state, and hooks
- Profile component performance

## 3. Supabase Debugging

### Database Queries
```typescript
// Add detailed logging to queries
const fetchMenuItems = async () => {
  console.log('🔍 Fetching menu items for restaurant:', restaurantId);
  
  const { data, error, count } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId);
    
  console.log('📊 Query result:', { data, error, count });
  
  if (error) {
    console.error('❌ Database error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
  }
  
  return { data, error };
};
```

### RLS (Row Level Security) Debugging
```sql
-- Check RLS policies in Supabase dashboard
SELECT * FROM pg_policies WHERE tablename = 'menu_items';

-- Test policy with specific user
SELECT * FROM menu_items WHERE restaurant_id = 'your-restaurant-id';
```

### Real-time Debugging
```typescript
// Debug real-time subscriptions
const subscription = supabase
  .channel('menu_items_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'menu_items' },
    (payload) => {
      console.log('🔄 Real-time update:', payload);
    }
  )
  .subscribe((status) => {
    console.log('📡 Subscription status:', status);
  });
```

## 4. Authentication Debugging

```typescript
// Check auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth state changed:', { event, session });
  
  if (event === 'SIGNED_IN') {
    console.log('✅ User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  }
});

// Debug current session
const debugAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('Current session:', { session, error });
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
};
```

## 5. Network Debugging

### Monitor API Calls
1. Open Network tab in DevTools
2. Filter by "Fetch/XHR"
3. Look for Supabase API calls
4. Check request/response headers and data

### Common Issues to Check
- **401 Unauthorized**: Authentication problems
- **403 Forbidden**: RLS policy issues
- **500 Internal Server Error**: Database/server issues
- **Network errors**: Connection problems

## 6. TypeScript Debugging

### Type Checking
```bash
# Run TypeScript compiler to check for type errors
npx tsc --noEmit

# Or with specific file
npx tsc --noEmit src/components/dashboard/EnhancedItemManager.tsx
```

### Debug Types
```typescript
// Use type assertions for debugging
const debugData = data as any;
console.log('Debug data type:', typeof debugData, debugData);

// Check if object has expected properties
console.log('Has property:', 'restaurant_id' in menuItem);
```

## 7. Common Debugging Scenarios

### Menu Items Not Loading
```typescript
// Check these in order:
1. console.log('Restaurant ID:', restaurantId);
2. console.log('User session:', await supabase.auth.getSession());
3. console.log('RLS policies working?');
4. console.log('Database connection?');
```

### Image Upload Issues
```typescript
// Debug file upload
const uploadImage = async (file: File) => {
  console.log('📁 Uploading file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });
  
  const { data, error } = await supabase.storage
    .from('menu-images')
    .upload(`${restaurantId}/${file.name}`, file);
    
  console.log('Upload result:', { data, error });
};
```

### State Management Issues
```typescript
// Debug React state updates
const [menuItems, setMenuItems] = useState([]);

// Add logging to state updates
const updateMenuItems = (newItems) => {
  console.log('🔄 Updating menu items:', {
    from: menuItems.length,
    to: newItems.length,
    items: newItems
  });
  setMenuItems(newItems);
};
```

## 8. Performance Debugging

### React Profiler
```typescript
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('⚡ Component render:', { id, phase, actualDuration });
}

<Profiler id="EnhancedItemManager" onRender={onRenderCallback}>
  <EnhancedItemManager />
</Profiler>
```

### Database Query Performance
```typescript
// Time database queries
const startTime = performance.now();
const { data, error } = await supabase.from('menu_items').select('*');
const endTime = performance.now();
console.log(`Query took ${endTime - startTime} milliseconds`);
```

## 9. Error Boundaries

```typescript
// Add error boundary for better error handling
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  console.error('🚨 Component error:', error);
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <EnhancedItemManager />
</ErrorBoundary>
```

## 10. Debugging Tools & Extensions

### Browser Extensions
- React Developer Tools
- Redux DevTools (if using Redux)
- Supabase DevTools

### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Bracket Pair Colorizer
- Error Lens

### Command Line Tools
```bash
# Check for linting errors
npm run lint

# Type checking
npm run type-check

# Build to catch compilation errors
npm run build
```
