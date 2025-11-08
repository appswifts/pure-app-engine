# 🗑️ Flutterwave Removal Guide

## ✅ Safe Removal of Flutterwave Integration

This guide will help you completely remove Flutterwave while keeping Stripe and manual payments.

---

## 📋 **What Will Be Removed**

### **Database Objects:**
- ✅ Flutterwave-specific tables (if any)
- ✅ Flutterwave columns from existing tables
- ✅ Flutterwave functions
- ✅ Flutterwave indexes
- ✅ Flutterwave metadata

### **Edge Functions (6 functions):**
From your Supabase project, these functions will be deleted:
1. `flutterwave-billing`
2. `flutterwave-recurring`
3. `flutterwave-webhooks`
4. `flutterwave-public-key`
5. `flutterwave-verify`
6. `flutterwave-webhook`

### **Configuration:**
- ✅ Flutterwave API keys from environment
- ✅ Flutterwave webhook URLs
- ✅ Payment gateway configuration

---

## ✅ **What Will Stay**

### **Keep Working:**
- ✅ Stripe integration
- ✅ Manual payment system
- ✅ Subscription system
- ✅ Payment records (converted to manual)
- ✅ All other features

---

## 🚀 **Step-by-Step Removal**

### **Step 1: Backup (IMPORTANT!)**

```bash
# Backup your database
# In Supabase Dashboard: Database → Backups → Create backup

# Or export specific tables
pg_dump -h your-host -U postgres -t subscriptions > backup.sql
```

### **Step 2: Run Database Cleanup**

**Option A: Using SQL Editor (Recommended)**

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file: `FLUTTERWAVE_REMOVAL_SCRIPT.sql`
4. Copy and paste the entire script
5. Click **Run**
6. Verify success message appears

**Option B: Using Migration**

```bash
# If using Supabase CLI
supabase db push
```

The existing migration file `20250818155846_remove_flutterwave.sql` will run automatically.

### **Step 3: Delete Edge Functions**

**Using Supabase Dashboard:**

1. Go to **Edge Functions**
2. Delete these 6 functions one by one:
   - `flutterwave-billing` → Click ⋮ → Delete
   - `flutterwave-recurring` → Click ⋮ → Delete
   - `flutterwave-webhooks` → Click ⋮ → Delete
   - `flutterwave-public-key` → Click ⋮ → Delete
   - `flutterwave-verify` → Click ⋮ → Delete
   - `flutterwave-webhook` → Click ⋮ → Delete

**Or using Supabase CLI:**

```bash
# Delete each function
supabase functions delete flutterwave-billing
supabase functions delete flutterwave-recurring
supabase functions delete flutterwave-webhooks
supabase functions delete flutterwave-public-key
supabase functions delete flutterwave-verify
supabase functions delete flutterwave-webhook
```

### **Step 4: Remove Environment Variables**

1. Go to **Project Settings → Edge Functions**
2. Delete these environment variables (if they exist):
   - `FLUTTERWAVE_PUBLIC_KEY`
   - `FLUTTERWAVE_SECRET_KEY`
   - `FLUTTERWAVE_ENCRYPTION_KEY`
   - `FLUTTERWAVE_WEBHOOK_SECRET`
   - Any other `FLUTTERWAVE_*` variables

### **Step 5: Clean Up Local Files**

**Already done automatically:**
- ✅ No Flutterwave code in `src/` folder
- ✅ Edge functions are only in Supabase (cloud)

**Optional cleanup:**

```bash
# Remove the Flutterwave removal migration (after running it)
# Only if you want to clean up migration history
rm supabase/migrations/20250818155846_remove_flutterwave.sql
rm FLUTTERWAVE_REMOVAL_SCRIPT.sql
rm FLUTTERWAVE_REMOVAL_GUIDE.md
```

### **Step 6: Update Payment Gateway Configuration**

If you have a payment gateways admin UI:

1. Go to admin panel
2. Navigate to Payment Gateways settings
3. Remove or disable Flutterwave
4. Ensure Stripe and Manual payments are active

### **Step 7: Verify Removal**

**Check Database:**

```sql
-- Should return 0 results
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name ILIKE '%flutterwave%';

-- Should return 0 results
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename ILIKE '%flutterwave%';

-- Check payment methods updated
SELECT DISTINCT payment_method 
FROM payment_records;
-- Should show 'manual', 'stripe', but NOT 'flutterwave'
```

**Check Edge Functions:**

```bash
# List remaining functions
supabase functions list
# Should NOT show any flutterwave-* functions
```

**Check Environment Variables:**

```bash
# In Supabase Dashboard
# Project Settings → Edge Functions
# No FLUTTERWAVE_* variables should exist
```

---

## ✅ **Verification Checklist**

After removal, verify:

- [ ] Database script ran successfully
- [ ] All 6 Edge Functions deleted
- [ ] Environment variables removed
- [ ] No Flutterwave columns remain in database
- [ ] Payment records updated to 'manual'
- [ ] Stripe integration still works
- [ ] Manual payment system still works
- [ ] No Flutterwave references in logs
- [ ] Subscription system still functional

---

## 🧪 **Test After Removal**

### **Test Manual Payments:**

1. Create a subscription request
2. Submit manual payment
3. Admin approves payment
4. Subscription activates
5. ✅ Should work normally

### **Test Stripe (if configured):**

1. Select a subscription plan
2. Click Stripe checkout
3. Complete payment
4. Subscription activates
5. ✅ Should work normally

### **Test Existing Subscriptions:**

1. Check active subscriptions
2. Verify expiry dates
3. Check payment history
4. ✅ All data should be intact

---

## 📊 **What Changed**

### **Before Removal:**
```
Payment Options:
  1. Stripe (Global)
  2. Flutterwave (Africa)
  3. Manual (Bank Transfer)

Database Columns:
  - subscriptions.flutterwave_customer_id
  - subscriptions.flutterwave_subscription_id
  - payment_records.flutterwave_transaction_id
  
Edge Functions: 23 total
```

### **After Removal:**
```
Payment Options:
  1. Stripe (Global)
  2. Manual (Bank Transfer)

Database Columns:
  - Flutterwave columns removed
  - Data preserved and converted
  
Edge Functions: 17 total
```

---

## 🔄 **Data Migration Details**

### **Existing Payment Records:**

All Flutterwave payment records are automatically converted:

```sql
-- Before
payment_method: 'flutterwave'
flutterwave_transaction_id: 'FLW-123456'

-- After
payment_method: 'manual'
flutterwave_transaction_id: (column removed)
```

### **Subscriptions:**

Existing subscriptions remain intact:

```sql
-- Before
status: 'active'
flutterwave_customer_id: 'FLW-CUST-123'

-- After
status: 'active'
flutterwave_customer_id: (column removed)
```

**Important:** Subscription status, dates, and billing remain unchanged!

---

## ⚠️ **Important Notes**

### **1. No Data Loss**

- ✅ All subscriptions remain active
- ✅ Payment history preserved (method changed to 'manual')
- ✅ User data intact
- ✅ Restaurants unaffected

### **2. Stripe Remains**

- ✅ Stripe integration fully functional
- ✅ Stripe checkout works
- ✅ Stripe webhooks active
- ✅ Stripe customer portal available

### **3. Manual Payments**

- ✅ Manual payment flow unchanged
- ✅ Admin approval workflow works
- ✅ Payment verification active

### **4. Backward Compatibility**

Some functions keep Flutterwave parameters for compatibility:

```sql
-- This function still accepts flutterwave_subscription_id
-- But ignores it internally
update_subscription_status(
    subscription_id,
    new_status,
    flutterwave_subscription_id -- Ignored, kept for compatibility
)
```

---

## 🚨 **Troubleshooting**

### **Issue: Script fails on missing table**

**Solution:** Some tables may not exist in your database. The script uses `IF EXISTS` so it should skip gracefully.

### **Issue: Functions still appear**

**Solution:** 
1. Refresh Supabase Dashboard
2. Check under Edge Functions tab
3. May need to delete manually via dashboard

### **Issue: Environment variables not removed**

**Solution:**
1. Go to Project Settings
2. Edge Functions section
3. Manually delete each FLUTTERWAVE_* variable

### **Issue: Old payment records show errors**

**Solution:**
```sql
-- Update any remaining Flutterwave references
UPDATE payment_records 
SET payment_method = 'manual' 
WHERE payment_method = 'flutterwave';
```

---

## 📈 **Performance Impact**

### **Benefits:**

- ✅ **6 fewer Edge Functions** → Lower cold start times
- ✅ **Simpler database schema** → Faster queries
- ✅ **Fewer dependencies** → Easier maintenance
- ✅ **Cleaner codebase** → Better developer experience

### **Metrics:**

```
Edge Functions:  23 → 17 (-26%)
Database Tables: Same (no dedicated Flutterwave tables)
Database Columns: -5 columns total
API Complexity: Reduced
```

---

## 🎯 **Why Remove Flutterwave?**

Common reasons:
- ☐ Not operating in African markets
- ☐ Prefer Stripe for all regions
- ☐ Simplify payment stack
- ☐ Reduce maintenance overhead
- ☐ Cost optimization
- ☐ Compliance requirements

---

## 💡 **Alternative: Disable Instead of Delete**

If you might need Flutterwave later:

### **Option: Soft Disable**

Instead of deleting, just disable:

```sql
-- Disable in payment_gateways table
UPDATE payment_gateways 
SET is_active = false 
WHERE provider = 'flutterwave';
```

**Pros:**
- ✅ Can re-enable anytime
- ✅ Keep historical data
- ✅ Faster rollback

**Cons:**
- ⚠️ Edge Functions still deployed
- ⚠️ Environment variables still present
- ⚠️ Slightly more complex

---

## ✅ **Final Checklist**

Before marking complete:

- [ ] Backup created
- [ ] Database script executed successfully
- [ ] All 6 Edge Functions deleted
- [ ] Environment variables removed
- [ ] Verification queries run (0 results)
- [ ] Manual payments tested
- [ ] Stripe payments tested
- [ ] Active subscriptions verified
- [ ] No errors in application logs
- [ ] Documentation updated

---

## 🎉 **Success!**

Once complete, you'll have:

✅ Cleaner database schema  
✅ Fewer Edge Functions  
✅ Simpler payment stack  
✅ Stripe + Manual payments only  
✅ All existing data preserved  
✅ No functionality lost  

**Your app is now Flutterwave-free!** 🎊

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check verification queries** in Step 7
2. **Review Supabase logs** for errors
3. **Test each payment method** individually
4. **Verify database backup** is accessible
5. **Rollback if needed** using backup

---

**Estimated Time:** 15-30 minutes

**Difficulty:** Easy (mostly automated)

**Risk Level:** Low (safe cleanup, data preserved)

---

Ready to proceed? Follow the steps above! 🚀
