# 💵 Manual Payment Gateway Guide

## Overview

The **Manual Payment Gateway** allows you to accept payments via:
- 🏦 **Bank Transfers**
- 📱 **Mobile Money** (MTN, Airtel)
- 💵 **Cash Payments**

These payments require **admin verification** before subscription activation.

---

## ✅ Features

- ✅ **No Transaction Fees** - No 3rd party processing fees
- ✅ **Local Payment Methods** - Bank transfer & mobile money
- ✅ **Admin Verification** - Full control over payment approval
- ✅ **Proof of Payment** - Customers upload payment screenshots
- ✅ **Already Configured** - Uses your existing .env settings
- ✅ **Enabled by Default** - No API keys needed

---

## 🚀 Quick Setup

### Step 1: Configure Payment Details (Already Done!)

Your `.env` file already has the manual payment configuration:

```bash
# Manual Payment Configuration
VITE_MANUAL_PAYMENT_ENABLED=true
VITE_BANK_NAME=Bank of Kigali
VITE_BANK_ACCOUNT=1234567890
VITE_BANK_ACCOUNT_NAME=MenuForest Ltd

# Mobile Money
VITE_MTN_NUMBER=+250788123456
VITE_AIRTEL_NUMBER=+250732123456
```

### Step 2: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Run the migration file
-- Location: supabase/migrations/create_manual_payment_tables.sql
```

Or use the Supabase CLI:

```bash
supabase migration up
```

### Step 3: Test It!

```typescript
import { usePayment } from '@/hooks/usePayment';

function TestManualPayment() {
  const { createPayment, availableGateways } = usePayment();

  const handlePay = async () => {
    const payment = await createPayment(
      'manual', // Gateway ID
      29.99,    // Amount
      'RWF',    // Currency
      {
        paymentMethod: 'bank_transfer', // or 'mtn_mobile_money', 'airtel_money', 'cash'
        customerEmail: 'customer@example.com',
        customerName: 'John Doe',
        restaurantId: 'rest-123',
      }
    );

    // Show payment instructions to customer
    console.log(payment.metadata.paymentInstructions);
  };

  return <button onClick={handlePay}>Pay Manually</button>;
}
```

---

## 📋 How It Works

### Customer Flow

1. **Customer selects manual payment**
2. **System generates payment ID**
3. **Customer sees payment instructions** (bank details, mobile money number)
4. **Customer makes payment** (bank transfer or mobile money)
5. **Customer uploads proof** (screenshot of payment)
6. **Status: "Awaiting Verification"**
7. **Admin verifies payment** (in admin dashboard)
8. **Status: "Verified"** → Subscription activated! 🎉

### Admin Flow

1. **View pending payments** in admin dashboard
2. **Check proof of payment** (uploaded screenshot)
3. **Verify payment** (approve/reject)
4. **Customer notified** automatically

---

## 💳 Payment Methods

### Bank Transfer

Customer sees:
```
Bank Name: Bank of Kigali
Account Number: 1234567890
Account Name: MenuForest Ltd
Reference: manual_1699999999_abc123
```

### MTN Mobile Money

Customer sees:
```
MTN Number: +250788123456
1. Dial *182# or use MoMo app
2. Send Money
3. Enter amount: 29,000 RWF
4. Reference: manual_1699999999_abc123
5. Upload confirmation SMS
```

### Airtel Money

Customer sees:
```
Airtel Number: +250732123456
1. Dial *182# or use Airtel Money app
2. Send Money
3. Enter amount: 29,000 RWF
4. Reference: manual_1699999999_abc123
5. Upload confirmation
```

### Cash

Customer sees:
```
1. Pay cash at our office
2. Collect receipt
3. Upload photo of receipt
4. Wait for verification
```

---

## 🎨 Display Payment Instructions

### Using the Component

```typescript
import { ManualPaymentInstructions } from '@/components/payment/ManualPaymentInstructions';
import { useState } from 'react';

function CheckoutPage() {
  const [paymentIntent, setPaymentIntent] = useState(null);

  const handleManualPayment = async () => {
    const payment = await paymentService.createPayment(
      'manual',
      29.99,
      'RWF',
      {
        paymentMethod: 'mtn_mobile_money',
        customerEmail: user.email,
        restaurantId: restaurant.id,
      }
    );
    setPaymentIntent(payment);
  };

  const handleUploadProof = async (paymentId: string, file: File) => {
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('payment-proofs')
      .upload(`${paymentId}/${file.name}`, file);

    if (!error) {
      // Update payment record with proof URL
      await supabase
        .from('manual_payments')
        .update({ proof_of_payment_url: data.path })
        .eq('payment_id', paymentId);
    }
  };

  return (
    <div>
      {!paymentIntent ? (
        <button onClick={handleManualPayment}>Pay with Mobile Money</button>
      ) : (
        <ManualPaymentInstructions
          paymentIntent={paymentIntent}
          onUploadProof={handleUploadProof}
        />
      )}
    </div>
  );
}
```

---

## 🛡️ Admin Verification

### View Pending Payments

```typescript
import { supabase } from '@/integrations/supabase/client';

async function getPendingPayments() {
  const { data, error } = await supabase
    .from('manual_payments')
    .select('*')
    .eq('status', 'awaiting_verification')
    .order('created_at', { ascending: false });

  return data;
}
```

### Verify Payment

```typescript
import { paymentRegistry } from '@/lib/payments';

async function verifyPayment(paymentId: string, approved: boolean) {
  const manualGateway = paymentRegistry.get('manual');
  
  if (manualGateway) {
    const success = await manualGateway.verifyPayment(paymentId, approved);
    
    if (success) {
      // Send notification to customer
      // Activate subscription
      console.log(`Payment ${approved ? 'approved' : 'rejected'}`);
    }
  }
}
```

### Admin Dashboard Example

```typescript
function AdminPaymentsPanel() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    const data = await getPendingPayments();
    setPayments(data);
  };

  const handleVerify = async (paymentId: string, approved: boolean) => {
    await verifyPayment(paymentId, approved);
    loadPendingPayments(); // Refresh list
  };

  return (
    <div>
      <h2>Pending Manual Payments</h2>
      {payments.map(payment => (
        <div key={payment.id}>
          <h3>{payment.customer_name}</h3>
          <p>Amount: {payment.amount} {payment.currency}</p>
          <p>Method: {payment.payment_method}</p>
          {payment.proof_of_payment_url && (
            <img src={payment.proof_of_payment_url} alt="Proof" />
          )}
          <button onClick={() => handleVerify(payment.payment_id, true)}>
            Approve
          </button>
          <button onClick={() => handleVerify(payment.payment_id, false)}>
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 📊 Database Schema

### `manual_payments` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `payment_id` | TEXT | Unique payment identifier |
| `amount` | DECIMAL | Payment amount |
| `currency` | TEXT | Currency code |
| `status` | TEXT | pending, awaiting_verification, verified, rejected |
| `payment_method` | TEXT | bank_transfer, mtn_mobile_money, etc. |
| `customer_email` | TEXT | Customer email |
| `customer_name` | TEXT | Customer name |
| `restaurant_id` | UUID | Restaurant reference |
| `proof_of_payment_url` | TEXT | URL to uploaded proof |
| `submitted_at` | TIMESTAMP | When proof was submitted |
| `verified_at` | TIMESTAMP | When admin verified |

### `manual_subscriptions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `subscription_id` | TEXT | Unique subscription identifier |
| `customer_id` | TEXT | Customer ID |
| `plan_id` | TEXT | Subscription plan |
| `status` | TEXT | pending, active, canceled |
| `payment_method` | TEXT | Preferred payment method |
| `next_payment_due` | TIMESTAMP | Next payment date |

---

## 🔔 Notifications

### Notify Customer on Verification

```typescript
async function notifyCustomerPaymentVerified(paymentId: string) {
  const { data: payment } = await supabase
    .from('manual_payments')
    .select('*')
    .eq('payment_id', paymentId)
    .single();

  if (payment && payment.customer_email) {
    // Send email
    await sendEmail({
      to: payment.customer_email,
      subject: 'Payment Verified - Subscription Activated',
      body: `Your payment of ${payment.amount} ${payment.currency} has been verified. Your subscription is now active!`,
    });
  }
}
```

---

## 🎯 Best Practices

1. **Verify Quickly** - Process payments within 24 hours
2. **Clear Instructions** - Make payment steps crystal clear
3. **Save Proofs** - Store payment screenshots for records
4. **Auto-Reminders** - Remind customers to upload proof
5. **Receipt Generation** - Send receipt after verification
6. **Refund Policy** - Have clear refund terms
7. **Support Channel** - Provide payment support

---

## 🔄 Subscription Renewals

Manual subscriptions require recurring manual payments:

```typescript
// Set next payment due date
await supabase
  .from('manual_subscriptions')
  .update({
    next_payment_due: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'active',
  })
  .eq('subscription_id', subscriptionId);

// Send renewal reminder
async function sendRenewalReminder(subscriptionId: string) {
  const { data: sub } = await supabase
    .from('manual_subscriptions')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .single();

  // Send email 7 days before due
  // Include payment instructions
}
```

---

## 📱 Mobile Money Integration (Future)

For automatic mobile money verification, integrate with:

- **Rwanda:** MTN MoMo API, Airtel Money API
- **Uganda:** MTN MoMo API, Airtel Money API
- **Kenya:** M-Pesa API (Safaricom)
- **Ghana:** MTN Mobile Money API

This would eliminate manual verification! 🚀

---

## ✅ Checklist

- ✅ Database tables created
- ✅ Payment gateway registered
- ✅ Bank/mobile money details in `.env`
- ✅ Payment instructions component ready
- ✅ Admin verification flow planned
- ✅ Customer can upload proof
- ✅ Email notifications configured

---

## 🎉 You're Ready!

Manual payments are now available alongside Stripe, PayPal, and Flutterwave!

**Customers can choose:**
- Credit card (Stripe)
- PayPal
- Mobile money (Flutterwave - automatic)
- Mobile money/Bank transfer (Manual - with verification)

**No payment gateway fees on manual payments!** 💰
