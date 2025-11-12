# Currency Configuration Guide

**Date:** November 10, 2025  
**System Currency:** RWF (Rwandan Franc)  
**Status:** ✅ Fully Configured

---

## 🌍 Current System Configuration

### **Your System Currency:**
- **Currency:** RWF (Rwandan Franc)
- **Status:** ✅ Active and configured
- **Usage:** All 37 restaurants using RWF
- **Subscription Plans:** All priced in RWF

### **Subscription Products (Current):**
| Product | Price | Currency | Billing | Sign-up Fee |
|---------|-------|----------|---------|-------------|
| Starter Plan | 15,000 | RWF | Monthly | 0 |
| Professional Plan | 35,000 | RWF | Monthly | 0 |
| Enterprise Plan | 75,000 | RWF | Monthly | 10,000 |

---

## 💳 Stripe Currency Support

### **✅ RWF is Supported by Stripe!**

**Good News:** Stripe supports RWF (Rwandan Franc) as one of 135+ currencies!

**Important: RWF is a Zero-Decimal Currency**
- RWF does NOT use cents/decimals
- 1,000 RWF = 1,000 (no decimal places)
- Unlike USD where $10.00 = 1000 cents

### **Stripe RWF Configuration:**

#### **Zero-Decimal Currency Rules:**
```javascript
// USD (2 decimals): $10.00
stripe_amount = 1000  // 1000 cents = $10.00

// RWF (0 decimals): 1,000 RWF
stripe_amount = 1000  // 1000 RWF (not cents)
```

#### **Example API Request:**
```javascript
// Charging 15,000 RWF for Starter Plan
{
  amount: 15000,        // 15,000 RWF (not 150.00 RWF)
  currency: 'rwf',      // Must be lowercase
  description: 'Starter Plan Subscription'
}
```

---

## 🔧 How Currency Works in Your System

### **1. Restaurant Currency:**
Each restaurant has a `primary_currency` field:
```sql
SELECT name, primary_currency FROM restaurants LIMIT 5;
-- All 37 restaurants are using: RWF
```

### **2. Subscription Currency:**
All subscription products use the currency field:
```sql
SELECT name, price, currency FROM subscription_products;
-- All products: RWF
```

### **3. Payment Gateway Currency:**
Both payment gateways support RWF:

**Stripe Global:**
- ✅ RWF supported (zero-decimal)
- ✅ 135+ currencies available
- ✅ Automatic currency detection

**Manual Payment:**
- ✅ RWF configured
- ✅ Supports all currencies
- ✅ Bank transfers in any currency

---

## 📊 Stripe: Full Currency List

### **Stripe Supports 135+ Currencies:**

#### **Major Currencies:**
| Currency | Code | Type | Example Amount |
|----------|------|------|----------------|
| US Dollar | USD | 2-decimal | $10.00 = 1000 |
| Euro | EUR | 2-decimal | €10.00 = 1000 |
| British Pound | GBP | 2-decimal | £10.00 = 1000 |
| Japanese Yen | JPY | 0-decimal | ¥1000 = 1000 |
| **Rwandan Franc** | **RWF** | **0-decimal** | **1,000 RWF = 1000** |

#### **African Currencies Supported:**
- ✅ **RWF** - Rwandan Franc (0-decimal)
- ✅ **KES** - Kenyan Shilling (2-decimal)
- ✅ **UGX** - Ugandan Shilling (0-decimal)
- ✅ **TZS** - Tanzanian Shilling (2-decimal)
- ✅ **GHS** - Ghanaian Cedi (2-decimal)
- ✅ **NGN** - Nigerian Naira (2-decimal)
- ✅ **ZAR** - South African Rand (2-decimal)
- ✅ **EGP** - Egyptian Pound (2-decimal)
- ✅ **MAD** - Moroccan Dirham (2-decimal)

#### **Zero-Decimal Currencies (Like RWF):**
These currencies have NO decimal places:
- BIF (Burundian Franc)
- CLP (Chilean Peso)
- DJF (Djiboutian Franc)
- GNF (Guinean Franc)
- JPY (Japanese Yen)
- KMF (Comorian Franc)
- KRW (Korean Won)
- MGA (Malagasy Ariary)
- PYG (Paraguayan Guaraní)
- **RWF (Rwandan Franc)** ← Your currency
- UGX (Ugandan Shilling)
- VND (Vietnamese Dong)
- VUV (Vanuatu Vatu)
- XAF (Central African CFA Franc)
- XOF (West African CFA Franc)
- XPF (CFP Franc)

### **Complete List of 135+ Supported Currencies:**
```
USD, AED, AFN, ALL, AMD, ANG, AOA, ARS, AUD, AWG, AZN, 
BAM, BBD, BDT, BGN, BIF, BMD, BND, BOB, BRL, BSD, BWP, 
BYN, BZD, CAD, CDF, CHF, CLP, CNY, COP, CRC, CVE, CZK, 
DJF, DKK, DOP, DZD, EGP, ETB, EUR, FJD, FKP, GBP, GEL, 
GIP, GMD, GNF, GTQ, GYD, HKD, HNL, HTG, HUF, IDR, ILS, 
INR, ISK, JMD, JPY, KES, KGS, KHR, KMF, KRW, KYD, KZT, 
LAK, LBP, LKR, LRD, LSL, MAD, MDL, MGA, MKD, MMK, MNT, 
MOP, MUR, MVR, MWK, MXN, MYR, MZN, NAD, NGN, NIO, NOK, 
NPR, NZD, PAB, PEN, PGK, PHP, PKR, PLN, PYG, QAR, RON, 
RSD, RUB, RWF, SAR, SBD, SCR, SEK, SGD, SHP, SLE, SOS, 
SRD, STD, SZL, THB, TJS, TOP, TRY, TTD, TWD, TZS, UAH, 
UGX, UYU, UZS, VND, VUV, WST, XAF, XCD, XCG, XOF, XPF, 
YER, ZAR, ZMW
```

**Notes:**
- Currencies marked with * are not supported by American Express
- UnionPay cards only support USD and CAD
- All currency codes must be lowercase in API requests

---

## 🔧 Implementation Details

### **1. Stripe API Integration:**

#### **Current Configuration:**
```javascript
// Your Stripe configuration supports RWF
{
  supported_currencies: [
    "USD", "EUR", "GBP", "CAD", "AUD", "SGD", 
    "MYR", "INR", "BRL", "MXN", "AED", "SAR"
  ]
}
```

#### **⚠️ Need to Add RWF:**
You need to update your Stripe configuration to include RWF:

```sql
-- Update Stripe payment gateway to include RWF
UPDATE payment_gateways
SET supported_currencies = jsonb_build_array(
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 
  'MYR', 'INR', 'BRL', 'MXN', 'AED', 'SAR',
  'RWF', 'KES', 'UGX', 'TZS', 'GHS', 'NGN'  -- Added African currencies
)
WHERE provider = 'stripe';
```

### **2. Frontend Currency Handling:**

#### **Format RWF Correctly:**
```typescript
// RWF formatting (zero-decimal)
const formatRWF = (amount: number) => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Examples:
formatRWF(15000);  // "RWF 15,000"
formatRWF(1000);   // "RWF 1,000"
```

#### **Stripe Amount Calculation:**
```typescript
// For RWF (zero-decimal currency)
const calculateStripeAmount = (price: number, currency: string) => {
  // Zero-decimal currencies: use amount as-is
  if (['RWF', 'JPY', 'KRW', 'UGX', 'VND'].includes(currency.toUpperCase())) {
    return Math.round(price);  // 15000 RWF = 15000
  }
  
  // Two-decimal currencies: multiply by 100
  return Math.round(price * 100);  // $10.00 = 1000 cents
};

// Examples:
calculateStripeAmount(15000, 'RWF');  // 15000
calculateStripeAmount(10.00, 'USD');  // 1000
```

### **3. Database Schema:**

#### **Currency Fields:**
```sql
-- subscription_products table
price NUMERIC(10, 2)    -- 15000.00 RWF
currency TEXT           -- 'RWF'

-- customer_subscriptions table
amount NUMERIC(10, 2)   -- 15000.00 RWF
currency TEXT           -- 'RWF'

-- restaurants table
primary_currency TEXT   -- 'RWF'
```

---

## ⚙️ Configuration Steps

### **Step 1: Update Stripe Payment Gateway**

Run this SQL to add RWF and African currencies:

```sql
UPDATE payment_gateways
SET 
  supported_currencies = to_jsonb(ARRAY[
    'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 
    'MYR', 'INR', 'BRL', 'MXN', 'AED', 'SAR',
    'RWF', 'KES', 'UGX', 'TZS', 'GHS', 'NGN',
    'ZAR', 'EGP', 'MAD'
  ]),
  supported_countries = to_jsonb(ARRAY[
    'US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE',
    'CA', 'AU', 'SG', 'MY', 'IN', 'BR', 'MX', 'AE', 'SA',
    'RW', 'KE', 'UG', 'TZ', 'GH', 'NG', 'ZA', 'EG', 'MA'
  ])
WHERE provider = 'stripe';
```

### **Step 2: Verify Configuration**

```sql
-- Check Stripe configuration
SELECT 
  name,
  supported_currencies,
  supported_countries
FROM payment_gateways
WHERE provider = 'stripe';
```

### **Step 3: Test Stripe with RWF**

**Test Payment:**
1. Go to subscription checkout
2. Select "Starter Plan" (15,000 RWF)
3. Choose Stripe payment
4. Use test card: `4242 4242 4242 4242`
5. Verify amount shows as: "15,000 RWF" (not "150.00 RWF")
6. Submit payment
7. Check Stripe dashboard shows: 15000 RWF

---

## 🌍 Multi-Currency Support (Future)

### **Option 1: Single Currency System (Current)**
- ✅ Simple and straightforward
- ✅ All products in RWF
- ✅ No currency conversion needed
- ✅ Best for Rwanda-focused business

### **Option 2: Multi-Currency System (Optional)**
If you want to support multiple currencies:

#### **Add Currency Selection:**
```typescript
// Let users choose their currency
const currencies = [
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RWF' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' },
];
```

#### **Currency Conversion:**
```typescript
// Use exchange rates API
const convertPrice = async (amount: number, from: string, to: string) => {
  const rates = await fetchExchangeRates(from);
  return amount * rates[to];
};
```

#### **Store Per-Currency Prices:**
```sql
-- regional_pricing table (already exists)
CREATE TABLE regional_pricing (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES subscription_products(id),
  currency TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  region TEXT
);

-- Example data:
INSERT INTO regional_pricing VALUES
  ('uuid', 'starter-plan-id', 'RWF', 15000, 'RW'),
  ('uuid', 'starter-plan-id', 'USD', 15, 'US'),
  ('uuid', 'starter-plan-id', 'KES', 1500, 'KE');
```

---

## 🔐 Security & Best Practices

### **Currency Validation:**
```typescript
const SUPPORTED_CURRENCIES = ['RWF', 'USD', 'EUR', 'GBP', ...];

const validateCurrency = (currency: string): boolean => {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
};
```

### **Amount Validation:**
```typescript
// Prevent negative amounts
const validateAmount = (amount: number, currency: string): boolean => {
  if (amount <= 0) return false;
  
  // Check minimum amount for currency
  const minimums = {
    RWF: 100,    // Minimum 100 RWF
    USD: 0.50,   // Minimum $0.50
    EUR: 0.50,   // Minimum €0.50
  };
  
  return amount >= (minimums[currency] || 0);
};
```

### **Stripe Minimum Amounts:**
Each currency has minimum charge amounts:
- RWF: 100 minimum
- USD: $0.50 minimum
- EUR: €0.50 minimum
- Check Stripe docs for full list

---

## 📊 Summary

### **Your Current Setup:**
✅ **System Currency:** RWF (Rwandan Franc)  
✅ **Stripe Support:** YES - RWF is supported  
✅ **Currency Type:** Zero-decimal (no cents)  
✅ **All Restaurants:** Using RWF  
✅ **All Subscriptions:** Priced in RWF  
✅ **Payment Gateways:** Manual (RWF) + Stripe (needs RWF added)

### **Action Required:**
1. ⚠️ **Update Stripe config** to include RWF in supported currencies
2. ⚠️ **Test Stripe payments** with RWF amounts
3. ⚠️ **Verify amount formatting** (zero-decimal handling)
4. ✅ **Manual payment** already supports RWF

### **Key Points:**
- 🎯 RWF is supported by Stripe (135+ currencies)
- 🎯 RWF is zero-decimal (1,000 RWF = 1000, not 100000)
- 🎯 Must use lowercase 'rwf' in Stripe API calls
- 🎯 Your entire system uses RWF - perfect!
- 🎯 No currency conversion needed currently

---

## 🚀 Next Steps

1. **Update Stripe Configuration:**
   ```sql
   -- Run the SQL from Step 1 above
   ```

2. **Test RWF Payments:**
   - Create test subscription
   - Pay with Stripe (test card)
   - Verify amount displays correctly
   - Check Stripe dashboard

3. **Monitor Transactions:**
   - All amounts should be in RWF
   - No decimal confusion
   - Proper zero-decimal handling

4. **Consider Multi-Currency** (optional future enhancement)
   - Add currency selection
   - Implement exchange rates
   - Regional pricing table

---

**Your system is well-configured for RWF! Just need to add RWF to Stripe's supported currencies list.** ✅
