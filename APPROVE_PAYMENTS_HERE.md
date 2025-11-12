# ✅ Where to Approve Payments

---

## 🎯 **Approval Location:**

### **Go to:**
```
http://localhost:8080/admin/subscriptions
```

### **Then:**
- Click **"Pending Payments"** tab (first tab)
- You'll see all pending manual payments
- Click **"Approve"** or **"Reject"** on each payment

---

## 📋 **Quick Setup First (10 mins)**

**Before you can approve payments, you need to:**

### **1. Run SQL Migration** (2 mins)
```sql
-- Supabase Dashboard → SQL Editor
-- Paste and run:

ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_status 
ON subscription_orders(payment_status);
```

### **2. Create Storage Bucket** (3 mins)
1. **Supabase Dashboard** → **Storage**
2. Click **"Create bucket"**
3. Name: `payment-proofs`
4. Public: **OFF** (unchecked)
5. Click **"Create"**

### **3. Add RLS Policies** (5 mins)
Go to **Storage → payment-proofs → Policies**

**Policy 1:**
```sql
CREATE POLICY "Users can upload own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2:**
```sql
CREATE POLICY "Users can read own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 3:**
```sql
CREATE POLICY "Admins can view all proofs"
ON storage.objects FOR SELECT TO authenticated
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

## 🧪 **Complete Test Flow:**

### **User Side:**
1. Go to: `http://localhost:8080/subscriptions`
2. Click "Start Free Trial"
3. Select "Manual Payment"
4. Fill reference: `TEST-REF-12345`
5. Upload file (image or PDF)
6. Submit

### **Admin Side:**
1. Go to: `http://localhost:8080/admin/subscriptions`
2. Click **"Pending Payments"** tab
3. See the pending payment
4. Click "View Receipt" to see uploaded file
5. Click **"Approve"** to activate subscription

### **Verify:**
1. User refreshes `/dashboard/subscription`
2. Status changes to **"Active"**
3. Features unlocked

---

## 📊 **Admin Subscriptions Hub Tabs:**

### **Tab 1: Pending Payments** ⭐ (You want this!)
- Shows all pending manual payments
- Approve/Reject buttons
- View receipts
- **This is where you approve!**

### **Tab 2: Products**
- Manage subscription plans
- Edit prices
- Configure features

### **Tab 3: Customers**
- View all customer subscriptions
- See active/expired/cancelled
- Manage renewals

### **Tab 4: All Orders**
- Complete order history
- All payment statuses
- Transaction details

---

## 🎯 **Navigation:**

```
Admin Panel
└── Subscriptions (sidebar)
    ├── [Pending Payments] ← APPROVE HERE! ⭐
    ├── Products
    ├── Customers
    └── All Orders
```

---

## ✅ **Quick Checklist:**

- [ ] Run SQL migration
- [ ] Create storage bucket `payment-proofs`
- [ ] Add 3 RLS policies
- [ ] User submits manual payment
- [ ] Admin goes to `/admin/subscriptions`
- [ ] Click "Pending Payments" tab
- [ ] See pending payment
- [ ] Click "Approve"
- [ ] User sees "Active" status

---

## 🚀 **Ready to Test!**

**URL:** http://localhost:8080/admin/subscriptions  
**Tab:** Pending Payments (first tab)  
**Action:** Click "Approve" button

That's it! 🎉
