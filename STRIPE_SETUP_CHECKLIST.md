# ✅ Stripe Setup Checklist

## 🎯 Complete This to Get Stripe Working

### ✅ **What You Already Have**
- ✅ Stripe Service (`stripeService.ts`)
- ✅ Admin Configuration UI (`AdminStripeConfig.tsx`)
- ✅ Checkout Button Component (`StripeCheckoutButton.tsx`)
- ✅ Database table (`stripe_config`)
- ✅ Edge Function (`create-checkout`)
- ✅ Database migration

**You're 90% done! Just need configuration.**

---

## 📋 Setup Steps (30 Minutes)

### **Step 1: Get Stripe Account** (5 min)
- [ ] Go to [stripe.com/register](https://stripe.com/register)
- [ ] Create account or login
- [ ] Verify email

### **Step 2: Get API Keys** (2 min)
- [ ] Go to Stripe Dashboard → **Developers → API Keys**
- [ ] Copy **Publishable key**: `pk_test_...`
- [ ] Click **Reveal test key** → Copy **Secret key**: `sk_test_...`

### **Step 3: Configure in Your App** (3 min)
- [ ] Go to your app admin panel
- [ ] Find Stripe configuration (or go to `/admin/stripe`)
- [ ] Paste **Publishable Key**
- [ ] Paste **Secret Key**
- [ ] Select **Test** mode
- [ ] Toggle **Active** ON
- [ ] Click **Save Configuration**
- [ ] Click **Test Connection** → Should show ✅ Success

### **Step 4: Create Stripe Products** (10 min)

In Stripe Dashboard → **Products**:

#### Product 1: Starter Plan
- [ ] Click **+ Add Product**
- [ ] Name: `Starter Plan`
- [ ] Description: `Perfect for small restaurants`
- [ ] Click **Add pricing**
- [ ] Price: `10000` (or your price)
- [ ] Currency: `RWF` (or your currency)
- [ ] Billing period: **Monthly**
- [ ] Click **Save product**
- [ ] **Copy the Price ID**: `price_xxxxxxxxxxxxx`

#### Product 2: Professional Plan
- [ ] Click **+ Add Product**
- [ ] Name: `Professional Plan`
- [ ] Description: `Ideal for growing restaurants`
- [ ] Click **Add pricing**
- [ ] Price: `25000`
- [ ] Currency: `RWF`
- [ ] Billing period: **Monthly**
- [ ] Click **Save product**
- [ ] **Copy the Price ID**: `price_xxxxxxxxxxxxx`

#### Product 3: Premium Plan
- [ ] Click **+ Add Product**
- [ ] Name: `Premium Plan`
- [ ] Description: `Everything you need`
- [ ] Click **Add pricing**
- [ ] Price: `50000`
- [ ] Currency: `RWF`
- [ ] Billing period: **Monthly**
- [ ] Click **Save product**
- [ ] **Copy the Price ID**: `price_xxxxxxxxxxxxx`

### **Step 5: Update Database** (5 min)

Run this SQL in Supabase SQL Editor:

```sql
-- Add stripe_price_id column to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Update Starter Plan (replace 'price_xxxxx' with your actual Price ID)
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Starter';

-- Update Professional Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Professional';

-- Update Premium Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Premium';

-- Add Stripe columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub 
ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer 
ON subscriptions(stripe_customer_id);
```

### **Step 6: Set Environment Variable** (2 min)

In Supabase Dashboard → **Project Settings → Edge Functions**:

- [ ] Add secret: `STRIPE_SECRET_KEY`
- [ ] Value: Your secret key (`sk_test_...`)
- [ ] Click **Save**

### **Step 7: Deploy Edge Function** (3 min)

If not already deployed:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy create-checkout
```

Or deploy via Supabase Dashboard:
- [ ] Go to **Edge Functions**
- [ ] Deploy `create-checkout` function

### **Step 8: Test!** (5 min)

- [ ] Go to your app subscription page
- [ ] Click on a plan
- [ ] Click **Subscribe** or checkout button
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: Any future date (e.g., `12/25`)
- [ ] CVC: Any 3 digits (e.g., `123`)
- [ ] ZIP: Any 5 digits (e.g., `12345`)
- [ ] Complete checkout
- [ ] Verify: 
  - [ ] Redirected back to your app ✅
  - [ ] Subscription created in database ✅
  - [ ] Subscription shows in Stripe Dashboard ✅

---

## 🎉 You're Done!

**Test Mode is Working!** Now users can subscribe with credit cards.

---

## 🚀 Going Live (When Ready)

### **Step 1: Activate Your Stripe Account**
- [ ] Go to Stripe Dashboard → **Activate your account**
- [ ] Provide business information
- [ ] Verify identity
- [ ] Add bank account for payouts

### **Step 2: Get Live API Keys**
- [ ] Go to **Developers → API Keys**
- [ ] Toggle **View live mode**
- [ ] Copy **Live Publishable key**: `pk_live_...`
- [ ] Copy **Live Secret key**: `sk_live_...`

### **Step 3: Create Live Products**
- [ ] Switch to **Live mode** in Stripe Dashboard
- [ ] Create same products as test mode
- [ ] Copy live Price IDs

### **Step 4: Configure Live Mode in Your App**
- [ ] Go to admin Stripe config
- [ ] Select **Live** mode
- [ ] Paste Live Publishable Key
- [ ] Paste Live Secret Key
- [ ] Toggle **Active** ON
- [ ] Save

### **Step 5: Update Database with Live Price IDs**
```sql
UPDATE subscription_plans 
SET stripe_price_id = 'price_live_xxxxx'
WHERE name = 'Starter';

-- Repeat for all plans
```

### **Step 6: Update Environment Variable**
- [ ] Update `STRIPE_SECRET_KEY` with live key (`sk_live_...`)

### **Step 7: Test with Real Card**
- [ ] Use a real credit card
- [ ] Complete small test purchase
- [ ] Verify everything works
- [ ] Refund test purchase

---

## 🔍 Verification Checklist

After setup, verify:

### Database:
- [ ] `subscription_plans` has `stripe_price_id` column
- [ ] All plans have valid Stripe Price IDs
- [ ] `subscriptions` has Stripe columns
- [ ] `stripe_config` table has your keys

### Stripe Dashboard:
- [ ] API keys are correct
- [ ] Products created
- [ ] Prices created with correct amounts

### Your App:
- [ ] Admin panel shows "Stripe Configured ✅"
- [ ] Test connection succeeds
- [ ] Checkout button appears on plans
- [ ] Clicking button opens Stripe Checkout

### Functionality:
- [ ] Test card checkout works
- [ ] Redirected back after payment
- [ ] Subscription created in database
- [ ] Subscription visible in Stripe Dashboard

---

## 🆘 Troubleshooting

### **Problem: "Stripe not configured"**
**Solution:** 
- Check admin panel has API keys saved
- Verify `is_active` is TRUE in database
- Check environment variable is set

### **Problem: "Missing Price ID"**
**Solution:**
- Verify you ran the SQL to add `stripe_price_id` column
- Check you updated each plan with correct Price ID
- Price ID should look like: `price_xxxxxxxxxxxxx`

### **Problem: "Checkout fails to load"**
**Solution:**
- Check browser console for errors
- Verify Edge Function is deployed
- Check `STRIPE_SECRET_KEY` environment variable
- Ensure user is authenticated

### **Problem: "Payment succeeds but subscription not created"**
**Solution:**
- Check Edge Function logs
- Verify database permissions
- Check subscription table has correct columns

---

## 📊 Monitor Your Payments

### In Stripe Dashboard:
- View all payments: **Payments**
- View subscriptions: **Subscriptions**
- View customers: **Customers**
- View test data: Toggle to **Test mode**

### In Your Database:
```sql
-- View all subscriptions
SELECT * FROM subscriptions 
WHERE stripe_subscription_id IS NOT NULL;

-- View Stripe customers
SELECT DISTINCT stripe_customer_id, restaurant_id 
FROM subscriptions 
WHERE stripe_customer_id IS NOT NULL;

-- Count by status
SELECT status, COUNT(*) 
FROM subscriptions 
GROUP BY status;
```

---

## 🎯 Next Steps After Setup

1. **Set up Webhooks** (for automatic subscription updates)
   - Create webhook endpoint
   - Handle events like payment failures
   
2. **Enable More Payment Methods**
   - Apple Pay
   - Google Pay
   - Bank transfers (ACH)

3. **Implement Invoicing**
   - Auto-generate PDF invoices
   - Email receipts to customers

4. **Add Proration**
   - Handle mid-cycle upgrades/downgrades
   - Calculate prorated amounts

5. **Monitor & Optimize**
   - Track failed payments
   - Analyze conversion rates
   - Reduce churn

---

## ✅ Final Checklist

Before going live:
- [ ] Test mode works perfectly
- [ ] All plans have correct prices
- [ ] Successful test purchase completed
- [ ] Stripe account fully activated
- [ ] Business info verified
- [ ] Bank account added
- [ ] Live mode configured
- [ ] Live products created
- [ ] Small real purchase tested
- [ ] Monitoring set up

---

**You're ready to accept payments!** 🎊💳

For detailed information, see: `STRIPE_INTEGRATION_GUIDE.md`
