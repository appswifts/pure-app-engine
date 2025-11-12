# 🚀 Apply Manual Payment Migration - Simple Instructions

## Quick Copy-Paste Method (Recommended)

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "+ New Query"

### Step 2: Copy & Paste SQL
Open this file and copy ALL contents:
```
c:\Users\FH\Desktop\blank-project\pure-app-engine\supabase\migrations\create_manual_payment_tables.sql
```

Paste into Supabase SQL Editor

### Step 3: Run
Click "Run" button (or press Ctrl+Enter)

✅ **Done!** Tables created successfully!

---

## Verify Tables Created

Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('manual_payments', 'manual_subscriptions');
```

Expected result:
- manual_payments
- manual_subscriptions

---

## Test Payment System

1. Start dev server:
```bash
npm run dev
```

2. Open browser console (F12)

3. Look for this message:
```
✓ Payment system initialized: 4/4 gateways enabled
Enabled gateways: Stripe, PayPal, Flutterwave, Manual Payment
```

4. Test creating a manual payment:
```javascript
// In browser console
const { paymentService } = await import('/src/lib/payments/index.ts');

const payment = await paymentService.createPayment(
  'manual',
  29000,
  'RWF',
  {
    paymentMethod: 'bank_transfer',
    customerEmail: 'test@example.com',
    customerName: 'Test User'
  }
);

console.log(payment);
// Should show payment instructions!
```

---

## ✅ That's It!

Manual Payment Gateway is now fully operational!

**Next:** Check the refactored admin dashboard to manage manual payments.
