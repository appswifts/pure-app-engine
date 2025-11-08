# Edge Functions Best Practices Guide

## 🚨 CRITICAL: Preventing 401 Authentication Errors

This guide ensures Edge Functions work correctly and never fail with 401 errors.

---

## ✅ **Rule #1: Always Use `supabase.functions.invoke()`**

### ❌ **WRONG - Manual Fetch (Causes 401 Errors)**
```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/my-function`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data: 'value' }),
  }
);
```

### ✅ **CORRECT - Use Supabase Client**
```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('my-function', {
  body: { data: 'value' },
});

if (error) {
  console.error('Function error:', error);
  return;
}

console.log('Success:', data);
```

**Why?** 
- Automatically handles authentication tokens
- Works with user sessions
- Proper error handling
- No manual header management

---

## ✅ **Rule #2: Configure Public Functions in `config.toml`**

If your Edge Function should work **without authentication** (e.g., webhooks, public APIs):

### File: `supabase/config.toml`
```toml
[functions.your-function-name]
verify_jwt = false
```

### Example:
```toml
project_id = "your-project-id"

# Public webhook - no auth required
[functions.stripe-webhook]
verify_jwt = false

# Public image generation
[functions.generate-food-image]
verify_jwt = false

# AI extraction - no auth required
[functions.ai-menu-extract]
verify_jwt = false
```

**After updating `config.toml`, always deploy:**
```bash
npx supabase functions deploy your-function-name
```

---

## ✅ **Rule #3: Edge Function Template**

Use this template for all new Edge Functions:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { data } = await req.json()
    
    if (!data) {
      throw new Error('Data is required')
    }

    // Your logic here
    const result = await processData(data)

    // Return success
    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    // Return error
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
```

---

## ✅ **Rule #4: Deployment Checklist**

Before deploying ANY Edge Function:

- [ ] Function code written
- [ ] CORS headers configured
- [ ] Error handling implemented
- [ ] `config.toml` updated with `verify_jwt` setting
- [ ] Deployed via CLI: `npx supabase functions deploy function-name`
- [ ] Tested with real requests
- [ ] Client code uses `supabase.functions.invoke()`

---

## 🔧 **Quick Fix for 401 Errors**

If you encounter 401 errors:

1. **Check client code** - Are you using `supabase.functions.invoke()`?
2. **Check config.toml** - Is `verify_jwt = false` set (if needed)?
3. **Redeploy** - Run `npx supabase functions deploy function-name`
4. **Clear browser cache** - Hard refresh with `Ctrl + Shift + R`

---

## 📋 **Function Types & Authentication**

| Function Type | Requires Auth | Config | Example |
|--------------|---------------|--------|---------|
| Public API/Webhook | ❌ No | `verify_jwt = false` | Stripe webhook, AI generation |
| User Action | ✅ Yes | Default | Profile update, data fetch |
| Admin Action | ✅ Yes | Default + RLS | User management, reports |

---

## 🎯 **Current Functions Configuration**

```toml
# supabase/config.toml

[functions.ai-menu-extract]
verify_jwt = false  # Public - AI menu processing

[functions.generate-food-image]
verify_jwt = false  # Public - Image generation
```

---

## 📚 **Resources**

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Function Configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [JWT Verification](https://supabase.com/docs/guides/functions/development-tips#skipping-authorization-checks)

---

## 🔒 **Security Notes**

**For public functions (`verify_jwt = false`):**
- ⚠️ Anyone can call them
- ⚠️ Implement rate limiting if needed
- ⚠️ Validate all inputs carefully
- ⚠️ Never expose sensitive data
- ✅ Perfect for webhooks, public APIs, image generation

**For authenticated functions (default):**
- ✅ User must be logged in
- ✅ JWT token automatically verified
- ✅ Use `supabase.functions.invoke()` from client
- ✅ Access user info from `req.headers.get('authorization')`

---

## ⚡ **Performance Tips**

1. **Keep functions small** - One responsibility per function
2. **Use caching** - Cache external API responses
3. **Error handling** - Always return proper error messages
4. **Logging** - Use `console.log()` for debugging (visible in logs)
5. **Timeouts** - Edge Functions timeout after 150 seconds

---

**Last Updated:** November 7, 2025
**Maintained by:** Development Team
