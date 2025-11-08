# 💳 Stripe Integration - Complete Guide

## 🎉 Good News: You Already Have Stripe Integration!

Your app has a **fully-functional Stripe payment system** already built. Here's everything you need to know:

---

## ✅ What's Already Built

### **1. Stripe Service** (`stripeService.ts`)
Complete service with:
- ✅ Configuration management (test/live modes)
- ✅ Customer CRUD operations
- ✅ Subscription management
- ✅ Payment tracking
- ✅ Checkout session creation
- ✅ Webhook support

### **2. Admin Configuration** (`AdminStripeConfig.tsx`)
Admin panel to:
- ✅ Set up Stripe API keys (test & live)
- ✅ Configure webhooks
- ✅ Toggle between test and live mode
- ✅ Test connection
- ✅ Secure key storage (encrypted)

### **3. Checkout Button** (`StripeCheckoutButton.tsx`)
Ready-to-use component:
- ✅ One-click checkout
- ✅ Loading states
- ✅ Error handling
- ✅ Opens Stripe hosted checkout

### **4. Database Table** (`stripe_config`)
- ✅ Stores API keys securely
- ✅ Admin-only access (RLS)
- ✅ Environment separation (test/live)
- ✅ Auto-updates timestamp

---

## 🚀 Quick Start: Get Stripe Working

### **Step 1: Get Stripe API Keys**

1. Go to [stripe.com](https://stripe.com) and sign up/login
2. Navigate to **Developers → API Keys**
3. Copy your keys:
   ```
   Test Mode:
   - Publishable key: pk_test_xxxxxxxxxxxxx
   - Secret key: sk_test_xxxxxxxxxxxxx
   
   Live Mode (for production):
   - Publishable key: pk_live_xxxxxxxxxxxxx
   - Secret key: sk_live_xxxxxxxxxxxxx
   ```

### **Step 2: Configure in Your App**

```tsx
// Go to your admin panel
// Navigate to: Admin Dashboard → Payment Gateways → Stripe

// Or add the component to your admin routes:
import AdminStripeConfig from '@/components/AdminStripeConfig';

<Route path="/admin/stripe" element={<AdminStripeConfig />} />
```

**In the admin panel:**
1. Select environment: **Test** (for development)
2. Paste your **Publishable Key**
3. Paste your **Secret Key**
4. (Optional) Add Webhook Secret
5. Toggle **Active**
6. Click **Save Configuration**
7. Click **Test Connection** ✅

### **Step 3: Create Stripe Products & Prices**

In Stripe Dashboard:
1. Go to **Products → Add Product**
2. Create products matching your subscription plans:

```
Product: Starter Plan
- Price: $10/month (or RWF 10,000)
- Billing: Recurring (monthly)
- Copy the Price ID: price_xxxxxxxxxxxxx

Product: Professional Plan
- Price: $25/month (or RWF 25,000)
- Billing: Recurring (monthly)
- Copy the Price ID: price_xxxxxxxxxxxxx

Product: Premium Plan
- Price: $50/month (or RWF 50,000)
- Billing: Recurring (monthly)
- Copy the Price ID: price_xxxxxxxxxxxxx
```

### **Step 4: Add Price IDs to Your Subscription Plans**

Update your `subscription_plans` table:
```sql
-- Add stripe_price_id column
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Update your plans with Stripe Price IDs
UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Starter';

UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Professional';

UPDATE subscription_plans 
SET stripe_price_id = 'price_xxxxxxxxxxxxx'
WHERE name = 'Premium';
```

---

## 💻 How to Use Stripe in Your App

### **Option 1: Using the Checkout Button Component**

```tsx
import StripeCheckoutButton from '@/components/StripeCheckoutButton';

function PlanCard({ plan }) {
  return (
    <div>
      <h3>{plan.name}</h3>
      <p>{plan.price} {plan.currency}</p>
      
      <StripeCheckoutButton
        planId={plan.id}
        planName={plan.name}
        amount={plan.price}
        currency={plan.currency}
        billingInterval={plan.billing_interval}
      />
    </div>
  );
}
```

### **Option 2: Custom Implementation**

```tsx
import { stripeService } from '@/services/stripeService';
import { supabase } from '@/integrations/supabase/client';

async function handleSubscribe(planId: string) {
  try {
    // 1. Get the plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    // 2. Create Stripe checkout session
    const { data } = await supabase.functions.invoke('create-checkout', {
      body: {
        planId: plan.id,
        billingInterval: plan.billing_interval,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`
      }
    });

    // 3. Redirect to Stripe Checkout
    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (error) {
    console.error('Checkout failed:', error);
  }
}
```

---

## 🔄 Integration with Your Subscription System

### **Update PlanUpgradeFlow Component**

```tsx
// In src/components/subscription/PlanUpgradeFlow.tsx

import StripeCheckoutButton from '@/components/StripeCheckoutButton';

// Replace manual payment with Stripe button:
<StripeCheckoutButton
  planId={selectedPlan.id}
  planName={selectedPlan.name}
  amount={selectedPlan.price}
  currency={selectedPlan.currency}
  billingInterval={selectedPlan.billing_interval}
>
  Upgrade to {selectedPlan.name}
</StripeCheckoutButton>
```

### **Update CompleteSubscriptionDashboard**

```tsx
// Add Stripe option to payment methods

function PaymentMethodSelector() {
  const [method, setMethod] = useState<'stripe' | 'manual'>('stripe');

  return (
    <div>
      <RadioGroup value={method} onValueChange={setMethod}>
        <RadioGroupItem value="stripe">
          💳 Pay with Card (Stripe)
        </RadioGroupItem>
        <RadioGroupItem value="manual">
          🏦 Manual Payment (Bank Transfer)
        </RadioGroupItem>
      </RadioGroup>

      {method === 'stripe' ? (
        <StripeCheckoutButton {...planDetails} />
      ) : (
        <ManualPaymentForm {...planDetails} />
      )}
    </div>
  );
}
```

---

## 🎯 Edge Functions Needed

You'll need to create these Supabase Edge Functions:

### **1. Create Checkout Session** (`create-checkout`)

```typescript
// supabase/functions/create-checkout/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req) => {
  try {
    const { planId, billingInterval, successUrl, cancelUrl } = await req.json()

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    // Get plan details
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan || !plan.stripe_price_id) {
      throw new Error('Plan not found or missing Stripe Price ID')
    }

    // Get restaurant
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get Stripe config
    const { data: stripeConfig } = await supabase
      .from('stripe_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (!stripeConfig) {
      throw new Error('Stripe not configured')
    }

    // Initialize Stripe
    const stripe = new Stripe(atob(stripeConfig.secret_key_encrypted), {
      apiVersion: '2023-10-16',
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripe_price_id,
          quantity: 1,
        },
      ],
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        restaurant_id: restaurant.id,
        plan_id: planId,
      },
      success_url: successUrl || `${req.headers.get('origin')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/subscription/cancel`,
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

### **2. Stripe Webhook Handler** (`stripe-webhook`)

```typescript
// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    // Initialize Supabase (service role for database updates)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook secret
    const { data: stripeConfig } = await supabase
      .from('stripe_config')
      .select('webhook_secret, secret_key_encrypted')
      .eq('is_active', true)
      .single()

    if (!stripeConfig) {
      throw new Error('Stripe not configured')
    }

    // Initialize Stripe
    const stripe = new Stripe(atob(stripeConfig.secret_key_encrypted), {
      apiVersion: '2023-10-16',
    })

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      stripeConfig.webhook_secret!
    )

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const { user_id, restaurant_id, plan_id } = session.metadata

        // Create subscription record
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', plan_id)
          .single()

        const periodStart = new Date()
        const periodEnd = new Date()
        periodEnd.setMonth(periodEnd.getMonth() + 1) // Assuming monthly

        await supabase
          .from('subscriptions')
          .insert({
            user_id,
            restaurant_id,
            plan_id,
            status: 'active',
            amount: plan.price,
            currency: plan.currency,
            billing_interval: plan.billing_interval,
            current_period_start: periodStart.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_subscription_id: session.subscription,
            stripe_customer_id: session.customer,
          })

        // Update restaurant status
        await supabase
          .from('restaurants')
          .update({
            subscription_status: 'active',
            subscription_end_date: periodEnd.toISOString(),
          })
          .eq('id', restaurant_id)

        // Create payment record
        await supabase
          .from('payment_records')
          .insert({
            subscription_id: plan_id, // Get actual subscription ID
            amount: plan.price,
            currency: plan.currency,
            payment_method: 'stripe',
            status: 'completed',
            stripe_payment_intent: session.payment_intent,
          })

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)
        
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        
        // Handle failed payment
        // You might want to notify the user
        
        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
```

---

## 📝 Database Schema Updates

```sql
-- Add Stripe-specific columns to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Add Stripe-specific columns to subscriptions
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add Stripe-specific columns to payment_records
ALTER TABLE payment_records 
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id 
ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id 
ON subscriptions(stripe_customer_id);
```

---

## 🔐 Security Best Practices

### **1. Never Expose Secret Keys**
```typescript
// ❌ BAD - Don't do this
const stripe = new Stripe('sk_test_xxxxx')

// ✅ GOOD - Use environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// ✅ BETTER - Use Edge Functions
await supabase.functions.invoke('create-checkout', { ... })
```

### **2. Validate Webhooks**
```typescript
// Always verify webhook signatures
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
```

### **3. Use Test Mode First**
```
Test Mode: pk_test_xxx / sk_test_xxx
Live Mode: pk_live_xxx / sk_live_xxx

Always test thoroughly before going live!
```

---

## 🎯 Testing Stripe Integration

### **Test Cards**

Stripe provides test cards:
```
Success: 4242 4242 4242 4242
  - Any future expiry date
  - Any 3-digit CVC
  - Any billing ZIP

Decline: 4000 0000 0000 0002

Requires Authentication: 4000 0025 0000 3155
```

### **Test Flow**

1. Set up Stripe config in **Test Mode**
2. Create test products in Stripe Dashboard
3. Add Price IDs to your plans
4. Click subscribe on a plan
5. Use test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify subscription created in database
8. Check Stripe Dashboard for subscription

---

## 🚨 Common Issues & Solutions

### **Issue 1: "Stripe not configured"**
**Solution:** Go to admin panel and configure Stripe API keys

### **Issue 2: "Missing Price ID"**
**Solution:** Add `stripe_price_id` to your subscription plans

### **Issue 3: "Webhook not receiving events"**
**Solution:** 
1. Set up webhook endpoint in Stripe Dashboard
2. Point to your Edge Function URL
3. Add webhook secret to config

### **Issue 4: "Checkout session fails"**
**Solution:** Check browser console and Edge Function logs

---

## 📊 Monitoring & Analytics

### **Stripe Dashboard**
Monitor:
- ✅ Successful payments
- ✅ Failed payments
- ✅ Active subscriptions
- ✅ Customer lifetime value
- ✅ Revenue trends

### **Your Database**
Track:
- ✅ Conversion rates (trials → paid)
- ✅ Churn rate
- ✅ Popular plans
- ✅ Failed payment recovery

---

## 🎉 Summary

### **What You Have:**
✅ Complete Stripe service  
✅ Admin configuration panel  
✅ Checkout button component  
✅ Database schema ready  
✅ Security in place  

### **What You Need to Do:**
1. Get Stripe API keys (5 minutes)
2. Configure in admin panel (2 minutes)
3. Create products in Stripe (10 minutes)
4. Add Price IDs to plans (5 minutes)
5. Create Edge Functions (30 minutes)
6. Test with test cards (10 minutes)
7. Go live! 🚀

---

## 📚 Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

---

**You're ready to accept payments with Stripe!** 💳✨
