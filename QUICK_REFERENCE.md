# ⚡ Edge Functions - Quick Reference Card

**Keep this handy when working with Edge Functions!**

---

## ✅ The Golden Rule

```typescript
// ✅ ALWAYS do this:
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('function-name', {
  body: { your: 'data' }
});
```

```typescript
// ❌ NEVER do this:
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/function-name`,
  { headers: { 'Authorization': `Bearer ${ANON_KEY}` } }
);
```

---

## 🚀 Creating New Edge Function

```bash
# 1. Create function
npx supabase functions new my-function

# 2. Edit config (if public access needed)
# File: supabase/config.toml
[functions.my-function]
verify_jwt = false

# 3. Deploy
npx supabase functions deploy my-function
```

---

## 🔧 Using Helper Utilities

```typescript
import { callEdgeFunction, generateFoodImage } from '@/lib/utils/edge-functions';

// Generic call with auto-retry
const result = await callEdgeFunction('my-function', { data: 'value' });
if (result.success) {
  console.log(result.data);
}

// Specialized helper
const imageUrl = await generateFoodImage('Pizza', 'Delicious food');
```

---

## 🐛 Troubleshooting 401 Errors

```bash
# 1. Check config.toml
cat supabase/config.toml

# 2. Redeploy function
npx supabase functions deploy function-name

# 3. Check logs
npx supabase functions logs function-name

# 4. Hard refresh browser
# Press: Ctrl + Shift + R
```

---

## 📋 Function Types

| Type | Auth Required | Config |
|------|--------------|--------|
| Public API | ❌ No | `verify_jwt = false` |
| User Action | ✅ Yes | Default (none) |
| Admin | ✅ Yes | Default + RLS |

---

## 🔗 Documentation Links

- **Full Guide:** [EDGE_FUNCTIONS_GUIDE.md](./EDGE_FUNCTIONS_GUIDE.md)
- **Prevention:** [EDGE_FUNCTIONS_PREVENTION.md](./EDGE_FUNCTIONS_PREVENTION.md)
- **Functions README:** [supabase/functions/README.md](./supabase/functions/README.md)

---

## ⚡ Copy-Paste Templates

### Edge Function Code
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data } = await req.json()
    // Your logic here
    return new Response(
      JSON.stringify({ result: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
```

### Client Call
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { key: 'value' }
});

if (error) {
  console.error('Error:', error);
  return;
}

console.log('Success:', data);
```

---

**Remember:** When in doubt, check the full guide! 📚
