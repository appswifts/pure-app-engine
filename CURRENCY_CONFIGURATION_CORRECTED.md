# Currency Configuration - CORRECTED GUIDE

**Date:** November 10, 2025  
**Status:** ⚠️ CRITICAL UPDATE  
**Issue:** RWF is NOT a Stripe settlement currency

---

## 🚨 **IMPORTANT CORRECTION**

### **Previous Understanding (INCORRECT):**
- ❌ Thought RWF could be used for Stripe pricing
- ❌ Thought RWF could be used for Stripe payouts
- ❌ Assumed RWF support was full

### **Actual Reality (CORRECT):**
- ✅ **RWF is a presentment currency only** (customers can be charged)
- ❌ **RWF is NOT a settlement currency** (you cannot receive payouts)
- ⚠️ **Rwanda may not be fully supported for Stripe merchant accounts**

---

## 📊 **Understanding Stripe Currency Support**

###

 **Three Types of Currency in Stripe:**

1. **Customer's Payment Method Currency**
   - The currency of their credit card/bank account

2. **Presentment Currency** (What customer is charged)
   - 135+ currencies supported
   - ✅ **RWF IS included here**
   - Customer sees this amount

3. **Settlement Currency** (What merchant receives)
   - Limited currencies supported
   - ❌ **RWF is NOT included**
   - You receive payouts in this currency

**The Problem:** You can charge customers in RWF, but **cannot receive payouts in RWF**.

---

## ✅ **Recommended Solutions**

### **Solution 1: USD Pricing with RWF Display** (RECOMMENDED)

**Best for:** International reach + local transparency

**How it works:**
```
1. Set all prices in USD in database
2. Stripe processes payments in USD
3. You receive USD payouts
4. Display RWF equivalent to customers
5. Use live exchange rates for accuracy
```

**Pros:**
- ✅ Works with Stripe immediately
- ✅ No currency conversion fees from Stripe
- ✅ Customers see RWF prices
- ✅ International customers comfortable with USD
- ✅ Simple implementation

**Cons:**
- ⚠️ Exchange rate fluctuations
- ⚠️ Customers charged in USD (may have forex fees from their bank)

**Implementation:**
```sql
-- Convert your current RWF prices to USD
-- Assuming exchange rate: 1 USD = 1000 RWF

UPDATE subscription_products
SET 
  currency = 'USD',
  price = CASE 
    WHEN name = 'Starter Plan' THEN 15.00
    WHEN name = 'Professional Plan' THEN 35.00
    WHEN name = 'Enterprise Plan' THEN 75.00
  END,
  sign_up_fee = CASE
    WHEN name = 'Enterprise Plan' THEN 10.00
    ELSE 0
  END;
```

**Frontend Display:**
```typescript
// Show both currencies
const EXCHANGE_RATE = 1000; // Update with live rate

const formatPrice = (usdPrice: number) => {
  const rwfPrice = Math.round(usdPrice * EXCHANGE_RATE);
  return {
    display: `${rwfPrice.toLocaleString()} RWF`,
    subtitle: `(~$${usdPrice.toFixed(2)} USD)`,
    disclaimer: '* Charged in USD, RWF rate is approximate'
  };
};

// Shows: "15,000 RWF (~$15.00 USD)"
//        "* Charged in USD, RWF rate is approximate"
```

---

### **Solution 2: Dual Gateway System** (BEST FOR RWANDA)

**Best for:** Local customers paying in RWF + international customers

**How it works:**
```
1. Stripe for international customers (USD/EUR/GBP)
2. Manual Payment for local RWF payments (mobile money, bank transfer)
```

**Configuration:**

**Stripe Gateway:**
- Currency: USD
- For: International credit/debit cards
- Products: USD pricing

**Manual Payment Gateway:**
- Currency: RWF
- For: Local customers
- Methods: MTN Mobile Money, Airtel Money, Bank Transfer
- Products: RWF pricing

**Database Schema:**
```sql
-- Keep dual currency support
-- Option 1: Separate products per currency
INSERT INTO subscription_products (name, price, currency, payment_gateway) VALUES
  ('Starter Plan (International)', 15.00, 'USD', 'stripe'),
  ('Starter Plan (Rwanda)', 15000, 'RWF', 'manual');

-- Option 2: Use regional_pricing table
INSERT INTO regional_pricing (product_id, currency, price, region) VALUES
  ('starter-plan-id', 'USD', 15.00, 'international'),
  ('starter-plan-id', 'RWF', 15000, 'RW');
```

**Pros:**
- ✅ Local customers pay in RWF (no forex fees)
- ✅ Accept mobile money (MTN, Airtel - very popular in Rwanda)
- ✅ International customers pay in USD via Stripe
- ✅ True local currency support

**Cons:**
- ⚠️ Manual payment requires admin approval
- ⚠️ More complex setup
- ⚠️ Need to manage two pricing structures

---

### **Solution 3: Use Flutterwave or Local Gateway**

**Best for:** Full RWF automation with card payments

**Flutterwave** supports:
- ✅ RWF payments
- ✅ Mobile Money (MTN, Airtel)
- ✅ Card payments in RWF
- ✅ Bank transfers
- ✅ Settlement in RWF

**Integration:**
```typescript
// Flutterwave integration example
import Flutterwave from 'flutterwave-node-v3';

const flw = new Flutterwave(PUBLIC_KEY, SECRET_KEY);

const payload = {
  amount: 15000,
  currency: 'RWF',
  email: 'customer@example.com',
  tx_ref: 'subscription-' + Date.now(),
  redirect_url: 'https://yoursite.com/payment-callback'
};

// Initiate payment
await flw.Charge.card(payload);
```

**Pros:**
- ✅ Full RWF support
- ✅ Mobile money integration
- ✅ Automated processing
- ✅ Local to East Africa

**Cons:**
- ⚠️ Additional integration work
- ⚠️ Different API from Stripe
- ⚠️ May have different fee structure

---

## 💰 **Recommended Pricing Strategy**

### **For Your Subscription Plans:**

**Current RWF Prices → Convert to USD:**

| Plan | Current RWF | USD Equivalent | Stripe Amount |
|------|-------------|----------------|---------------|
| Starter | 15,000 RWF | $15.00 USD | 1500 (cents) |
| Professional | 35,000 RWF | $35.00 USD | 3500 (cents) |
| Enterprise | 75,000 RWF | $75.00 USD | 7500 (cents) |
| Enterprise Setup | 10,000 RWF | $10.00 USD | 1000 (cents) |

**Exchange Rate Used:** 1 USD = 1,000 RWF (approximate)

### **Display Strategy:**

**Option A: Primary RWF, Secondary USD**
```
Starter Plan
15,000 RWF per month
(~$15 USD - charged in USD)
```

**Option B: Primary USD, Secondary RWF**
```
Starter Plan
$15 USD per month
(~15,000 RWF)
```

**Option C: Let User Choose**
```
[International Payment] $15 USD via Credit Card
[Rwanda Payment] 15,000 RWF via Mobile Money
```

---

## 🔧 **Implementation Steps**

### **Step 1: Update Database to USD**

```sql
-- Backup current prices
CREATE TABLE subscription_products_backup AS 
SELECT * FROM subscription_products;

-- Convert to USD (1 USD = 1000 RWF)
UPDATE subscription_products
SET 
  currency = 'USD',
  price = ROUND(price::numeric / 1000, 2),
  sign_up_fee = ROUND(sign_up_fee::numeric / 1000, 2)
WHERE currency = 'RWF';

-- Verify conversion
SELECT 
  name,
  price as usd_price,
  currency,
  (price * 1000)::integer as display_rwf
FROM subscription_products;
```

### **Step 2: Update Stripe Configuration**

```sql
-- Configure Stripe for USD settlement
UPDATE payment_gateways
SET 
  config = config || jsonb_build_object(
    'default_currency', 'USD',
    'display_currency', 'RWF',
    'exchange_rate_source', 'live_api'
  ),
  supported_currencies = to_jsonb(ARRAY['USD', 'EUR', 'GBP', 'CAD']),
  description = 'International credit/debit card payments in USD (displays RWF equivalent)'
WHERE provider = 'stripe';
```

### **Step 3: Update Manual Payment for RWF**

```sql
-- Configure Manual Payment for local RWF
UPDATE payment_gateways
SET 
  config = config || jsonb_build_object(
    'currency', 'RWF',
    'payment_instructions', 'Pay via Mobile Money or Bank Transfer in RWF:

MTN Mobile Money: 078-XXX-XXXX
Airtel Money: 073-XXX-XXXX
Bank: Bank of Kigali, Account: XXXXX

After payment, upload proof and wait for approval.',
    'mobile_money_providers', ARRAY['MTN', 'Airtel Money'],
    'require_proof', true,
    'auto_approve', false
  ),
  supported_currencies = to_jsonb(ARRAY['RWF']),
  description = 'Local Rwanda payments via Mobile Money or Bank Transfer in RWF'
WHERE provider = 'manual';
```

### **Step 4: Add Exchange Rate Service**

```typescript
// src/lib/exchangeRate.ts
export class ExchangeRateService {
  private static CACHE_KEY = 'usd_rwf_rate';
  private static CACHE_DURATION = 3600000; // 1 hour

  static async getUSDtoRWF(): Promise<number> {
    // Check cache first
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        return rate;
      }
    }

    // Fetch live rate
    try {
      const response = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      const data = await response.json();
      const rate = data.rates.RWF;

      // Cache the rate
      localStorage.setItem(
        this.CACHE_KEY,
        JSON.stringify({ rate, timestamp: Date.now() })
      );

      return rate;
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      return 1000; // Fallback rate
    }
  }

  static formatPrice(usdAmount: number, rate?: number): string {
    const exchangeRate = rate || 1000;
    const rwfAmount = Math.round(usdAmount * exchangeRate);
    return `${rwfAmount.toLocaleString('en-RW')} RWF`;
  }
}
```

### **Step 5: Update Frontend Price Display**

```typescript
// src/components/PriceDisplay.tsx
import { ExchangeRateService } from '@/lib/exchangeRate';

export const PriceDisplay = ({ usdPrice }: { usdPrice: number }) => {
  const [rwfPrice, setRwfPrice] = useState<string>('');
  const [rate, setRate] = useState<number>(1000);

  useEffect(() => {
    ExchangeRateService.getUSDtoRWF().then(r => {
      setRate(r);
      setRwfPrice(ExchangeRateService.formatPrice(usdPrice, r));
    });
  }, [usdPrice]);

  return (
    <div className="price-display">
      <div className="primary-price">{rwfPrice}</div>
      <div className="secondary-price">
        (~${usdPrice.toFixed(2)} USD)
      </div>
      <div className="price-note">
        * You will be charged in USD. RWF amount is approximate based on current exchange rate.
      </div>
    </div>
  );
};
```

---

## 📋 **Summary of Changes Needed**

### **Database:**
- [ ] Convert subscription_products from RWF to USD
- [ ] Update Stripe gateway config to USD
- [ ] Keep Manual Payment gateway as RWF
- [ ] Test all queries return correct currencies

### **Backend:**
- [ ] Stripe integration uses USD amounts
- [ ] Manual payment handles RWF amounts
- [ ] Add exchange rate fetching service

### **Frontend:**
- [ ] Display RWF prices to users
- [ ] Show USD equivalent with disclaimer
- [ ] Add currency selector (Stripe USD vs Manual RWF)
- [ ] Update checkout flow for dual currency

### **Testing:**
- [ ] Test Stripe payment with USD
- [ ] Verify RWF display is accurate
- [ ] Test manual payment with RWF
- [ ] Check exchange rate updates

---

## ✅ **My Recommendation**

**For Your Business (Pure App Engine):**

**Use Solution 2: Dual Gateway System**

**Why:**
1. Your target market is Rwanda (local currency important)
2. Mobile Money is dominant in Rwanda
3. Local customers avoid forex fees
4. International expansion possible with Stripe/USD

**Configuration:**
```
Gateway 1: Manual Payment
- Currency: RWF
- Methods: MTN Money, Airtel Money, Bank Transfer
- For: Local Rwandan customers
- Prices: 15,000 / 35,000 / 75,000 RWF

Gateway 2: Stripe
- Currency: USD
- Methods: Credit/Debit cards
- For: International customers
- Prices: $15 / $35 / $75 USD
```

**Customer Experience:**
```
Checkout Page:
┌────────────────────────────────────┐
│ Starter Plan                       │
│                                    │
│ Choose Payment Method:             │
│                                    │
│ ○ Pay with Mobile Money (RWF)     │
│   15,000 RWF                       │
│   • MTN Mobile Money              │
│   • Airtel Money                  │
│   • Bank Transfer                 │
│                                    │
│ ○ Pay with Credit Card (USD)      │
│   $15 USD (~15,000 RWF)           │
│   • Visa, Mastercard, Amex       │
│   • Instant activation            │
└────────────────────────────────────┘
```

---

## 🎯 **Action Plan**

**Immediate (This Week):**
1. Update database: Convert to USD
2. Test Stripe with USD amounts
3. Keep Manual Payment for RWF
4. Add price display logic

**Short Term (Next Week):**
1. Add exchange rate service
2. Update checkout UI
3. Test full payment flows
4. Update documentation

**Optional (Future):**
1. Integrate Flutterwave for automated RWF
2. Add more local payment methods
3. Consider regional pricing

---

**I apologize for the initial confusion. Thank you for verifying with Perplexity! This corrected guide should help you set up payments properly.** 🙏
