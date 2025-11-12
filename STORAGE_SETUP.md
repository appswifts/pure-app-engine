# 🗄️ Supabase Storage Setup Guide

**Configure storage bucket for payment proof uploads**

---

## 📋 **Setup Steps**

### **Step 1: Create Storage Bucket**

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `menu-manager-rwanda`
3. Click **"Storage"** in left sidebar
4. Click **"Create a new bucket"**
5. Enter details:
   ```
   Name: payment-proofs
   Public: OFF (unchecked)
   File size limit: 5 MB
   Allowed MIME types: image/*, application/pdf
   ```
6. Click **"Create bucket"**

---

### **Step 2: Run Database Migration**

Execute the SQL migration to add the `payment_proof_url` column:

```sql
-- Option A: Run in Supabase SQL Editor
-- Copy contents of: database-migrations/add-payment-proof-url.sql
-- Paste in SQL Editor and execute

-- Option B: Quick command
ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_status 
ON subscription_orders(payment_status);
```

---

### **Step 3: Configure RLS Policies**

Go to **Storage → payment-proofs → Policies** and add these policies:

#### **Policy 1: Users Can Upload Own Proofs**

```sql
-- Name: Users can upload own proofs
-- Operation: INSERT
-- Target role: authenticated

CREATE POLICY "Users can upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:** Allows logged-in users to upload files to their own folder only.

---

#### **Policy 2: Users Can Read Own Proofs**

```sql
-- Name: Users can read own proofs
-- Operation: SELECT
-- Target role: authenticated

CREATE POLICY "Users can read own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**What it does:** Allows users to view their own uploaded files.

---

#### **Policy 3: Admins Can View All Proofs**

```sql
-- Name: Admins can view all proofs
-- Operation: SELECT
-- Target role: authenticated

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

**What it does:** Allows admins to view all payment proofs for verification.

---

#### **Policy 4: Admins Can Delete Proofs** (Optional)

```sql
-- Name: Admins can delete proofs
-- Operation: DELETE
-- Target role: authenticated

CREATE POLICY "Admins can delete proofs"
ON storage.objects FOR DELETE
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

**What it does:** Allows admins to delete payment proofs if needed.

---

### **Step 4: Test Upload**

**Test with the UI:**

1. Go to: `http://localhost:8080/subscriptions`
2. Click "Start Free Trial"
3. Select "Manual Payment"
4. Upload a test image
5. Submit

**Verify in Supabase:**

1. Go to **Storage → payment-proofs**
2. You should see a folder with your user ID
3. Inside: the uploaded file

**Check database:**

```sql
SELECT payment_proof_url 
FROM subscription_orders 
WHERE payment_status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;
```

Should return a path like: `{user-id}/{timestamp}_filename.jpg`

---

## 🔧 **Troubleshooting**

### **Issue: "Bucket not found"**
**Fix:**
- Verify bucket name is exactly `payment-proofs` (with hyphen)
- Check bucket exists in Storage section

### **Issue: "Permission denied"**
**Fix:**
- Ensure RLS policies are created
- Check user is authenticated
- Verify policies target `authenticated` role

### **Issue: "File upload failed"**
**Fix:**
- Check file size < 5MB
- Verify file type is image or PDF
- Check browser console for errors

### **Issue: "Can't view payment proof in admin"**
**Fix:**
- Ensure admin policy exists
- Check `profiles.role = 'admin'` for admin user
- Verify signed URL generation works

---

## 📊 **Storage Structure**

```
payment-proofs/
├── {user-id-1}/
│   ├── {timestamp}_receipt1.jpg
│   ├── {timestamp}_receipt2.pdf
│   └── ...
├── {user-id-2}/
│   ├── {timestamp}_receipt1.png
│   └── ...
└── ...
```

Each user has their own folder for organization and security.

---

## 🎯 **Quick Verification Checklist**

- [ ] Bucket `payment-proofs` created
- [ ] Bucket is private (not public)
- [ ] File size limit: 5 MB
- [ ] MIME types: image/*, application/pdf
- [ ] RLS Policy 1: Users upload own ✓
- [ ] RLS Policy 2: Users read own ✓
- [ ] RLS Policy 3: Admins view all ✓
- [ ] Database column `payment_proof_url` added
- [ ] Test upload works
- [ ] Admin can view uploaded files

---

## 🔐 **Security Notes**

1. **Privacy:** Payment proofs are private by default
2. **User Isolation:** Users can only access their own files
3. **Admin Access:** Only verified admins can see all proofs
4. **File Types:** Only images and PDFs allowed
5. **Size Limit:** 5MB prevents abuse

---

## 📝 **Alternative: Quick Setup Script**

If you prefer, run this all-in-one SQL script:

```sql
-- Create storage bucket (if not exists via UI)
-- Then apply policies:

BEGIN;

-- Add column
ALTER TABLE subscription_orders 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_subscription_orders_payment_status 
ON subscription_orders(payment_status);

-- RLS Policies
CREATE POLICY IF NOT EXISTS "Users can upload own proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can read own proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Admins can view all proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-proofs' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

COMMIT;

-- Success!
SELECT '✓ Storage setup complete!' AS status;
```

---

## ✅ **Setup Complete!**

After following these steps:
- Users can upload payment proofs
- Files are securely stored
- Admins can review submissions
- Ready for production use

**Next:** Test the complete manual payment flow! 🚀
