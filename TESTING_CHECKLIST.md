# ✅ Subscription Testing Checklist

**Complete testing checklist for manual payment and subscription workflow**

---

## 🎯 **Test Objectives**

Test that users can:
1. View subscription plans
2. Subscribe using manual payment
3. See their subscription in the dashboard
4. Admin can approve subscriptions
5. Users can access features based on their plan

---

## 📋 **PHASE 1: Manual Payment Flow**

### **A. Initial Setup**
- [ ] Dev server running on port 8080
- [ ] User account created
- [ ] User is logged in
- [ ] Supabase connection working

### **B. View Subscription Plans**
- [ ] Navigate to `http://localhost:8080/subscriptions`
- [ ] Page loads without errors
- [ ] 3 plans visible:
  - [ ] Starter Plan (RWF 15,000)
  - [ ] Professional Plan (RWF 29,000)
  - [ ] Enterprise Plan (RWF 75,000)
- [ ] Trial badges show on Starter & Professional
- [ ] Features list visible for each plan
- [ ] Pricing displays correctly

### **C. Navigate to Checkout**
- [ ] Click "Start Free Trial" on Starter Plan
- [ ] Redirects to checkout page
- [ ] URL matches: `/subscriptions/checkout/[productId]`
- [ ] Page loads completely
- [ ] No console errors

### **D. Checkout Page - Order Summary**
- [ ] Plan name displays: "Starter Plan"
- [ ] Description shows
- [ ] Features list visible
- [ ] Pricing breakdown shows:
  - [ ] Subscription price
  - [ ] Trial information (14 days)
  - [ ] Total today: RWF 0
- [ ] "Secure payment processing" message visible

### **E. Checkout Page - Payment Methods**
- [ ] "Payment Method" section visible
- [ ] Two payment options show:
  - [ ] Stripe Global
  - [ ] Manual Payment
- [ ] Stripe selected by default
- [ ] Can switch to Manual Payment

### **F. Manual Payment Form**
- [ ] Click "Manual Payment" radio button
- [ ] Form appears with:
  - [ ] Amber instruction box
  - [ ] "Payment Reference Number" field
  - [ ] "Upload Proof of Payment" file input
- [ ] Instructions clear and readable
- [ ] No visual glitches

### **G. Fill Manual Payment Form**
- [ ] Enter reference: `TEST-REF-12345`
- [ ] Click file upload
- [ ] Select any image or PDF file
- [ ] Filename displays after selection
- [ ] Check "I agree to Terms..." checkbox
- [ ] Submit button enables after all fields filled

### **H. Submit Subscription**
- [ ] Click submit button (shows "Start 14 day Free Trial")
- [ ] Button changes to "Processing..."
- [ ] Toast notification appears:
  - [ ] Title: "Subscription Created"
  - [ ] Message mentions admin review
  - [ ] Duration: 6 seconds
- [ ] Auto-redirects to `/dashboard/subscription`
- [ ] No errors in console

### **I. View Subscription Dashboard**
- [ ] Page loads successfully
- [ ] Subscription card shows:
  - [ ] Plan name: "Starter Plan"
  - [ ] Status: "Pending" or "Pending Payment"
  - [ ] Price: RWF 15,000/month
  - [ ] Trial: 14 days
- [ ] Message about awaiting approval visible
- [ ] "View Details" or similar action available

---

## 📋 **PHASE 2: Database Verification**

### **A. Check customer_subscriptions Table**
```sql
SELECT * FROM customer_subscriptions 
ORDER BY created_at DESC LIMIT 1;
```
- [ ] New record exists
- [ ] `status` = `'pending'`
- [ ] `user_id` matches your user ID
- [ ] `product_id` matches Starter Plan ID
- [ ] `trial_start_date` is set
- [ ] `trial_end_date` is set (14 days from now)
- [ ] `created_at` is recent

### **B. Check subscription_orders Table**
```sql
SELECT * FROM subscription_orders 
ORDER BY created_at DESC LIMIT 1;
```
- [ ] New order record exists
- [ ] `payment_status` = `'pending'`
- [ ] `order_status` = `'pending_payment'`
- [ ] `payment_reference` = `'TEST-REF-12345'`
- [ ] `payment_notes` contains filename
- [ ] `gateway_id` is set (manual payment gateway)
- [ ] `amount` = 15000
- [ ] `currency` = 'RWF'

### **C. Check subscription_events Table** (Optional)
```sql
SELECT * FROM subscription_events 
WHERE subscription_id = '[your-subscription-id]'
ORDER BY created_at DESC;
```
- [ ] Event: "subscription_created"
- [ ] Event: "status_changed" (to pending)
- [ ] Timestamps are correct
- [ ] Details field has relevant info

---

## 📋 **PHASE 3: Admin Approval Flow**

### **A. Simulate Admin Approval**
In Supabase Table Editor:
- [ ] Open `customer_subscriptions` table
- [ ] Find your subscription record
- [ ] Click to edit
- [ ] Change `status` from `'pending'` to `'active'`
- [ ] Save changes

### **B. Verify Activation**
- [ ] Return to `/dashboard/subscription`
- [ ] Refresh the page
- [ ] Status now shows: "Active"
- [ ] Trial countdown visible (shows days remaining)
- [ ] Features are accessible
- [ ] Green checkmark or success indicator

---

## 📋 **PHASE 4: Feature Access & Restrictions**

### **A. Starter Plan Limits**
- [ ] Navigate to restaurants page
- [ ] Can create up to 1 restaurant
- [ ] Try creating 2nd restaurant:
  - [ ] Should show limit warning
  - [ ] Cannot exceed limit

### **B. Menu Item Limits**
- [ ] Navigate to menu items
- [ ] Can create up to 50 menu items
- [ ] Try creating 51st item:
  - [ ] Should show limit warning
  - [ ] Cannot exceed limit

### **C. Feature Access**
Check which features are enabled:
- [ ] QR Codes: ✅ Enabled
- [ ] Analytics: ✅ Enabled
- [ ] WhatsApp Notifications: ❌ Disabled (shows upgrade prompt)
- [ ] Custom Branding: ❌ Disabled (shows upgrade prompt)
- [ ] Priority Support: ❌ Disabled (shows upgrade prompt)
- [ ] Advanced Analytics: ❌ Disabled (shows upgrade prompt)

---

## 📋 **PHASE 5: Subscription Management**

### **A. Return to Subscriptions Page**
- [ ] Navigate to `/subscriptions`
- [ ] Current plan badge shows on Starter Plan
- [ ] Status shows "Active"
- [ ] Other plans show "Upgrade" buttons
- [ ] Cannot subscribe to same plan again

### **B. View Current Subscription**
- [ ] "My Subscription" or similar link visible
- [ ] Click to view details
- [ ] Shows:
  - [ ] Plan name
  - [ ] Status
  - [ ] Next billing date
  - [ ] Payment method
  - [ ] Trial remaining (if applicable)

---

## 📋 **PHASE 6: Error Handling**

### **A. Test Duplicate Subscription**
- [ ] Try subscribing to Starter Plan again
- [ ] Should show error: "Duplicate Subscription"
- [ ] No new records created in database
- [ ] User stays on subscriptions page

### **B. Test Missing Form Data**
- [ ] Go to checkout for another plan
- [ ] Select manual payment
- [ ] Leave reference field empty
- [ ] Try to submit
- [ ] Should show validation error
- [ ] Button stays disabled until all fields filled

### **C. Test Without Terms Acceptance**
- [ ] Fill all form fields
- [ ] Don't check terms checkbox
- [ ] Button should be disabled
- [ ] Cannot submit

---

## 📋 **PHASE 7: Console & Network**

### **A. Browser Console**
- [ ] No JavaScript errors
- [ ] No unhandled promise rejections
- [ ] Auth logs show success
- [ ] API calls complete successfully

### **B. Network Tab**
- [ ] All API calls return 200 or 201
- [ ] POST to `customer_subscriptions`: Success
- [ ] POST to `subscription_orders`: Success
- [ ] PATCH updates: Success
- [ ] 403 errors on `subscription_events`: Safe to ignore (RLS issue)

### **C. Performance**
- [ ] Pages load within 2 seconds
- [ ] No infinite loading states
- [ ] Smooth transitions
- [ ] No UI freezing

---

## 🎯 **Final Checklist**

### **Critical Path (Must Pass)**
- [ ] ✅ User can login
- [ ] ✅ User can view subscription plans
- [ ] ✅ User can navigate to checkout
- [ ] ✅ User can select manual payment
- [ ] ✅ User can fill and submit form
- [ ] ✅ Subscription created as "pending"
- [ ] ✅ User sees subscription in dashboard
- [ ] ✅ Admin can activate subscription
- [ ] ✅ User can access features after activation

### **Nice to Have (Should Pass)**
- [ ] ⭐ No console errors
- [ ] ⭐ Fast page loads
- [ ] ⭐ Smooth animations
- [ ] ⭐ Clear error messages
- [ ] ⭐ Proper validation
- [ ] ⭐ Responsive design

---

## 📊 **Test Results Summary**

```
==================================
SUBSCRIPTION SYSTEM TEST RESULTS
==================================
Date: _______________
Tester: _______________

PHASE 1 - Manual Payment: ___/9 steps passed
PHASE 2 - Database Check: ___/3 sections verified
PHASE 3 - Admin Approval: ___/2 tasks completed
PHASE 4 - Restrictions: ___/3 tests passed
PHASE 5 - Management: ___/2 areas working
PHASE 6 - Error Handling: ___/3 scenarios handled
PHASE 7 - Technical: ___/3 checks passed

TOTAL SCORE: ___/25

OVERALL STATUS: [ ✅ PASS / ❌ FAIL ]

CRITICAL ISSUES:
_________________________________
_________________________________

MINOR ISSUES:
_________________________________
_________________________________

RECOMMENDATIONS:
_________________________________
_________________________________
```

---

## 🚀 **Next Steps After Testing**

### **If ALL Tests Pass:**
1. ✅ Document manual payment workflow
2. ✅ Move to Stripe integration
3. ✅ Configure Stripe API keys
4. ✅ Deploy Edge Functions
5. ✅ Test Stripe checkout
6. ✅ Test webhook flow

### **If Some Tests Fail:**
1. ❌ Document failing tests
2. ❌ Review error messages
3. ❌ Check database schema
4. ❌ Fix issues one by one
5. ❌ Re-test failed scenarios
6. ❌ Update documentation

---

## 📞 **Support**

**Issues Found?**
- Document the exact steps
- Capture screenshots
- Check browser console
- Review Supabase logs
- Check network requests

**Ready to test? Start with Phase 1! 🎉**
