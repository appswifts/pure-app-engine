# 🧪 Manual Payment Workflow Test Guide

**Complete step-by-step testing guide for the subscription system with manual payment**

---

## ✅ Test Scenario: Manual Payment Flow

### **Prerequisites:**
- ✅ User is logged in
- ✅ Local dev server running on port 8080
- ✅ Supabase database configured

---

## 🔍 **TEST 1: View Subscription Plans**

### Steps:
1. Navigate to: `http://localhost:8080/subscriptions`
2. Verify you can see all 3 plans:
   - ✅ Starter Plan (RWF 15,000/month) - 14 day trial
   - ✅ Professional Plan (RWF 29,000/month) - 14 day trial
   - ✅ Enterprise Plan (RWF 75,000/month) - No trial

### Expected Results:
- [ ] All plans display correctly
- [ ] Pricing is accurate
- [ ] Features list shows for each plan
- [ ] Trial badges visible on Starter & Professional

---

## 🔍 **TEST 2: Navigate to Checkout (Starter Plan)**

### Steps:
1. Click **"Start Free Trial"** on Starter Plan
2. Wait for redirect

### Expected Results:
- [ ] Redirects to: `/subscriptions/checkout/[productId]`
- [ ] Order Summary shows:
  - Plan name: "Starter Plan"
  - Price: RWF 15,000
  - Trial: 14 days
  - Total Today: RWF 0
- [ ] Payment Method section loads
- [ ] Two payment options visible:
  - Stripe Global
  - Manual Payment

---

## 🔍 **TEST 3: Select Manual Payment**

### Steps:
1. Click on **"Manual Payment"** radio button
2. Wait for form to appear

### Expected Results:
- [ ] Manual payment selected (highlighted)
- [ ] Form displays:
  - ✅ Amber instruction box with text about bank transfer
  - ✅ "Payment Reference Number" field
  - ✅ "Upload Proof of Payment" file input
- [ ] Terms checkbox visible
- [ ] Submit button is **disabled** (until terms checked)

---

## 🔍 **TEST 4: Fill Manual Payment Form**

### Steps:
1. **Payment Reference Number:** Enter `TEST-REF-12345`
2. **Upload Proof:** Select any image file (PNG, JPG, or PDF)
3. **Check terms:** Click the "I agree to Terms..." checkbox

### Expected Results:
- [ ] Reference number entered successfully
- [ ] File selected (shows filename)
- [ ] Terms checkbox checked
- [ ] Submit button now **enabled** (changes from disabled)
- [ ] Button text shows: "Start 14 day Free Trial"

---

## 🔍 **TEST 5: Submit Manual Payment**

### Steps:
1. Click **"Start 14 day Free Trial"** button
2. Wait for processing

### Expected Results:
- [ ] Button shows "Processing..."
- [ ] Toast notification appears:
  - Title: "Subscription Created"
  - Message: "Your subscription is pending payment verification. An admin will review..."
- [ ] Redirects to: `/dashboard/subscription`

---

## 🔍 **TEST 6: View Subscription Dashboard**

### Steps:
1. After redirect, observe the subscription dashboard
2. Check subscription status

### Expected Results:
- [ ] Page shows subscription details
- [ ] Subscription status: **"Pending"** or **"Pending Payment"**
- [ ] Plan name: "Starter Plan"
- [ ] Price: RWF 15,000/month
- [ ] Message about awaiting admin approval
- [ ] Features NOT yet accessible (restricted until activated)

---

## 🔍 **TEST 7: Check Database Records**

### Steps:
1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Check tables:

#### **A. `customer_subscriptions` table:**
```sql
SELECT id, user_id, product_id, status, payment_method
FROM customer_subscriptions
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- [ ] New record exists
- [ ] `status` = `'pending'`
- [ ] `user_id` = Your user ID
- [ ] `product_id` = Starter Plan ID

#### **B. `subscription_orders` table:**
```sql
SELECT id, subscription_id, payment_status, order_status, 
       payment_reference, payment_notes
FROM subscription_orders
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- [ ] New order record exists
- [ ] `payment_status` = `'pending'`
- [ ] `order_status` = `'pending_payment'`
- [ ] `payment_reference` = `'TEST-REF-12345'`
- [ ] `payment_notes` contains filename

#### **C. `subscription_events` table:**
```sql
SELECT event_type, details, created_at
FROM subscription_events
ORDER BY created_at DESC
LIMIT 3;
```

**Expected:**
- [ ] Event: "subscription_created"
- [ ] Event: "status_changed" (to pending)

---

## 🔍 **TEST 8: Admin Approval (Simulate)**

### Steps:
1. In Supabase Table Editor
2. Go to `customer_subscriptions` table
3. Find your subscription record
4. Update:
   - `status` = `'active'`
   - Click Save

### Expected Results:
- [ ] Record updated successfully
- [ ] Refresh `/dashboard/subscription` page
- [ ] Status now shows: **"Active"**
- [ ] Features are now accessible
- [ ] Trial countdown shows remaining days

---

## 🔍 **TEST 9: Verify Subscription Restrictions**

### Steps:
1. Try to access restricted features
2. Check menu item limits

### Expected Results for Starter Plan:
- [ ] Can create up to 1 restaurant
- [ ] Can create up to 50 menu items
- [ ] QR codes: ✅ Enabled
- [ ] Analytics: ✅ Enabled
- [ ] WhatsApp: ❌ Disabled (Professional+)
- [ ] Custom Branding: ❌ Disabled (Professional+)

---

## 🔍 **TEST 10: Return to Subscriptions Page**

### Steps:
1. Navigate to: `http://localhost:8080/subscriptions`

### Expected Results:
- [ ] Shows "Current Plan" badge on Starter Plan
- [ ] Shows "Active" status
- [ ] Other plans show "Upgrade" buttons
- [ ] Cannot subscribe to same plan again

---

## 🐛 **Common Issues & Fixes**

### ❌ Issue: Button stays disabled
**Fix:** Make sure both:
- ✅ Reference number is filled
- ✅ File is selected
- ✅ Terms checkbox is checked

### ❌ Issue: File upload doesn't work
**Fix:** Check browser console for errors. File upload backend may need configuration.

### ❌ Issue: 403 errors in console
**Fix:** These are from `subscription_events` or `renewal_schedule` tables. Can be ignored for now (RLS policies may need adjustment).

### ❌ Issue: Redirect doesn't happen
**Fix:** Check browser console for JavaScript errors. Clear browser cache and reload.

### ❌ Issue: Subscription doesn't show in dashboard
**Fix:** 
1. Check if user is logged in
2. Verify `user_id` matches in database
3. Check browser console for API errors

---

## ✅ **Success Criteria**

All tests pass if:
1. ✅ User can view subscription plans
2. ✅ User can navigate to checkout
3. ✅ User can select manual payment
4. ✅ User can fill payment form
5. ✅ User can submit (creates pending subscription)
6. ✅ Subscription shows in dashboard as "Pending"
7. ✅ Admin can activate subscription
8. ✅ User can access features after activation
9. ✅ Restrictions apply based on plan
10. ✅ Cannot duplicate subscriptions

---

## 🔄 **Next: Test Stripe Payment**

After manual payment works, test Stripe:
1. Configure Stripe API keys in Supabase Edge Functions
2. Deploy `create-checkout` function
3. Test Stripe redirect flow
4. Verify webhook activation

---

## 📝 **Test Results Template**

Copy and fill out:

```
# Test Results - Manual Payment Flow
Date: _______________
Tester: _______________

TEST 1 - View Plans: [ PASS / FAIL ]
TEST 2 - Navigate Checkout: [ PASS / FAIL ]
TEST 3 - Select Manual: [ PASS / FAIL ]
TEST 4 - Fill Form: [ PASS / FAIL ]
TEST 5 - Submit: [ PASS / FAIL ]
TEST 6 - View Dashboard: [ PASS / FAIL ]
TEST 7 - Check Database: [ PASS / FAIL ]
TEST 8 - Admin Approval: [ PASS / FAIL ]
TEST 9 - Verify Restrictions: [ PASS / FAIL ]
TEST 10 - Return to Plans: [ PASS / FAIL ]

OVERALL: [ PASS / FAIL ]

Notes:
_________________________________
_________________________________
```

---

## 🎯 **Quick Test Checklist**

- [ ] Login works
- [ ] View subscription plans
- [ ] Click "Start Free Trial"
- [ ] Select "Manual Payment"
- [ ] Fill reference: `TEST-REF-12345`
- [ ] Upload proof file
- [ ] Check terms
- [ ] Click submit
- [ ] Toast shows success
- [ ] Redirect to dashboard
- [ ] Status shows "Pending"
- [ ] Database has records
- [ ] Admin can activate
- [ ] User sees active subscription

---

**🎉 Ready to test! Follow each step carefully and check off the boxes.**
