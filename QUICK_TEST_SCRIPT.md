# ⚡ Quick Manual Payment Test Script

**Fast 5-minute test to verify manual payment workflow**

---

## 🚀 **Quick Start (Copy & Paste)**

### 1️⃣ **Ensure Server is Running**
```powershell
# In terminal, navigate to project
cd c:\Users\FH\Desktop\blank-project\pure-app-engine

# Start dev server (if not running)
npm run dev
```

### 2️⃣ **Login**
1. Open browser: `http://localhost:8080/auth`
2. Login with your credentials
3. Verify you see the dashboard

### 3️⃣ **Navigate to Subscriptions**
```
URL: http://localhost:8080/subscriptions
```

### 4️⃣ **Select Starter Plan**
- Click: **"Start Free Trial"** button
- You'll be at: `/subscriptions/checkout/[id]`

### 5️⃣ **Choose Manual Payment**
- Click: **"Manual Payment"** radio button
- Form appears with:
  - Reference field
  - File upload
  - Terms checkbox

### 6️⃣ **Fill Form**
```
Reference: TEST-REF-12345
File: [Select any image/PDF]
✓ Check terms checkbox
```

### 7️⃣ **Submit**
- Click: **"Start 14 day Free Trial"**
- Wait for toast: "Subscription Created"
- Auto-redirect to: `/dashboard/subscription`

### 8️⃣ **Verify Dashboard**
Check for:
- ✅ Subscription shows "Pending" status
- ✅ Plan: Starter Plan
- ✅ Message about admin approval

---

## 🗄️ **Database Verification**

### Open Supabase Dashboard:
```
https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv
```

### Check Tables:

#### **customer_subscriptions:**
```sql
SELECT status, product_id, created_at 
FROM customer_subscriptions 
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** `status = 'pending'`

#### **subscription_orders:**
```sql
SELECT payment_status, payment_reference, payment_notes 
FROM subscription_orders 
ORDER BY created_at DESC 
LIMIT 1;
```
**Expected:** 
- `payment_status = 'pending'`
- `payment_reference = 'TEST-REF-12345'`

---

## ✅ **Success Indicators**

### Frontend:
- [x] No console errors
- [x] Smooth navigation
- [x] Toast messages appear
- [x] Redirect works
- [x] Dashboard loads subscription

### Backend:
- [x] Database records created
- [x] Correct status: "pending"
- [x] Reference saved
- [x] File info logged

---

## 🎬 **Screen Recording Checklist**

If recording the test:
1. Start recording
2. Show login page → login
3. Navigate to /subscriptions
4. Click "Start Free Trial"
5. Show checkout page loads
6. Select "Manual Payment"
7. Fill reference field
8. Upload file
9. Check terms
10. Click submit button
11. Show toast notification
12. Show dashboard with pending subscription
13. Open Supabase → show database records
14. Stop recording

---

## 🔧 **Troubleshooting**

### ❌ Button Won't Enable
**Cause:** Missing form data
**Fix:** Ensure all 3 fields filled:
- Reference number ✓
- File uploaded ✓
- Terms checked ✓

### ❌ Redirect Fails
**Cause:** Navigation error
**Fix:** Check browser console, look for errors

### ❌ Dashboard Empty
**Cause:** Database query issue
**Fix:** Check user is logged in, verify user_id matches

### ❌ 403 Errors in Console
**Cause:** RLS policies on events table
**Fix:** Safe to ignore for now, subscription still works

---

## 🎯 **Expected Timeline**

- Login: **10 seconds**
- Navigate: **5 seconds**
- Checkout form: **20 seconds**
- Fill form: **30 seconds**
- Submit + redirect: **10 seconds**
- Verify dashboard: **10 seconds**
- Check database: **30 seconds**

**Total: ~2 minutes**

---

## 📊 **Test Report Template**

```
=================================
MANUAL PAYMENT TEST RESULTS
=================================
Date: [DATE]
Time: [TIME]
Tester: [NAME]

FRONTEND TESTS:
[ ] Login successful
[ ] View subscriptions page
[ ] Navigate to checkout
[ ] Manual payment form loads
[ ] Form validation works
[ ] Submit successful
[ ] Toast notification shows
[ ] Redirect to dashboard
[ ] Dashboard displays subscription

DATABASE TESTS:
[ ] customer_subscriptions record created
[ ] Status = 'pending'
[ ] subscription_orders record created
[ ] Payment reference saved
[ ] File info logged

OVERALL: [ PASS / FAIL ]

ISSUES FOUND:
_________________________________
_________________________________

NOTES:
_________________________________
_________________________________
```

---

## 🚦 **Next Steps After Success**

1. ✅ Manual payment works
2. 🔄 Test admin approval flow
3. 🔄 Configure Stripe API keys
4. 🔄 Deploy Supabase Edge Functions
5. 🔄 Test Stripe checkout flow
6. 🔄 Test webhook activation

---

**🎉 START TESTING NOW!**

Open your browser and follow steps 1-8 above.
