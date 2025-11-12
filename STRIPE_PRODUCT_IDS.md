# Stripe Product and Price IDs

**Created:** November 10, 2025 at 7:53 PM  
**Status:** ✅ Active in Stripe Test Mode

---

## 📦 **Products and Prices**

### **1. Starter Plan**
```
Product ID:  prod_TOmqV2Qr3nRGu1
Price ID:    price_1SRzHGHJDb8ZM1IXWuXxc1Ei
Amount:      $15.00 USD / month
Description: Restaurant subscription - Starter tier
             • 50 menu items
             • 10 tables
             • Analytics
             • WhatsApp integration
```

### **2. Professional Plan**
```
Product ID:  prod_TOmrrXQ7OkPJlk
Price ID:    price_1SRzHSHJDb8ZM1IXg2BiS1yH
Amount:      $35.00 USD / month
Description: Restaurant subscription - Professional tier
             • 200 menu items
             • 50 tables
             • Multiple restaurants
             • Analytics
             • All features
```

### **3. Enterprise Plan**
```
Product ID:  prod_TOmr9QYBmi19Dl
Price ID:    price_1SRzHdHJDb8ZM1IXS2zrAuGe
Amount:      $75.00 USD / month
Description: Restaurant subscription - Enterprise tier
             • Unlimited menu items
             • Unlimited tables
             • Custom domain
             • Multiple restaurants
             • Priority support
             • All premium features
```

---

## 🔄 **Next Steps:**

### **1. Update Database with Stripe Price IDs**

Run these SQL commands in Supabase:

```sql
-- Update Starter Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHGHJDb8ZM1IXWuXxc1Ei'
WHERE name ILIKE '%starter%';

-- Update Professional Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHSHJDb8ZM1IXg2BiS1yH'
WHERE name ILIKE '%professional%';

-- Update Enterprise Plan
UPDATE subscription_plans 
SET stripe_price_id = 'price_1SRzHdHJDb8ZM1IXS2zrAuGe'
WHERE name ILIKE '%enterprise%';

-- Verify updates
SELECT id, name, price, stripe_price_id 
FROM subscription_plans 
ORDER BY price ASC;
```

### **2. Create Stripe Checkout Sessions**

Use these price IDs when creating checkout sessions:

```typescript
// Example: Create checkout session for Starter Plan
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: 'price_1SRzHGHJDb8ZM1IXWuXxc1Ei', // Starter
    quantity: 1,
  }],
  success_url: 'https://yourapp.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://yourapp.com/cancel',
});
```

### **3. Test Payment Flow**

Test cards:
- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0027 6000 3184`
- Decline: `4000 0000 0000 0002`

---

## 🔗 **View in Stripe Dashboard**

**Products:** https://dashboard.stripe.com/test/products  
**Prices:** https://dashboard.stripe.com/test/prices  
**Test Payments:** https://dashboard.stripe.com/test/payments  

---

## 📋 **Quick Copy-Paste**

### **Price IDs Only:**
```
Starter:       price_1SRzHGHJDb8ZM1IXWuXxc1Ei
Professional:  price_1SRzHSHJDb8ZM1IXg2BiS1yH
Enterprise:    price_1SRzHdHJDb8ZM1IXS2zrAuGe
```

### **Product IDs Only:**
```
Starter:       prod_TOmqV2Qr3nRGu1
Professional:  prod_TOmrrXQ7OkPJlk
Enterprise:    prod_TOmr9QYBmi19Dl
```

---

## ✅ **Verification Checklist**

- [x] Starter Plan created ($15/month)
- [x] Professional Plan created ($35/month)
- [x] Enterprise Plan created ($75/month)
- [ ] Database updated with price IDs
- [ ] Checkout session endpoint created
- [ ] Webhook handler configured
- [ ] Test payment completed

---

**All products are live in Stripe Test Mode and ready to use!** 🚀
