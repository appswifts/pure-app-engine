# Stripe CLI Quick Reference

**Setup Date:** November 10, 2025  
**Status:** Ready for Use

---

## 🚀 **Installation Complete**

Run this to set up everything:
```powershell
.\setup-stripe.ps1
```

---

## 📋 **Essential Commands**

### **View Your Products:**
```bash
stripe products list
```

### **View Your Prices:**
```bash
stripe prices list
```

### **Listen to Webhooks (Development):**
```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe
```

### **View Recent Events:**
```bash
stripe events list --limit 10
```

### **Create Test Checkout Session:**
```bash
stripe checkout sessions create \
  --mode=subscription \
  --line-items[0][price]=price_XXXXX \
  --line-items[0][quantity]=1 \
  --success-url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}" \
  --cancel-url="http://localhost:5173/cancel"
```

---

## 🧪 **Test Webhooks**

### **Trigger Checkout Completed:**
```bash
stripe trigger checkout.session.completed
```

### **Trigger Payment Success:**
```bash
stripe trigger payment_intent.succeeded
```

### **Trigger Subscription Created:**
```bash
stripe trigger customer.subscription.created
```

### **Trigger Subscription Updated:**
```bash
stripe trigger customer.subscription.updated
```

### **Trigger Subscription Canceled:**
```bash
stripe trigger customer.subscription.deleted
```

---

## 💳 **Test Cards**

### **Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123
ZIP: 12345
```

### **3D Secure Required:**
```
Card: 4000 0027 6000 3184
Expiry: 12/25
CVC: 123
```

### **Payment Declines:**
```
Card: 4000 0000 0000 0002
Expiry: 12/25
CVC: 123
```

### **Insufficient Funds:**
```
Card: 4000 0000 0000 9995
Expiry: 12/25
CVC: 123
```

---

## 🔧 **Development Workflow**

### **Terminal 1: Dev Server**
```bash
cd c:\Users\FH\Desktop\blank-project\pure-app-engine
npm run dev
```

### **Terminal 2: Stripe Webhooks**
```bash
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Save the webhook secret shown (whsec_xxx)
```

### **Terminal 3: Stripe Commands**
```bash
# View products
stripe products list

# View subscriptions
stripe subscriptions list

# View customers
stripe customers list

# View latest events
stripe events list --limit 5
```

---

## 📊 **View Data**

### **List All Products:**
```bash
stripe products list --limit 10
```

### **List All Prices:**
```bash
stripe prices list --limit 10
```

### **List All Customers:**
```bash
stripe customers list --limit 10
```

### **List All Subscriptions:**
```bash
stripe subscriptions list --limit 10
```

### **List All Checkout Sessions:**
```bash
stripe checkout sessions list --limit 10
```

### **View Specific Item:**
```bash
stripe products retrieve prod_xxxxx
stripe prices retrieve price_xxxxx
stripe customers retrieve cus_xxxxx
stripe subscriptions retrieve sub_xxxxx
```

---

## 🎯 **Common Tasks**

### **Create a New Product:**
```bash
stripe products create \
  --name="My Product" \
  --description="Product description"
```

### **Create a New Price:**
```bash
stripe prices create \
  --product=prod_xxxxx \
  --unit-amount=1500 \
  --currency=usd \
  --recurring[interval]=month
```

### **Cancel a Subscription:**
```bash
stripe subscriptions cancel sub_xxxxx
```

### **Update a Product:**
```bash
stripe products update prod_xxxxx \
  --name="New Name" \
  --description="New description"
```

---

## 📝 **Your Product IDs**

After running `setup-stripe.ps1`, check `STRIPE_IDS.txt` for:
- Starter Plan Product & Price IDs
- Professional Plan Product & Price IDs
- Enterprise Plan Product & Price IDs

---

## 🔐 **API Keys**

### **View Your Keys:**
Visit: https://dashboard.stripe.com/test/apikeys

### **Test Mode:**
- Publishable Key: `pk_test_...` (Frontend)
- Secret Key: `sk_test_...` (Backend)

### **Webhook Secret:**
Get from running:
```bash
stripe listen --print-secret
```

Or from webhook listener output:
```
Ready! Your webhook signing secret is whsec_xxxxx
```

---

## 🌐 **Useful Links**

- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Test Data:** https://dashboard.stripe.com/test/payments
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **API Logs:** https://dashboard.stripe.com/test/logs
- **Documentation:** https://stripe.com/docs

---

## 🚨 **Troubleshooting**

### **Command Not Found:**
```bash
# Reload your shell or restart terminal
# Or add Stripe to PATH manually
```

### **Webhook Not Receiving Events:**
```bash
# Make sure your dev server is running
# Check the URL matches: localhost:5173/api/webhooks/stripe
# Verify endpoint exists in your code
```

### **Authentication Error:**
```bash
# Re-login to Stripe
stripe login
```

### **View Stripe Config:**
```bash
stripe config --list
```

---

**Quick Start:**
1. Run `.\setup-stripe.ps1`
2. In Terminal: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`
3. In Another Terminal: `npm run dev`
4. Test your subscription flow!

🎉 **You're all set!**
