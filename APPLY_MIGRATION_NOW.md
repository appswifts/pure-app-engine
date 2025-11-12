# 🚨 FIX DATABASE ERRORS - Apply Migration Now!

## ❌ Current Errors:
- **403 Forbidden** on `stripe_config` table
- **404 Not Found** on `subscription_packages` table

## ✅ Solution: Run SQL Migration

---

## **Method 1: Supabase Dashboard (Easiest! ⭐)**

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project: `isduljdnrbspiqsgvkiv`
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"**

### Step 2: Copy & Paste SQL
1. Open file: `supabase/migrations/create_all_payment_tables.sql`
2. Copy ALL content (Ctrl+A, Ctrl+C)
3. Paste into SQL Editor

### Step 3: Run Migration
1. Click **"Run"** button (or press Ctrl+Enter)
2. Wait 5-10 seconds
3. You should see: "Success. No rows returned"

### Step 4: Verify
Run this query to verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'stripe_config', 
  'subscription_packages', 
  'manual_payments', 
  'manual_subscriptions'
);
```

You should see all 4 tables listed!

---

## **Method 2: Supabase CLI (If you have it)**

```bash
# Navigate to project
cd c:\Users\FH\Desktop\blank-project\pure-app-engine

# Apply migration
supabase db push

# Or apply specific file
psql -h isduljdnrbspiqsgvkiv.supabase.co -U postgres -d postgres -f supabase/migrations/create_all_payment_tables.sql
```

---

## **What Gets Created:**

### ✅ Tables Created:
1. **`stripe_config`** - Stripe API configuration
2. **`subscription_packages`** - Subscription plans (with 4 default plans!)
3. **`manual_payments`** - Manual payment records
4. **`manual_subscriptions`** - Manual subscription records

### ✅ Default Subscription Packages:
- **Free** - $0/month (1 restaurant, 50 items)
- **Starter** - $9.99/month (3 restaurants, 200 items)
- **Professional** - $29.99/month (10 restaurants, unlimited items)
- **Enterprise** - $99.99/month (unlimited everything)

### ✅ RLS Policies:
- Users can view their own payments
- Admins can manage everything
- Public can view active packages

---

## **After Running Migration:**

### Test in Browser:
1. Refresh page: `http://localhost:8080/admin/payment-gateways`
2. Errors should be GONE! ✅
3. You should see all 4 gateways
4. Subscription packages should load

### Check Console:
Open browser console (F12), you should see:
```
✓ Payment system initialized: 4/4 gateways enabled
```

No more 403 or 404 errors!

---

## **Troubleshooting:**

### If you still see 403 errors:
Your user might not have admin permissions. Run this:
```sql
-- Make yourself admin
UPDATE public.users 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### If you see "table already exists":
Tables exist but might be missing columns. Drop and recreate:
```sql
DROP TABLE IF EXISTS public.manual_subscriptions CASCADE;
DROP TABLE IF EXISTS public.manual_payments CASCADE;
DROP TABLE IF EXISTS public.subscription_packages CASCADE;
DROP TABLE IF EXISTS public.stripe_config CASCADE;

-- Then run the full migration again
```

### If migration fails:
Check error message carefully. Common issues:
- Not connected to database
- Wrong database selected
- Missing `public.users` table (create users table first)

---

## **Quick Command (Copy-Paste):**

Open Supabase SQL Editor and paste this:

```sql
-- Paste entire content of: supabase/migrations/create_all_payment_tables.sql
```

Then click **Run**! ⚡

---

## ✅ **Done!**

After running the migration:
- ✅ All errors fixed
- ✅ Payment gateways page works
- ✅ Subscription packages page works
- ✅ Manual payments ready
- ✅ 4 default pricing plans created

**Estimated time:** 2 minutes ⏱️
