# MCP Setup Guide - Chrome DevTools & Stripe

**Date:** November 10, 2025  
**Purpose:** Configure MCP servers for Chrome DevTools debugging and Stripe payment testing  
**Status:** Ready to Configure

---

## 📋 **What Are MCP Servers?**

MCP (Model Context Protocol) servers extend Claude's capabilities by providing access to:
- **Chrome DevTools MCP:** Inspect browser elements, debug JavaScript, view console logs
- **Stripe MCP:** Create products, manage subscriptions, test payments, view webhooks

---

## 🚀 **Quick Setup**

### **Step 1: Locate Claude Desktop Config**

Open your Claude Desktop configuration file:

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### **Step 2: Add MCP Servers**

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "disabled": false,
      "env": {}
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp-server"],
      "disabled": false,
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_YOUR_STRIPE_SECRET_KEY_HERE"
      }
    }
  }
}
```

### **Step 3: Get Stripe API Keys**

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Sign up/login
3. Copy your **Secret Key** (starts with `sk_test_`)
4. Replace `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` in the config above

### **Step 4: Restart Claude Desktop**

Close and reopen Claude Desktop to load the MCP servers.

---

## 🔧 **Complete Configuration Example**

```json
{
  "mcpServers": {
    "supabase-mcp-server": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "disabled": false,
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your-supabase-token",
        "SUPABASE_PROJECT_ID": "your-project-id"
      }
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp"],
      "disabled": false,
      "env": {}
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp-server"],
      "disabled": false,
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_51234567890abcdef..."
      }
    }
  }
}
```

---

## 🎯 **What You Can Do with Chrome DevTools MCP**

### **Available Commands:**

**1. Inspect Elements:**
```
"Can you inspect the payment form and show me the HTML structure?"
```

**2. View Console Logs:**
```
"Show me the browser console errors"
```

**3. Debug JavaScript:**
```
"What JavaScript errors are happening when I click Subscribe?"
```

**4. Monitor Network:**
```
"Show me all API requests when the page loads"
```

**5. Test Responsive Design:**
```
"Show me how the checkout page looks on mobile"
```

---

## 💳 **What You Can Do with Stripe MCP**

### **Available Commands:**

**1. Create Products:**
```
"Create a Stripe product for Starter Plan at $15/month"
```

**2. Create Prices:**
```
"Create a recurring price of $35/month for Professional plan"
```

**3. Create Checkout Sessions:**
```
"Create a Stripe checkout session for the Starter plan"
```

**4. Manage Subscriptions:**
```
"List all active subscriptions"
"Cancel subscription sub_1234567890"
```

**5. Test Webhooks:**
```
"Show me the latest webhook events"
"Test the checkout.session.completed webhook"
```

**6. View Customers:**
```
"List all customers"
"Show customer details for cus_1234567890"
```

**7. Create Test Payments:**
```
"Create a test payment for $15 USD"
```

---

## 🔐 **Stripe API Keys**

### **Test Mode Keys:**
```
Publishable Key: pk_test_51...  (Frontend - Safe to expose)
Secret Key: sk_test_51...       (Backend - Keep secret!)
```

### **Live Mode Keys:**
```
Publishable Key: pk_live_51...  (Frontend - Safe to expose)
Secret Key: sk_live_51...       (Backend - Keep secret!)
```

**Important:**
- ✅ Use **Test Mode** keys for development
- ❌ Never commit secret keys to Git
- ✅ Store in environment variables

---

## 📝 **Testing Subscription Flow with Stripe MCP**

### **Step-by-Step Test:**

**1. Create Product in Stripe:**
```
Me: "Create a Stripe product called 'Starter Plan' for restaurant subscriptions"

Claude (with Stripe MCP):
- Creates product in Stripe
- Returns product ID: prod_1234567890
```

**2. Create Price:**
```
Me: "Create a recurring monthly price of $15 for product prod_1234567890"

Claude:
- Creates price in Stripe
- Returns price ID: price_1234567890
```

**3. Create Checkout Session:**
```
Me: "Create a checkout session for price_1234567890 with success URL /success and cancel URL /cancel"

Claude:
- Creates checkout session
- Returns checkout URL: https://checkout.stripe.com/c/pay/cs_test_...
```

**4. Test Payment:**
```
- Open the checkout URL
- Use test card: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)
- Complete payment
```

**5. Verify Webhook:**
```
Me: "Show me the latest checkout.session.completed webhook"

Claude:
- Shows webhook payload
- Confirms subscription created
- Returns subscription ID
```

---

## 🧪 **Stripe Test Cards**

### **Successful Payments:**
```
Card Number: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
```

### **3D Secure Required:**
```
Card Number: 4000 0027 6000 3184
Expiry: 12/25
CVC: 123
(Will prompt for 3D Secure authentication)
```

### **Payment Fails:**
```
Card Number: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
(Card will be declined)
```

### **Insufficient Funds:**
```
Card Number: 4000 0000 0000 9995
Expiry: 12/25
CVC: 123
```

---

## 🔄 **Implementing Stripe Checkout**

### **Backend Endpoint (Example):**

Create a file: `src/api/create-checkout-session.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createCheckoutSession(req, res) {
  const { priceId, subscriptionId, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // 'price_1234567890'
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel`,
      client_reference_id: subscriptionId,
      metadata: {
        userId,
        subscriptionId,
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### **Frontend Integration:**

```typescript
// In SubscriptionCheckout.tsx

if (provider === 'stripe') {
  // Create checkout session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      priceId: 'price_1234567890', // From Stripe
      subscriptionId: subscription.id,
      userId: user.id,
    }),
  });

  const { url } = await response.json();
  
  // Redirect to Stripe Checkout
  window.location.href = url;
}
```

### **Webhook Handler:**

Create: `src/api/stripe-webhook.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Activate subscription
        await activateSubscription(
          session.metadata.subscriptionId,
          session.subscription
        );
        break;

      case 'customer.subscription.updated':
        // Handle subscription changes
        break;

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        break;
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}

async function activateSubscription(subscriptionId, stripeSubscriptionId) {
  // Update subscription status in database
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      stripe_subscription_id: stripeSubscriptionId,
      activated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionId);
}
```

---

## ✅ **Verification Checklist**

### **MCP Servers Setup:**
- [ ] Chrome DevTools MCP added to config
- [ ] Stripe MCP added to config
- [ ] Stripe API keys configured
- [ ] Claude Desktop restarted
- [ ] MCP servers showing in Claude

### **Stripe Integration:**
- [ ] Created products in Stripe
- [ ] Created prices in Stripe
- [ ] Tested checkout session creation
- [ ] Tested payment with test card
- [ ] Webhook endpoint created
- [ ] Webhook secret configured
- [ ] Tested webhook events

### **Subscription Flow:**
- [ ] User can select Stripe payment
- [ ] Checkout session created
- [ ] Redirects to Stripe
- [ ] Payment completes
- [ ] Webhook activates subscription
- [ ] User redirected to success page
- [ ] Subscription shows as active

---

## 🎯 **Example Commands to Try**

### **With Chrome DevTools MCP:**
```
"Open Chrome DevTools and show me the console"
"Inspect the payment gateway selector HTML"
"Show me any JavaScript errors on the checkout page"
"Monitor network requests when I submit the form"
```

### **With Stripe MCP:**
```
"Create a Stripe product for our Starter plan at $15/month"
"Show me all products in Stripe"
"Create a checkout session for the Starter plan"
"List all customers"
"Show me recent payment intents"
"Test the webhook for checkout completion"
```

---

## 🚨 **Troubleshooting**

### **MCP Server Not Loading:**
```
1. Check Claude Desktop config file path
2. Verify JSON syntax (no trailing commas)
3. Restart Claude Desktop
4. Check Claude logs for errors
```

### **Stripe MCP Issues:**
```
1. Verify STRIPE_SECRET_KEY is correct
2. Check it starts with sk_test_ (for test mode)
3. Ensure no extra spaces in the key
4. Test key in Stripe Dashboard
```

### **Stripe Checkout Issues:**
```
1. Check price ID is correct (price_...)
2. Verify success/cancel URLs are accessible
3. Test with Stripe test cards
4. Check webhook signature verification
```

---

## 📚 **Resources**

### **MCP Documentation:**
- Chrome DevTools MCP: https://github.com/modelcontextprotocol/servers
- Stripe MCP: https://github.com/stripe/mcp-server

### **Stripe Documentation:**
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks
- Test Cards: https://stripe.com/docs/testing

### **Your Project:**
- MCP Config: `mcp-config.json` (this directory)
- Checkout Page: `src/pages/SubscriptionCheckout.tsx`
- Restrictions: `src/lib/subscriptionRestrictions.ts`

---

**MCP servers configured! Now you can test Stripe subscriptions and debug with Chrome DevTools through Claude!** 🚀✅
