# ⚡ Paddle Integration - Quick Start Checklist

## 🎯 30-Minute Setup Guide

Want to get started with Paddle TODAY? Follow this checklist!

---

## ✅ Step 1: Sign Up (5 minutes)

1. Go to https://www.paddle.com
2. Click "Start Free Trial"
3. Choose **"Paddle Billing"** (not Classic)
4. Fill in your business details:
   - Business name: MenuForest / Pure App Engine
   - Country: Rwanda
   - Email: Your business email
5. Verify email
6. Complete business profile

**✅ Done!** You now have a Paddle Sandbox account

---

## ✅ Step 2: Create Products (10 minutes)

In your Paddle dashboard:

### Create Product:
1. Go to **Products** → **Add Product**
2. Product name: "MenuForest Subscription"
3. Description: "Digital menu management platform"
4. Tax category: "Software as a Service (SaaS)"

### Create Prices (one for each plan):

**Starter Plan:**
- Price ID: (Paddle auto-generates: `pri_xxx`)
- Amount: 15,000 RWF/month
- Billing cycle: Monthly
- Trial: 14 days

**Professional Plan:**
- Price ID: (Paddle auto-generates: `pri_xxx`)  
- Amount: 25,000 RWF/month
- Billing cycle: Monthly
- Trial: 14 days

**Enterprise Plan:**
- Price ID: (Paddle auto-generates: `pri_xxx`)
- Amount: 40,000 RWF/month
- Billing cycle: Monthly
- Trial: 14 days

**📝 Copy all Price IDs** - you'll need them!

---

## ✅ Step 3: Get API Keys (2 minutes)

1. Go to **Developer Tools** → **Authentication**
2. Copy these keys:
   - ✅ **Client-side token** (starts with `live_`)
   - ✅ **API Key** (for server-side)
   - ✅ **Webhook Secret** (for verifying webhooks)

**⚠️ Keep these secret!** Add them to your `.env.local` file

---

## ✅ Step 4: Install Dependencies (1 minute)

```bash
cd c:\Users\FH\Desktop\blank-project\pure-app-engine

# Install Paddle SDK (backend)
npm install @paddle/paddle-node-sdk

# Install Paddle.js (frontend)  
npm install @paddle/paddle-js
```

---

## ✅ Step 5: Environment Variables (2 minutes)

Create/update `.env.local`:

```env
# Paddle Configuration
VITE_PADDLE_ENV=sandbox
VITE_PADDLE_CLIENT_TOKEN=test_xxxxxxxxxxxxx
VITE_PADDLE_API_KEY=xxxxxxxxxxxxx
VITE_PADDLE_WEBHOOK_SECRET=xxxxxxxxxxxxx

# Your Price IDs from Step 2
VITE_PADDLE_STARTER_PRICE_ID=pri_xxxxx
VITE_PADDLE_PROFESSIONAL_PRICE_ID=pri_xxxxx
VITE_PADDLE_ENTERPRISE_PRICE_ID=pri_xxxxx
```

**✅ Done!** Basic setup complete

---

## ✅ Step 6: Database Migration (5 minutes)

I'll create the migration for you. Just tell me and I'll:

```sql
-- Add Paddle columns to your existing tables
ALTER TABLE subscriptions 
  ADD COLUMN paddle_subscription_id TEXT,
  ADD COLUMN paddle_customer_id TEXT;

-- Add Price IDs to plans
ALTER TABLE subscription_plans
  ADD COLUMN paddle_price_id TEXT;
```

**Want me to do this now?** Just say "yes, run the migration"

---

## ✅ Step 7: Test in Sandbox (5 minutes)

Use Paddle's test card:
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVV: 123
```

Test these scenarios:
1. ✅ Subscribe to Starter plan
2. ✅ Upgrade to Professional
3. ✅ Cancel subscription
4. ✅ Failed payment (use card 4000 0000 0000 0002)

---

## 🎯 What I'll Build For You

Once you complete Steps 1-5, I'll implement:

### Week 1:
- ✅ Day 1-2: Database migration
- ✅ Day 3-4: Paddle service + checkout component
- ✅ Day 5-6: Webhook handler
- ✅ Day 7: Testing

### Week 2:
- ✅ Day 8-9: Update all subscription flows
- ✅ Day 10-11: Remove manual payment files
- ✅ Day 12-13: Production deployment
- ✅ Day 14: Monitor & support

---

## 📋 Pre-Implementation Checklist

Before I start coding, make sure you have:

- [ ] Paddle account created (sandbox)
- [ ] Products & prices created in Paddle
- [ ] API keys copied
- [ ] Environment variables added
- [ ] NPM packages installed
- [ ] Business verified in Paddle (for production)
- [ ] Bank account connected (for payouts)

**Ready?** Let me know and I'll start implementing! 🚀

---

## 🚨 Important Notes

### Rwanda Support:
✅ **Paddle works in Rwanda!**
- Accepts international cards
- Supports mobile money (via Flutterwave integration)
- Handles local taxes
- Multi-currency support (RWF, USD, EUR, etc.)

### Testing:
- Use **Sandbox mode** for all testing
- Never use real cards in sandbox
- Test all scenarios before production
- Verify webhooks work correctly

### Production:
- Complete business verification
- Connect bank account
- Update DNS for custom domain (if needed)
- Switch environment to `production`
- Monitor webhooks closely first week

---

## 💰 Pricing Reminder

**Paddle Fee:** 5% + $0.50 per transaction

**Example:**
- Starter plan: 15,000 RWF = ~$12 USD
- Paddle fee: 5% = $0.60 + $0.50 = $1.10
- You receive: ~$10.90

**Worth it?** YES!
- No admin time
- No fraud risk  
- Instant activation
- Professional experience
- Tax compliance included

---

## 🎉 Ready to Start?

**Option 1: Let me implement everything**
Just complete Steps 1-5, then say:
> "I've completed the setup, please implement Paddle"

**Option 2: Guided implementation**
We can do it together step-by-step. Say:
> "Let's implement Paddle together"

**Option 3: Learn first**
Want to understand more before starting? Say:
> "Explain how Paddle works in more detail"

---

## 🚀 Next Step

**Complete Steps 1-5 above (takes 30 minutes), then let me know!**

I'm ready to build the entire integration for you! 💪

---

**Questions?** Just ask! I'm here to help. 😊
