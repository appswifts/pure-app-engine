# Edge Functions - Quick Reference

## 🚀 Creating a New Edge Function

### 1. Create the function
```bash
npx supabase functions new my-function-name
```

### 2. Add to config.toml (if public access needed)
```toml
[functions.my-function-name]
verify_jwt = false  # Only if function should work without auth
```

### 3. Deploy the function
```bash
npx supabase functions deploy my-function-name
```

### 4. Call from client (ALWAYS use this pattern)
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('my-function-name', {
  body: { key: 'value' },
});
```

---

## ⚠️ NEVER Do This (Causes 401 Errors)

```typescript
// ❌ WRONG - Don't use manual fetch()
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/my-function`,
  {
    headers: { 'Authorization': `Bearer ${ANON_KEY}` }
  }
);
```

---

## 📋 Current Functions

| Function | Public Access | Purpose |
|----------|--------------|---------|
| `generate-food-image` | ✅ Yes (`verify_jwt = false`) | AI image generation |
| `ai-menu-extract` | ✅ Yes (`verify_jwt = false`) | Extract menu from files |

---

## 🔧 Troubleshooting 401 Errors

1. ✅ Using `supabase.functions.invoke()`?
2. ✅ Config.toml has `verify_jwt = false` (if public)?
3. ✅ Deployed via CLI after config changes?
4. ✅ Browser cache cleared?

---

## 📚 Full Documentation

See [EDGE_FUNCTIONS_GUIDE.md](../../EDGE_FUNCTIONS_GUIDE.md) for complete guide.

---

## 🛠️ Utility Helper

Use the helper utility for even easier function calls:

```typescript
import { callEdgeFunction, generateFoodImage } from '@/lib/utils/edge-functions';

// Generic call
const result = await callEdgeFunction('my-function', { data: 'value' });

// Specialized helpers
const imageUrl = await generateFoodImage('Pizza', 'Delicious pepperoni');
```
