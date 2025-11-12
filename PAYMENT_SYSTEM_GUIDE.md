# 🔌 Extensible Payment System Documentation

## Overview

This is a **plugin-based payment system** that allows you to easily add, remove, and manage multiple payment gateways without rewriting core code. Think of it like WooCommerce's payment gateway system, but built specifically for your restaurant SaaS.

---

## 📁 Architecture

```
src/lib/payments/
├── PaymentGateway.ts          # Base interface for all gateways
├── PaymentRegistry.ts         # Central registry managing all gateways
├── PaymentService.ts          # High-level service for payments
├── index.ts                   # Initialization and exports
└── gateways/
    ├── StripeGateway.ts       # Stripe implementation
    ├── PayPalGateway.ts       # PayPal implementation
    ├── FlutterwaveGateway.ts  # Flutterwave implementation
    └── YourCustomGateway.ts   # Add your own!
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install stripe
# Optional: Add other gateways as needed
```

### 2. Configure Environment Variables

Add to your `.env` file:

```bash
# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
VITE_STRIPE_SECRET_KEY=sk_test_xxx
VITE_STRIPE_WEBHOOK_SECRET=whsec_xxx
VITE_STRIPE_TEST_MODE=true

# PayPal (optional)
VITE_PAYPAL_CLIENT_ID=xxx
VITE_PAYPAL_CLIENT_SECRET=xxx
VITE_PAYPAL_ENABLED=true
VITE_PAYPAL_TEST_MODE=true
VITE_PAYPAL_WEBHOOK_ID=xxx

# Flutterwave (optional)
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
VITE_FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
VITE_FLUTTERWAVE_ENABLED=true
VITE_FLUTTERWAVE_TEST_MODE=true
VITE_FLUTTERWAVE_WEBHOOK_SECRET=xxx
```

### 3. Initialize Payment System

In your `src/main.tsx` or `src/App.tsx`:

```typescript
import { initializePayments } from '@/lib/payments';

// Initialize before rendering app
initializePayments();

function App() {
  // Your app code
}
```

### 4. Use in Components

```typescript
import { usePayment } from '@/hooks/usePayment';

function SubscriptionPage() {
  const { 
    availableGateways, 
    createSubscription, 
    loading 
  } = usePayment();

  const handleSubscribe = async () => {
    const subscription = await createSubscription(
      'stripe', // Gateway ID
      'customer-123', // Customer ID
      'price_basic', // Plan ID
      { restaurantId: 'rest-123' } // Metadata
    );
    
    if (subscription) {
      console.log('Success!', subscription);
    }
  };

  return (
    <div>
      <h2>Choose Payment Method</h2>
      {availableGateways.map(gateway => (
        <button key={gateway.id} onClick={handleSubscribe}>
          Pay with {gateway.name}
        </button>
      ))}
    </div>
  );
}
```

---

## 🎯 Core Concepts

### 1. Payment Gateway

A payment gateway is a provider that processes payments (Stripe, PayPal, etc.). Each gateway implements the `PaymentGateway` abstract class.

### 2. Payment Registry

The central registry that stores and manages all registered gateways. Use it to:
- Register new gateways
- Get available gateways
- Check if gateway is enabled

### 3. Payment Service

High-level service that provides convenient methods for common payment operations:
- Create payments
- Create subscriptions
- Cancel subscriptions
- Refund payments
- Handle webhooks

---

## 🔌 Adding a New Payment Gateway

### Step 1: Create Gateway Class

Create `src/lib/payments/gateways/YourGateway.ts`:

```typescript
import {
  PaymentGateway,
  PaymentMethod,
  PaymentIntent,
  SubscriptionIntent,
  PaymentResult,
  WebhookEvent,
  PaymentGatewayConfig,
} from '../PaymentGateway';

interface YourGatewayConfig extends PaymentGatewayConfig {
  apiKey: string;
  apiSecret: string;
}

export class YourGateway extends PaymentGateway {
  constructor(config: YourGatewayConfig) {
    super(
      'your-gateway', // Unique ID
      'Your Gateway', // Display name
      'Description of your gateway', // Description
      config
    );
  }

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'card',
        name: 'Credit Card',
        type: 'card',
        icon: '💳',
      },
    ];
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    // Your implementation
    const response = await fetch('https://api.yourgateway.com/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ amount, currency }),
    });
    
    const data = await response.json();
    
    return {
      id: data.id,
      amount,
      currency,
      status: 'pending',
      metadata,
    };
  }

  async createSubscription(
    customerId: string,
    planId: string,
    metadata?: Record<string, any>
  ): Promise<SubscriptionIntent> {
    // Your implementation
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    // Your implementation
  }

  async processPayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    // Your implementation
  }

  async verifyWebhook(payload: string, signature: string): Promise<boolean> {
    // Your implementation
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // Your implementation
  }

  async getCustomerPortalUrl(customerId: string): Promise<string | null> {
    // Your implementation
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number
  ): Promise<boolean> {
    // Your implementation
  }

  async getPaymentDetails(paymentIntentId: string): Promise<PaymentIntent> {
    // Your implementation
  }

  async getSubscriptionDetails(
    subscriptionId: string
  ): Promise<SubscriptionIntent> {
    // Your implementation
  }
}
```

### Step 2: Register Your Gateway

In `src/lib/payments/index.ts`:

```typescript
import { YourGateway } from './gateways/YourGateway';

export function initializePayments() {
  // ... existing gateways ...

  // Register your gateway
  if (import.meta.env.VITE_YOUR_GATEWAY_API_KEY) {
    const yourGateway = new YourGateway({
      enabled: true,
      testMode: true,
      apiKey: import.meta.env.VITE_YOUR_GATEWAY_API_KEY,
      apiSecret: import.meta.env.VITE_YOUR_GATEWAY_API_SECRET,
    });
    paymentRegistry.register(yourGateway);
  }
}
```

### Step 3: Add Environment Variables

```bash
VITE_YOUR_GATEWAY_API_KEY=xxx
VITE_YOUR_GATEWAY_API_SECRET=xxx
```

That's it! Your new gateway is now available throughout the app! 🎉

---

## 📊 Usage Examples

### Create a One-Time Payment

```typescript
import { paymentService } from '@/lib/payments';

const payment = await paymentService.createPayment(
  'stripe', // Gateway ID
  29.99, // Amount
  'USD', // Currency
  { // Metadata
    orderId: 'order-123',
    customerName: 'John Doe',
  }
);

console.log('Payment ID:', payment.id);
console.log('Status:', payment.status);
```

### Create a Subscription

```typescript
const subscription = await paymentService.createSubscription(
  'stripe',
  'cus_123', // Stripe customer ID
  'price_basic', // Price ID from Stripe
  {
    restaurantId: 'rest-123',
    planName: 'Basic Plan',
  }
);

console.log('Subscription ID:', subscription.id);
console.log('Status:', subscription.status);
```

### Cancel a Subscription

```typescript
const canceled = await paymentService.cancelSubscription(
  'stripe',
  'sub_123'
);

if (canceled) {
  console.log('Subscription canceled successfully');
}
```

### Get Available Payment Methods

```typescript
const methods = await paymentService.getAvailablePaymentMethods();

methods.forEach(method => {
  console.log(`${method.gatewayName}: ${method.name} (${method.type})`);
});

// Output:
// Stripe: Credit/Debit Card (card)
// Stripe: Apple Pay (wallet)
// PayPal: PayPal (wallet)
// Flutterwave: M-Pesa Kenya (mobile_money)
```

### Handle Webhooks (Supabase Edge Function)

```typescript
// supabase/functions/webhooks/stripe/index.ts
import { paymentService } from '@/lib/payments';

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const payload = await req.text();

  const handled = await paymentService.handleWebhook(
    'stripe',
    payload,
    signature
  );

  return new Response(
    JSON.stringify({ received: handled }),
    { status: handled ? 200 : 400 }
  );
});
```

---

## 🎨 React Component Examples

### Payment Gateway Selector

```typescript
function GatewaySelector() {
  const { availableGateways } = usePayment();
  const [selected, setSelected] = useState('');

  return (
    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
      <option value="">Choose payment method</option>
      {availableGateways.map(gateway => (
        <option key={gateway.id} value={gateway.id}>
          {gateway.name}
        </option>
      ))}
    </select>
  );
}
```

### Payment Methods Display

```typescript
function PaymentMethodsList() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    paymentService.getAvailablePaymentMethods().then(setMethods);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {methods.map(method => (
        <button key={`${method.gatewayId}-${method.id}`} className="p-4 border rounded">
          <div className="text-2xl mb-2">{method.icon}</div>
          <div className="font-medium">{method.name}</div>
          <div className="text-sm text-gray-500">{method.gatewayName}</div>
        </button>
      ))}
    </div>
  );
}
```

---

## 🔒 Security Best Practices

1. **Never expose secret keys** - Use environment variables
2. **Verify all webhooks** - Always verify signatures
3. **Use HTTPS** - Especially for webhooks
4. **Store minimal data** - Don't store card numbers
5. **Use test mode** - During development
6. **Audit logs** - Log all payment operations

---

## 🧪 Testing

### Test Mode

All gateways support test mode. Set in environment:

```bash
VITE_STRIPE_TEST_MODE=true
VITE_PAYPAL_TEST_MODE=true
```

### Test Cards

**Stripe:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**PayPal:**
- Use sandbox accounts from PayPal Developer Dashboard

**Flutterwave:**
- Use test keys and test numbers provided in docs

---

## 📊 Gateway Comparison

| Gateway | Best For | Transaction Fee | Setup Difficulty | Global? |
|---------|----------|-----------------|------------------|---------|
| **Stripe** | Global, Cards | 2.9% + $0.30 | Easy | ✅ |
| **PayPal** | Trust, Wallets | 2.9% + $0.30 | Easy | ✅ |
| **Flutterwave** | Africa, Mobile Money | 1.4% - 3.8% | Medium | 🌍 Africa |

---

## 🐛 Troubleshooting

### Gateway Not Appearing

1. Check environment variables are set
2. Check `enabled: true` in config
3. Check console for initialization logs

### Webhook Not Working

1. Verify webhook URL is publicly accessible
2. Check webhook secret matches
3. Verify signature validation logic
4. Check webhook is registered in provider dashboard

### Payment Fails

1. Check test mode settings
2. Verify API keys are correct
3. Check amount/currency format
4. Review provider dashboard for errors

---

## 🚀 Deployment

### Environment Variables

Set all payment gateway credentials in your hosting platform:

**Vercel/Netlify:**
```bash
vercel env add VITE_STRIPE_SECRET_KEY
```

**Cloudflare:**
```bash
wrangler secret put VITE_STRIPE_SECRET_KEY
```

### Webhooks

Register webhook URLs in each provider:

**Stripe:** `https://yourdomain.com/api/webhooks/stripe`
**PayPal:** `https://yourdomain.com/api/webhooks/paypal`
**Flutterwave:** `https://yourdomain.com/api/webhooks/flutterwave`

---

## 📚 API Reference

See TypeScript interfaces in `PaymentGateway.ts` for complete API documentation.

---

## 💡 Tips

1. **Start with one gateway** (Stripe recommended)
2. **Test thoroughly** before going live
3. **Monitor webhook health** - Set up alerts
4. **Cache payment methods** - Don't fetch on every render
5. **Handle errors gracefully** - Show user-friendly messages

---

## 🎉 You're Done!

Your extensible payment system is ready! Add new gateways anytime by:
1. Creating a new gateway class
2. Registering it in `index.ts`
3. Adding environment variables

No core code changes needed! 🚀
