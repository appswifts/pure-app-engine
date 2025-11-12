# 💳 Payment Gateways System - Complete Guide

## **Overview**

The payment gateway system is built to be **extensible and flexible**. You can add multiple payment gateways (Stripe, PayPal, Flutterwave, Paystack, etc.) without modifying core code.

---

## **How the System Works**

### **1. Payment Gateway Architecture**

```
PaymentGateway (Abstract Interface)
    ↓
├── StripeGateway
├── PayPalGateway
├── FlutterwaveGateway
└── [Your Custom Gateway]
```

Each gateway implements the `PaymentGateway` interface and registers itself with the `PaymentGatewayRegistry`.

---

## **Current Payment Gateways Setup**

### **Access Admin Panel:**
```
Navigate to: http://localhost:8080/admin/payment-gateways
```

This page allows you to:
- ✅ Enable/disable payment gateways
- ✅ Configure API keys and settings
- ✅ Test gateway connections
- ✅ Set default gateway

---

## **Adding a New Payment Gateway**

### **Step 1: Create Gateway Class**

Create a new file in `src/lib/subscriptions/gateways/`:

```typescript
// src/lib/subscriptions/gateways/FlutterwaveGateway.ts

import { PaymentGateway, PaymentResult, RefundResult } from '../PaymentGatewayInterface';

export class FlutterwaveGateway extends PaymentGateway {
  constructor(config: any) {
    super('flutterwave', config);
  }

  async initialize(): Promise<void> {
    // Initialize Flutterwave SDK
    // Validate API keys
    console.log('Flutterwave gateway initialized');
  }

  async createCustomer(userId: string, email: string, metadata?: any): Promise<string> {
    // Create customer in Flutterwave
    // Return Flutterwave customer ID
    return `flw_customer_${userId}`;
  }

  async tokenizePaymentMethod(
    customerId: string,
    paymentDetails: any
  ): Promise<string> {
    // Tokenize card using Flutterwave
    // Return payment method token
    return `flw_pm_${Date.now()}`;
  }

  async charge(
    customerId: string,
    amount: number,
    currency: string,
    paymentMethodId: string,
    metadata?: any
  ): Promise<PaymentResult> {
    // Charge customer using Flutterwave API
    try {
      // Make API call to Flutterwave
      const response = await fetch('https://api.flutterwave.com/v3/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          customer: customerId,
          payment_method: paymentMethodId,
          // ... other Flutterwave parameters
        }),
      });

      const data = await response.json();

      return {
        success: data.status === 'successful',
        transactionId: data.data.tx_ref,
        amount: data.data.amount,
        currency: data.data.currency,
        status: data.status,
        metadata: data.data,
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: null,
        amount,
        currency,
        status: 'failed',
        error: error.message,
      };
    }
  }

  async refund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    // Process refund via Flutterwave
    try {
      const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          comments: reason,
        }),
      });

      const data = await response.json();

      return {
        success: data.status === 'success',
        refundId: data.data.id,
        amount: data.data.amount,
        status: data.status,
      };
    } catch (error: any) {
      return {
        success: false,
        refundId: null,
        error: error.message,
      };
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    // Verify Flutterwave webhook signature
    // Return true if valid
    return true;
  }

  async handleWebhook(event: any): Promise<void> {
    // Process Flutterwave webhook events
    console.log('Handling Flutterwave webhook:', event);
  }
}
```

---

### **Step 2: Register Gateway**

In your initialization code (e.g., `src/lib/payments.ts`):

```typescript
import { PaymentGatewayRegistry } from '@/lib/subscriptions/PaymentGatewayInterface';
import { StripeGateway } from '@/lib/subscriptions/gateways/StripeGateway';
import { FlutterwaveGateway } from '@/lib/subscriptions/gateways/FlutterwaveGateway';

export function initializePayments() {
  // Register Stripe
  const stripeConfig = {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY,
  };
  const stripeGateway = new StripeGateway(stripeConfig);
  PaymentGatewayRegistry.register(stripeGateway);

  // Register Flutterwave
  const flutterwaveConfig = {
    publicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    secretKey: import.meta.env.VITE_FLUTTERWAVE_SECRET_KEY,
  };
  const flutterwaveGateway = new FlutterwaveGateway(flutterwaveConfig);
  PaymentGatewayRegistry.register(flutterwaveGateway);

  // Set default gateway
  PaymentGatewayRegistry.setDefault('stripe');
}
```

---

### **Step 3: Add Environment Variables**

Update `.env`:

```env
# Flutterwave
VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxxxx
VITE_FLUTTERWAVE_SECRET_KEY=FLWSECK-xxxxx

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_STRIPE_SECRET_KEY=sk_test_xxxxx
```

---

### **Step 4: Add Gateway to Admin Panel**

The admin panel at `/admin/payment-gateways` automatically shows all registered gateways. You just need to ensure your gateway is registered in the registry.

---

## **Using Payment Gateways**

### **Example: Create Subscription with Payment**

```typescript
import { PaymentGatewayRegistry } from '@/lib/subscriptions/PaymentGatewayInterface';

async function subscribeUser(userId: string, productId: string, paymentDetails: any) {
  // Get the gateway (uses default or specified)
  const gateway = PaymentGatewayRegistry.get('stripe'); // or 'flutterwave'
  
  // Create customer
  const customerId = await gateway.createCustomer(userId, 'user@example.com');
  
  // Tokenize payment method
  const paymentMethodId = await gateway.tokenizePaymentMethod(customerId, paymentDetails);
  
  // Charge initial payment
  const chargeResult = await gateway.charge(
    customerId,
    15000,
    'RWF',
    paymentMethodId,
    { subscriptionId: 'sub_123' }
  );
  
  if (chargeResult.success) {
    // Create subscription in database
    // ...
  }
}
```

---

## **Admin Payment Gateways Page**

### **Current Features:**

1. **View All Gateways**
   - Shows all registered payment gateways
   - Displays status (enabled/disabled)
   - Shows configuration status

2. **Enable/Disable Gateways**
   - Toggle gateways on/off
   - Set default gateway

3. **Configure Gateways**
   - Add API keys
   - Set webhook URLs
   - Configure gateway-specific settings

4. **Test Gateways**
   - Test connection
   - Verify API keys
   - Test transactions

---

## **Adding More Gateways - Quick Reference**

### **Stripe** (Already Implemented)
```typescript
import { StripeGateway } from '@/lib/subscriptions/gateways/StripeGateway';
```

### **PayPal**
```typescript
// src/lib/subscriptions/gateways/PayPalGateway.ts
export class PayPalGateway extends PaymentGateway {
  // Implement PayPal-specific logic
}
```

### **Flutterwave**
```typescript
// src/lib/subscriptions/gateways/FlutterwaveGateway.ts
export class FlutterwaveGateway extends PaymentGateway {
  // Implement Flutterwave-specific logic
}
```

### **Paystack**
```typescript
// src/lib/subscriptions/gateways/PaystackGateway.ts
export class PaystackGateway extends PaymentGateway {
  // Implement Paystack-specific logic
}
```

### **Authorize.Net**
```typescript
// src/lib/subscriptions/gateways/AuthorizeNetGateway.ts
export class AuthorizeNetGateway extends PaymentGateway {
  // Implement Authorize.Net-specific logic
}
```

---

## **Webhook Handling**

Each gateway should handle its own webhooks:

```typescript
// In your API/backend
app.post('/webhooks/stripe', async (req, res) => {
  const gateway = PaymentGatewayRegistry.get('stripe');
  const signature = req.headers['stripe-signature'];
  
  const isValid = await gateway.verifyWebhookSignature(req.body, signature);
  
  if (isValid) {
    await gateway.handleWebhook(req.body);
    res.json({ received: true });
  } else {
    res.status(400).send('Invalid signature');
  }
});

app.post('/webhooks/flutterwave', async (req, res) => {
  const gateway = PaymentGatewayRegistry.get('flutterwave');
  // ... similar handling
});
```

---

## **Testing Payment Gateways**

### **Test Mode**

1. Use test API keys in development
2. Use test card numbers (each gateway provides them)
3. Don't charge real cards

### **Stripe Test Cards:**
```
4242 4242 4242 4242 - Success
4000 0000 0000 0002 - Declined
4000 0000 0000 9995 - Insufficient funds
```

### **Flutterwave Test Cards:**
```
5531 8866 5214 2950 - Success
```

---

## **Security Best Practices**

1. **Never expose secret keys in frontend code**
   - Keep secret keys in backend only
   - Use environment variables

2. **Validate webhook signatures**
   - Always verify webhook authenticity

3. **Use HTTPS**
   - All payment API calls must use HTTPS

4. **PCI Compliance**
   - Never store full card numbers
   - Use tokenization

5. **Log everything**
   - Log all payment attempts
   - Track failed payments
   - Monitor for fraud

---

## **Summary**

### **To Add a New Gateway:**

1. ✅ Create gateway class extending `PaymentGateway`
2. ✅ Implement required methods (charge, refund, webhooks, etc.)
3. ✅ Register gateway in `PaymentGatewayRegistry`
4. ✅ Add environment variables
5. ✅ Configure in admin panel
6. ✅ Test thoroughly

### **Admin Panel Capabilities:**

- ✅ View all gateways
- ✅ Enable/disable gateways
- ✅ Configure API keys
- ✅ Set default gateway
- ✅ Test connections

**The system is designed to be flexible - you can add as many payment gateways as you need without modifying core subscription logic!** 🚀
