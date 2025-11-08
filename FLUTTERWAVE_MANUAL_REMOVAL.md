# 🗑️ Flutterwave Manual Removal - Step by Step

## ✅ Flutterwave Functions Found (6 Total)

I found these 6 Flutterwave Edge Functions in your Supabase project:

1. **flutterwave-billing** (ID: a1263a3f-ae4c-45a9-b923-3aa28febdc3b)
2. **flutterwave-recurring** (ID: ba09baae-e00f-468e-bb0b-ccb62770fdbc)
3. **flutterwave-webhooks** (ID: 4a60bfe2-ff13-47e7-a82b-ce40f0be8d7f)
4. **flutterwave-public-key** (ID: e1aadc35-22cd-41bb-9830-0354b4cf0214)
5. **flutterwave-verify** (ID: 1daa7d0f-e576-4c5a-bf96-fb3191739c07)
6. **flutterwave-webhook** (ID: 10c6fa1d-4aeb-40f1-a9e7-3fc1eacceeab)

---

## 📋 **Complete Removal Checklist**

### **Step 1: Delete Edge Functions (5 min)**

Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/functions

For each function, click the **⋮** menu → **Delete**:

- [ ] Delete `flutterwave-billing`
- [ ] Delete `flutterwave-recurring`
- [ ] Delete `flutterwave-webhooks`
- [ ] Delete `flutterwave-public-key`
- [ ] Delete `flutterwave-verify`
- [ ] Delete `flutterwave-webhook`

**After deletion, you should have 17 functions remaining (currently 23).**

---

### **Step 2: Clean Database (5 min)**

Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/sql/new

**Copy and paste this entire SQL script:**

```sql
BEGIN;

-- 1) Drop Flutterwave-specific functions
DROP FUNCTION IF EXISTS public.encrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.decrypt_flutterwave_data(text);
DROP FUNCTION IF EXISTS public.store_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.get_flutterwave_credentials(varchar);
DROP FUNCTION IF EXISTS public.rotate_flutterwave_credentials(varchar, text, text, text, text);
DROP FUNCTION IF EXISTS public.is_flutterwave_configured(varchar);

-- 2) Drop indexes
DROP INDEX IF EXISTS public.idx_payment_methods_flutterwave_customer_id;
DROP INDEX IF EXISTS public.idx_payments_flutterwave_transaction_id;

-- 3) Remove Flutterwave columns from subscriptions
ALTER TABLE IF EXISTS public.subscriptions 
DROP COLUMN IF EXISTS flutterwave_customer_id,
DROP COLUMN IF EXISTS flutterwave_subscription_id;

-- 4) Remove Flutterwave columns from payment_methods
ALTER TABLE IF EXISTS public.payment_methods 
DROP COLUMN IF EXISTS flutterwave_customer_id;

-- 5) Remove Flutterwave columns from payment_records
ALTER TABLE IF EXISTS public.payment_records 
DROP COLUMN IF EXISTS flutterwave_transaction_id,
DROP COLUMN IF EXISTS flutterwave_tx_ref;

-- 6) Update payment defaults
ALTER TABLE IF EXISTS public.payment_records 
ALTER COLUMN payment_method SET DEFAULT 'manual';

-- 7) Convert existing Flutterwave records to manual
UPDATE public.payment_records 
SET payment_method = 'manual' 
WHERE payment_method = 'flutterwave';

-- 8) Drop Flutterwave tables
DROP TABLE IF EXISTS public.flutterwave_credentials CASCADE;
DROP TABLE IF EXISTS public.flutterwave_config CASCADE;
DROP TABLE IF EXISTS public.payment_provider_configs CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;

-- 9) Remove Flutterwave from payment_gateways
DELETE FROM public.payment_gateways 
WHERE provider = 'flutterwave' OR name ILIKE '%flutterwave%';

-- 10) Clean metadata
UPDATE public.subscriptions 
SET metadata = metadata - 'flutterwave_data' 
WHERE metadata ? 'flutterwave_data';

UPDATE public.restaurants 
SET metadata = metadata - 'flutterwave_config' 
WHERE metadata ? 'flutterwave_config';

COMMIT;

-- Verification
SELECT 'Flutterwave removal completed!' as status;
```

**Click "RUN" and wait for success message.**

---

### **Step 3: Remove Environment Variables (2 min)**

Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/settings/functions

Delete these variables (if they exist):

- [ ] `FLUTTERWAVE_PUBLIC_KEY`
- [ ] `FLUTTERWAVE_SECRET_KEY`
- [ ] `FLUTTERWAVE_ENCRYPTION_KEY`
- [ ] `FLUTTERWAVE_WEBHOOK_SECRET`
- [ ] Any other `FLUTTERWAVE_*` variables

---

### **Step 4: Verify Removal (3 min)**

**Run this verification query:**

Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/sql/new

```sql
-- Check for remaining Flutterwave references
SELECT 
    'columns' as type,
    COUNT(*) as remaining
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ILIKE '%flutterwave%'

UNION ALL

SELECT 
    'tables' as type,
    COUNT(*) as remaining
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename ILIKE '%flutterwave%'

UNION ALL

SELECT 
    'payment_records' as type,
    COUNT(*) as remaining
FROM payment_records 
WHERE payment_method = 'flutterwave';
```

**Expected result:** All counts should be **0**

---

### **Step 5: Test Everything (5 min)**

**Test Manual Payments:**
1. Go to your app
2. Try to create a subscription
3. Submit manual payment
4. ✅ Should work normally

**Test Stripe (if configured):**
1. Try Stripe checkout
2. ✅ Should work normally

**Check Active Subscriptions:**
1. Go to Supabase → Table Editor → subscriptions
2. ✅ All data should be intact

---

## ✅ **Completion Checklist**

- [ ] All 6 Edge Functions deleted
- [ ] Database cleanup script ran successfully
- [ ] Environment variables removed
- [ ] Verification query shows 0 results
- [ ] Manual payments tested ✅
- [ ] Stripe payments tested ✅
- [ ] Active subscriptions verified ✅

---

## 📊 **Before & After**

### Before:
```
Edge Functions: 23
Payment Options: Stripe, Flutterwave, Manual
```

### After:
```
Edge Functions: 17
Payment Options: Stripe, Manual
```

---

## 🎉 **Benefits**

✅ **6 fewer Edge Functions** → Lower costs  
✅ **Simpler codebase** → Easier maintenance  
✅ **Cleaner database** → Better performance  
✅ **No data loss** → All subscriptions intact  

---

## 🆘 **Troubleshooting**

**Issue: Can't find Edge Functions**
- Refresh the page
- Check you're in the right project
- URL: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/functions

**Issue: SQL script fails**
- Run each section separately
- Some tables may not exist (that's OK!)
- Script uses `IF EXISTS` for safety

**Issue: Verification shows non-zero**
- Check which specific items remain
- May need to run additional cleanup
- Contact me for help

---

## ⏱️ **Total Time: ~20 minutes**

**Difficulty:** Easy  
**Risk:** Low (safe cleanup)  
**Reversible:** Yes (via database backup)

---

## 🎯 **Ready?**

1. Open Supabase Dashboard
2. Follow Steps 1-5 above
3. Check off each item
4. Verify completion

**Good luck! You've got this!** 🚀

---

**Project:** menu-manager-rwanda  
**Project ID:** isduljdnrbspiqsgvkiv  
**Direct Link:** https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv
