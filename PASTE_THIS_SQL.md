# ✅ Quick Setup - Paste This SQL

**Just copy and paste this into Supabase SQL Editor**

---

## 📋 Open Supabase SQL Editor:
https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/sql/new

---

## 📝 Copy & Paste This SQL:

```sql
-- Add payment_proof_url column
ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_status 
ON subscription_orders(payment_status);

CREATE INDEX IF NOT EXISTS idx_subscription_orders_pending 
ON subscription_orders(payment_status, created_at DESC) 
WHERE payment_status = 'pending';

-- Storage policies
CREATE POLICY IF NOT EXISTS "Users can upload own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'payment-proofs' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Admins can view all proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'payment-proofs' AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
```

---

## ✅ Then Create Storage Bucket:

1. Go to: **Storage** tab
2. Click **"Create bucket"**
3. Name: `payment-proofs`
4. Public: **OFF**
5. Click **"Create"**

---

## 🎯 Done! Now Test:

1. **User:** http://localhost:8080/subscriptions → Subscribe
2. **Admin:** http://localhost:8080/admin/subscriptions → Approve
3. **User:** http://localhost:8080/dashboard/subscription → See Active

---

**Total time:** 3 minutes ⚡
