# 🛡️ Edge Functions - 401 Error Prevention System

This document outlines all measures in place to prevent Edge Function authentication errors.

---

## ✅ What We've Implemented

### 1. **Comprehensive Documentation** 📚
- **`EDGE_FUNCTIONS_GUIDE.md`** - Complete guide with examples, best practices, and troubleshooting
- **`supabase/functions/README.md`** - Quick reference for developers
- Clear examples of correct vs incorrect patterns

### 2. **Utility Helper Functions** 🔧
- **`src/lib/utils/edge-functions.ts`**
  - `callEdgeFunction()` - Generic wrapper with retry logic
  - `generateFoodImage()` - Specialized helper for image generation
  - `extractMenuFromFile()` - Specialized helper for menu extraction
  - Automatic error handling and type safety
  - Built-in retry mechanism for transient failures

### 3. **Code Comments & Warnings** ⚠️
- Added warning comments in all files that call Edge Functions:
  - `src/lib/services/ai-menu-import.ts`
  - `src/components/menu/AIImageGenerator.tsx`
- Comments explain WHY to use the correct pattern
- Direct reference to documentation

### 4. **Configuration Management** ⚙️
- **`supabase/config.toml`** properly configured
  - All public functions have `verify_jwt = false`
  - Clear comments explaining each function's auth requirements
  - Template for adding new functions

### 5. **Pre-Commit Hook Template** 🪝
- **`.husky/pre-commit.example`**
  - Automatically detects manual fetch() calls
  - Warns about hardcoded Authorization headers
  - Prevents bad code from being committed

---

## 🔒 Current Function Configuration

```toml
# supabase/config.toml

[functions.ai-menu-extract]
verify_jwt = false  # Public - AI menu processing

[functions.generate-food-image]
verify_jwt = false  # Public - Image generation
```

**Status:** ✅ All deployed and working

---

## 📋 Developer Checklist

When creating/modifying Edge Functions, always:

- [ ] Read `EDGE_FUNCTIONS_GUIDE.md` first
- [ ] Use `supabase.functions.invoke()` from client
- [ ] Update `config.toml` if function needs public access
- [ ] Deploy via CLI: `npx supabase functions deploy function-name`
- [ ] Test with real requests
- [ ] Add warning comments in code
- [ ] Consider using helper utilities from `edge-functions.ts`

---

## 🚨 Red Flags to Watch For

### ❌ **NEVER Do These:**

1. **Manual fetch() to Edge Functions**
   ```typescript
   // ❌ WRONG
   fetch(`${SUPABASE_URL}/functions/v1/my-function`, { ... })
   ```

2. **Hardcoded Authorization Headers**
   ```typescript
   // ❌ WRONG
   headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
   ```

3. **Missing config.toml Entry**
   ```toml
   # ❌ WRONG - No verify_jwt setting for public function
   ```

4. **Deploying Without CLI**
   ```bash
   # ❌ WRONG - Using web UI only (doesn't apply config)
   ```

### ✅ **ALWAYS Do These:**

1. **Use Supabase Client**
   ```typescript
   // ✅ CORRECT
   supabase.functions.invoke('my-function', { body: { ... } })
   ```

2. **Use Helper Utilities**
   ```typescript
   // ✅ CORRECT
   import { callEdgeFunction } from '@/lib/utils/edge-functions';
   const result = await callEdgeFunction('my-function', { ... });
   ```

3. **Configure Public Functions**
   ```toml
   # ✅ CORRECT
   [functions.my-function]
   verify_jwt = false
   ```

4. **Deploy via CLI**
   ```bash
   # ✅ CORRECT
   npx supabase functions deploy my-function
   ```

---

## 🔄 Quick Fix Process

If 401 errors occur:

1. **Check client code** → Use `supabase.functions.invoke()`
2. **Check config.toml** → Add `verify_jwt = false` if needed
3. **Redeploy** → `npx supabase functions deploy function-name`
4. **Clear cache** → Hard refresh browser (`Ctrl + Shift + R`)

---

## 📊 Success Metrics

- ✅ Zero 401 errors in production
- ✅ All Edge Functions properly configured
- ✅ All client code uses correct patterns
- ✅ Documentation covers all scenarios
- ✅ Helper utilities available for common tasks

---

## 🎯 Future Improvements

1. **Automated Testing**
   - Integration tests for each Edge Function
   - Test authentication flows
   - Test error handling

2. **Monitoring**
   - Alert on 401 errors
   - Track Edge Function performance
   - Monitor retry patterns

3. **Developer Tools**
   - VS Code snippets for Edge Function calls
   - ESLint rules to catch anti-patterns
   - Automated config.toml validation

---

## 📞 Support

If you encounter Edge Function issues:

1. Read `EDGE_FUNCTIONS_GUIDE.md`
2. Check `supabase/functions/README.md`
3. Use helper utilities from `edge-functions.ts`
4. Review this prevention document
5. Check Supabase logs: `npx supabase functions logs function-name`

---

## 📝 Change Log

**2025-11-07**
- ✅ Fixed 401 errors in `generate-food-image` function
- ✅ Updated all client code to use `supabase.functions.invoke()`
- ✅ Created comprehensive documentation
- ✅ Added helper utilities
- ✅ Configured `config.toml` properly
- ✅ Deployed all functions via CLI

---

**Last Updated:** November 7, 2025  
**Status:** 🟢 All Systems Operational
