# Database Update Guide - Stripe Price IDs

**Date:** November 10, 2025  
**Task:** Link Stripe prices to subscription plans

---

## 🎯 **Quick Steps**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run `update-stripe-prices.sql`
4. Verify the updates

---

## 📋 **Detailed Instructions**

### **Step 1: Open Supabase**

1. Go to: https://supabase.com/dashboard
2. Select your project: `pure-app-engine`
3. Click **SQL Editor** in the left sidebar

### **Step 2: Run the Update Script**

Copy and paste this SQL into the editor:

```sql
-- Update Starter Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHGHJDb8ZM1IXWuXxc1Ei',
    updated_at = NOW()
WHERE name ILIKE '%starter%';

-- Update Professional Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHSHJDb8ZM1IXg2BiS1yH',
    updated_at = NOW()
WHERE name ILIKE '%professional%';

-- Update Enterprise Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHdHJDb8ZM1IXS2zrAuGe',
    updated_at = NOW()
WHERE name ILIKE '%enterprise%';

-- Verify the updates
SELECT 
    id,
    name,
    price,
    stripe_price_id,
    CASE 
        WHEN stripe_price_id IS NOT NULL THEN '✓ Updated'
        ELSE '✗ Missing'
    END as status
FROM subscription_plans 
ORDER BY price ASC;
```

### **Step 3: Click "Run"**

Click the **Run** button (or press Ctrl+Enter)

### **Step 4: Verify Results**

You should see 3 rows updated:

```
✓ Starter Plan       - price_1SRzHGHJDb8ZM1IXWuXxc1Ei
✓ Professional Plan  - price_1SRzHSHJDb8ZM1IXg2BiS1yH
✓ Enterprise Plan    - price_1SRzHdHJDb8ZM1IXS2zrAuGe
```

---

## ✅ **Expected Results**

### **Before Update:**
```
| name              | price | stripe_price_id |
|-------------------|-------|-----------------|
| Starter           | 15.00 | NULL            |
| Professional      | 35.00 | NULL            |
| Enterprise        | 75.00 | NULL            |
```

### **After Update:**
```
| name              | price | stripe_price_id                       | status    |
|-------------------|-------|---------------------------------------|-----------|
| Starter           | 15.00 | price_1SRzHGHJDb8ZM1IXWuXxc1Ei      | ✓ Updated |
| Professional      | 35.00 | price_1SRzHSHJDb8ZM1IXg2BiS1yH      | ✓ Updated |
| Enterprise        | 75.00 | price_1SRzHdHJDb8ZM1IXS2zrAuGe      | ✓ Updated |
```

---

## 🚨 **Troubleshooting**

### **Issue: No rows updated**

**Problem:** Plan names don't match  
**Solution:** Check exact plan names in your database:

```sql
SELECT id, name FROM subscription_plans;
```

Then update the SQL to match exact names:

```sql
-- Example: If your plan is named "Starter Package"
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHGHJDb8ZM1IXWuXxc1Ei'
WHERE name = 'Starter Package';  -- Exact match
```

### **Issue: Column doesn't exist**

**Problem:** `stripe_price_id` column missing  
**Solution:** Add the column:

```sql
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
```

Then run the update script again.

---

## 🔄 **Alternative: Update by Price Amount**

If plan names don't match, update by price:

```sql
-- Update based on price amount
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHGHJDb8ZM1IXWuXxc1Ei'
WHERE price = 15.00;

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHSHJDb8ZM1IXg2BiS1yH'
WHERE price = 35.00;

UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHdHJDb8ZM1IXS2zrAuGe'
WHERE price = 75.00;
```

---

## 📊 **Verification Query**

After updating, run this to confirm:

```sql
SELECT 
    name,
    price,
    stripe_price_id,
    LENGTH(stripe_price_id) as id_length,
    CASE 
        WHEN stripe_price_id LIKE 'price_%' THEN '✓ Valid Format'
        WHEN stripe_price_id IS NULL THEN '✗ Missing'
        ELSE '⚠ Invalid Format'
    END as validation
FROM subscription_plans 
ORDER BY price ASC;
```

All `stripe_price_id` values should:
- Start with `price_`
- Be 33 characters long
- Show "✓ Valid Format"

---

## 📝 **Files Created**

- ✅ `update-stripe-prices.sql` - Ready-to-run SQL script
- ✅ `STRIPE_PRODUCT_IDS.md` - All Stripe IDs reference
- ✅ `DATABASE_UPDATE_GUIDE.md` - This guide

---

## 🎯 **After Database Update**

Once the database is updated, you can:

1. ✅ Test the subscription checkout flow
2. ✅ Create Stripe checkout sessions
3. ✅ Process real payments (test mode)
4. ✅ Activate subscriptions via webhooks

---

**Run the SQL now and let me know the results!** 🚀
