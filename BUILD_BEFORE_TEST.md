# 🔨 Build These Before Testing

**2 critical features needed for manual payment testing**

---

## 🎯 **What We Need to Build:**

### **1. Admin Approval UI** 🔴 CRITICAL
Currently missing: Admin can't approve/reject payments from UI

### **2. File Upload to Storage** 🔴 CRITICAL
Currently missing: Payment proof not actually uploaded

---

## ⚡ **Quick Build Plan (30 minutes)**

### **Task 1: Create AdminPendingPayments Component**
**File:** `src/components/admin/AdminPendingPayments.tsx`
**Time:** 20 minutes

**Features:**
```
✓ Show all pending manual payments
✓ Display user info, amount, reference
✓ "Approve" button → activates subscription
✓ "Reject" button → with reason
✓ View payment proof (if uploaded)
```

---

### **Task 2: Fix File Upload**
**File:** `src/pages/SubscriptionCheckout.tsx`
**Time:** 10 minutes

**Changes:**
```typescript
// Current: Just saves filename
payment_notes: `Manual payment - File: ${paymentProof.name}`

// Need: Upload to Supabase Storage
const { data } = await supabase.storage
  .from('payment-proofs')
  .upload(`${userId}/${Date.now()}_${file.name}`, file);

// Save storage path
payment_proof_url: data?.path
```

---

### **Task 3: Create Storage Bucket**
**Location:** Supabase Dashboard → Storage
**Time:** 2 minutes

**Steps:**
```
1. Go to Supabase project
2. Click "Storage"
3. Create new bucket: "payment-proofs"
4. Set to private
5. Add RLS policy for admins only
```

---

## 📋 **Detailed Implementation**

### **1. AdminPendingPayments Component**

**Location:** `src/components/admin/AdminPendingPayments.tsx`

**Core Functions:**
```typescript
// Load pending payments
const loadPendingPayments = async () => {
  const { data } = await supabase
    .from('subscription_orders')
    .select(`
      *,
      customer_subscriptions!inner(
        user_id,
        product_id,
        subscription_products(name, price)
      ),
      profiles!customer_subscriptions_user_id_fkey(
        email,
        full_name
      )
    `)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false });
};

// Approve payment
const handleApprove = async (orderId, subscriptionId) => {
  // 1. Update order to completed
  await supabase
    .from('subscription_orders')
    .update({
      payment_status: 'completed',
      order_status: 'completed',
      paid_date: new Date().toISOString()
    })
    .eq('id', orderId);
  
  // 2. Activate subscription
  await supabase
    .from('customer_subscriptions')
    .update({ status: 'active' })
    .eq('id', subscriptionId);
  
  // 3. Send email (optional)
  toast({ title: 'Payment approved' });
};

// Reject payment
const handleReject = async (orderId, subscriptionId, reason) => {
  await supabase
    .from('subscription_orders')
    .update({
      payment_status: 'rejected',
      payment_notes: reason
    })
    .eq('id', orderId);
  
  await supabase
    .from('customer_subscriptions')
    .update({ status: 'payment_rejected' })
    .eq('id', subscriptionId);
  
  toast({ title: 'Payment rejected' });
};
```

**UI Components:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Pending Manual Payments</CardTitle>
  </CardHeader>
  <CardContent>
    {pendingPayments.map(payment => (
      <div key={payment.id} className="border p-4 rounded">
        <div>
          <p><strong>User:</strong> {payment.user_email}</p>
          <p><strong>Plan:</strong> {payment.product_name}</p>
          <p><strong>Amount:</strong> RWF {payment.total}</p>
          <p><strong>Reference:</strong> {payment.payment_reference}</p>
          <p><strong>Date:</strong> {payment.created_at}</p>
        </div>
        
        {payment.payment_proof_url && (
          <Button onClick={() => viewProof(payment.payment_proof_url)}>
            View Receipt
          </Button>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button 
            onClick={() => handleApprove(payment.id, payment.subscription_id)}
            className="bg-green-600"
          >
            Approve
          </Button>
          
          <Button 
            onClick={() => setRejectDialog(payment)}
            variant="destructive"
          >
            Reject
          </Button>
        </div>
      </div>
    ))}
  </CardContent>
</Card>

{/* Reject Dialog */}
<Dialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Reject Payment</DialogTitle>
    </DialogHeader>
    <Textarea 
      placeholder="Enter rejection reason..."
      value={rejectReason}
      onChange={(e) => setRejectReason(e.target.value)}
    />
    <DialogFooter>
      <Button onClick={confirmReject} variant="destructive">
        Confirm Rejection
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### **2. File Upload Implementation**

**Update:** `src/pages/SubscriptionCheckout.tsx`

**Before (current):**
```typescript
if (paymentProof && referenceNumber) {
  await (supabase as any)
    .from('subscription_orders')
    .update({
      payment_status: 'pending',
      order_status: 'pending_payment',
      payment_reference: referenceNumber,
      payment_notes: `Manual payment - File: ${paymentProof.name}`, // ❌ Just filename
      gateway_id: selectedGateway,
    })
    .eq('id', order.id);
}
```

**After (with upload):**
```typescript
if (paymentProof && referenceNumber) {
  // Upload file to Supabase Storage
  const filePath = `${userId}/${Date.now()}_${paymentProof.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('payment-proofs')
    .upload(filePath, paymentProof);
  
  if (uploadError) {
    toast({
      title: 'Upload Error',
      description: 'Failed to upload payment proof',
      variant: 'destructive'
    });
    return;
  }
  
  // Update order with storage path
  await (supabase as any)
    .from('subscription_orders')
    .update({
      payment_status: 'pending',
      order_status: 'pending_payment',
      payment_reference: referenceNumber,
      payment_proof_url: uploadData.path, // ✅ Storage path
      payment_notes: `Manual payment - ${paymentProof.name}`,
      gateway_id: selectedGateway,
    })
    .eq('id', order.id);
}
```

---

### **3. Add Column to Database**

**SQL Migration:**
```sql
-- Add payment_proof_url column
ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status 
ON subscription_orders(payment_status);
```

---

### **4. Storage RLS Policies**

**Supabase Dashboard → Storage → payment-proofs → Policies:**

```sql
-- Allow authenticated users to upload their own proofs
CREATE POLICY "Users can upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all proofs
CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## ✅ **Testing Workflow After Build**

### **Step 1: Submit Manual Payment**
```
1. User goes to /subscriptions
2. Clicks "Start Free Trial"
3. Selects "Manual Payment"
4. Fills reference: TEST-REF-123
5. Uploads payment proof (image/PDF)
6. Submits
```

### **Step 2: Admin Views Pending**
```
1. Admin goes to /admin/pending-payments
2. Sees new pending payment
3. Clicks "View Receipt"
4. Reviews payment details
```

### **Step 3: Admin Approves**
```
1. Admin clicks "Approve"
2. Confirms action
3. Order status → completed
4. Subscription status → active
5. User sees active subscription
```

### **Step 4: Verify Success**
```
1. User refreshes /dashboard/subscription
2. Status shows "Active"
3. Can access features
4. Database updated correctly
```

---

## 🚀 **Ready to Build?**

I can create:
1. ✅ **AdminPendingPayments.tsx** - Full approval UI
2. ✅ **Updated SubscriptionCheckout.tsx** - File upload
3. ✅ **SQL migration** - Add column
4. ✅ **Storage setup guide** - RLS policies

**Just say:** "Build it now"

**Time:** 30 minutes to build + 10 minutes to test = **40 minutes total**

---

## 🎯 **Alternative: Quick Manual Test**

If you want to test NOW without building UI:

**Manual Approval in Supabase:**
```sql
-- 1. Find pending order
SELECT * FROM subscription_orders 
WHERE payment_status = 'pending' 
ORDER BY created_at DESC LIMIT 1;

-- 2. Approve it
UPDATE subscription_orders 
SET payment_status = 'completed',
    order_status = 'completed',
    paid_date = NOW()
WHERE id = '[order-id]';

-- 3. Activate subscription
UPDATE customer_subscriptions 
SET status = 'active'
WHERE id = '[subscription-id]';
```

This lets you test the flow immediately, then build the UI later.

---

**Your choice:**
- 🔨 **Option A:** Build UI first (30 mins), then test
- ⚡ **Option B:** Test manually now, build UI later

**What would you like to do?** 🤔
