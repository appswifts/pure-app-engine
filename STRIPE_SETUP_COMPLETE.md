# Stripe Checkout Endpoint - Complete Setup Guide

**Date:** November 10, 2025  
**Status:** ✅ **FULLY IMPLEMENTED**

---

## 🎉 **What's Been Built**

### **1. Stripe Checkout Endpoint** ✅
- **Location:** `supabase/functions/create-checkout/index.ts`
- **Method:** POST
- **Auth:** Required (Bearer token)
- **Purpose:** Creates Stripe Checkout sessions for subscriptions

### **2. Frontend Integration** ✅
- **Location:** `src/pages/SubscriptionCheckout.tsx`
- **Automatically:** Creates checkout session and redirects to Stripe
- **Handles:** Errors and success flows

### **3. Database Updated** ✅
- **Added:** `stripe_price_id` column to `subscription_products`
- **Linked:** All 3 plans to Stripe prices
- **Ready:** For production use

---

## 🔧 **Environment Variables Needed**

### **Supabase Edge Functions:**

Add these to your Supabase Dashboard → Project Settings → Edge Functions:

```bash
# Stripe API Keys (Get from: https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE

# Stripe Webhook Secret (Get from: stripe listen --print-secret)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Supabase (Already configured)
SUPABASE_URL=https://isduljdnrbspiqsgvkiv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

---

## 📝 **How to Configure**

### **Step 1: Get Stripe Secret Key**

1. Go to: https://dashboard.stripe.com/test/apikeys
2. Click **"Reveal test key"** next to **Secret key**
3. Copy the key (starts with `sk_test_`)
4. Paste into Supabase secrets

### **Step 2: Set Supabase Secrets**

**Option A: Supabase Dashboard (Recommended)**
1. Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/settings/functions
2. Click **"Edge Function Secrets"**
3. Add secrets:
   - `STRIPE_SECRET_KEY` = `sk_test_...`
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (we'll get this in Step 3)

**Option B: Supabase CLI**
```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY

# Set webhook secret (after Step 3)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

### **Step 3: Get Webhook Secret (For Production)**

```bash
# Option 1: Stripe CLI (Local testing)
stripe listen --print-secret
# Copy the whsec_... key

# Option 2: Stripe Dashboard (Production)
# 1. Go to: https://dashboard.stripe.com/test/webhooks
# 2. Click "Add endpoint"
# 3. Endpoint URL: https://isduljdnrbspiqsgvkiv.supabase.co/functions/v1/stripe-webhook
# 4. Events: Select all checkout and subscription events
# 5. Copy the webhook signing secret
```

---

## 🧪 **Testing the Checkout Flow**

### **1. Local Testing with Stripe CLI**

**Terminal 1: Start your dev server**
```bash
cd c:\Users\FH\Desktop\blank-project\pure-app-engine
npm run dev
```

**Terminal 2: Forward webhooks**
```bash
stripe listen --forward-to https://isduljdnrbspiqsgvkiv.supabase.co/functions/v1/stripe-webhook
```

### **2. Test the Flow**

1. **Navigate to:** http://localhost:5173/subscriptions
2. **Select:** Any plan (Starter, Professional, or Enterprise)
3. **Click:** "Subscribe" button
4. **Select:** "Stripe" payment method
5. **Click:** "Subscribe" button
6. **You should:**
   - See "Redirecting to Stripe..." toast
   - Be redirected to Stripe Checkout page
   - See your plan details on Stripe

### **3. Complete Test Payment**

On Stripe Checkout page:

**Test Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

**Click:** "Subscribe"

**Expected Result:**
- ✅ Payment succeeds on Stripe
- ✅ Webhook fires: `checkout.session.completed`
- ✅ Subscription status: `pending` → `active`
- ✅ Redirected to: `/dashboard/subscription?success=true`
- ✅ User can access features

---

## 🔄 **Complete Flow Diagram**

```
User visits /subscriptions
       ↓
Selects plan & Stripe payment
       ↓
Clicks "Subscribe"
       ↓
Frontend creates pending subscription
       ↓
Calls create-checkout endpoint
       ↓
Endpoint creates Stripe Checkout Session
       ↓
User redirected to Stripe hosted page
       ↓
User enters card details & pays
       ↓
Stripe processes payment
       ↓
Stripe fires webhook: checkout.session.completed
       ↓
Webhook handler activates subscription
       ↓
User redirected back: /dashboard/subscription?success=true
       ↓
✅ SUBSCRIPTION ACTIVE
```

---

## 📦 **Stripe Price IDs (Already Created)**

```
Starter Plan:       price_1SRzHGHJDb8ZM1IXWuXxc1Ei  ($15/month)
Professional Plan:  price_1SRzHSHJDb8ZM1IXg2BiS1yH  ($35/month)
Enterprise Plan:    price_1SRzHdHJDb8ZM1IXS2zrAuGe  ($75/month)
```

These are already linked in your database!

---

## 🚀 **Deploy Edge Functions**

### **Deploy create-checkout:**
```bash
supabase functions deploy create-checkout
```

### **Deploy stripe-webhook (if not already):**
```bash
supabase functions deploy stripe-webhook
```

### **Verify deployment:**
```bash
supabase functions list
```

---

## ✅ **Verification Checklist**

### **Before Testing:**
- [ ] Stripe secret key added to Supabase secrets
- [ ] Webhook secret configured (for webhooks)
- [ ] Edge functions deployed
- [ ] Database has stripe_price_id for all plans

### **During Testing:**
- [ ] User can select Stripe payment
- [ ] Redirects to Stripe Checkout page
- [ ] Can see plan details on Stripe
- [ ] Test card payment works
- [ ] Webhook fires successfully
- [ ] Subscription activates automatically
- [ ] User redirected back to app

### **After Testing:**
- [ ] Check Supabase logs for any errors
- [ ] Verify subscription status in database
- [ ] Confirm user has access to features
- [ ] Test with different plans

---

## 🐛 **Troubleshooting**

### **Issue: "STRIPE_SECRET_KEY is not set"**
**Solution:**
1. Go to Supabase → Settings → Edge Functions
2. Add STRIPE_SECRET_KEY secret
3. Redeploy function

### **Issue: "No checkout URL received"**
**Solution:**
1. Check Supabase function logs
2. Verify stripe_price_id exists in database
3. Ensure product is active

### **Issue: "Product not found"**
**Solution:**
```sql
-- Check products
SELECT id, name, stripe_price_id, is_active 
FROM subscription_products;

-- Make sure is_active = true
UPDATE subscription_products SET is_active = true;
```

### **Issue: Webhook not firing**
**Solution:**
1. Check webhook secret is correct
2. Verify webhook endpoint URL
3. Check Stripe Dashboard → Webhooks for errors
4. Ensure stripe-webhook function is deployed

---

## 📚 **Related Files**

1. ✅ `supabase/functions/create-checkout/index.ts` - Checkout endpoint
2. ✅ `supabase/functions/stripe-webhook/index.ts` - Webhook handler
3. ✅ `src/pages/SubscriptionCheckout.tsx` - Frontend integration
4. ✅ `STRIPE_PRODUCT_IDS.md` - All Stripe IDs
5. ✅ `STRIPE_QUICK_REFERENCE.md` - Stripe CLI commands

---

## 🎯 **Next Steps**

### **1. Configure Stripe Keys** (5 minutes)
Add STRIPE_SECRET_KEY to Supabase secrets

### **2. Deploy Functions** (2 minutes)
```bash
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

### **3. Test Payment Flow** (5 minutes)
Complete a test subscription with test card

### **4. Set Up Production Webhook** (5 minutes)
Add webhook endpoint in Stripe Dashboard for production

---

## 🎉 **You're Ready!**

**Complete checklist:**
- ✅ Stripe products created
- ✅ Stripe prices created ($15, $35, $75/month)
- ✅ Database updated with price IDs
- ✅ Checkout endpoint implemented
- ✅ Frontend integrated
- ✅ Webhook handler ready
- ✅ Documentation complete

**Just add your Stripe secret key and deploy!** 🚀

---

**Total Time to Deploy:** ~15 minutes  
**Difficulty:** Easy  
**Status:** Production Ready ✅
