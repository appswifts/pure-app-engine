# 📋 HOW TO ASSIGN SUBSCRIPTIONS TO USERS

**Status:** ✅ Ready to Use  
**Access:** `/admin/subscriptions`

---

## ⚡ **QUICK GUIDE**

### **To Assign a Subscription:**

1. **Go to** `/admin/subscriptions`
2. **Click** "Add Subscription"
3. **Fill the form:**

```
User Identification:
├─ User ID: (paste UUID if you have it)
└─ OR
   User Email: user@example.com ← EASIEST!
   
Package: Select from dropdown (Basic, Pro, etc.)
Status: active
Start Date: Today
Expiry Date: 30 days from now
Billing Cycle: monthly
Amount Paid: 15000 (optional)
Notes: (optional)
```

4. **Click** "Create Subscription"
5. ✅ **Done!** User now has access

---

## 🎯 **TWO WAYS TO IDENTIFY USER**

### **Option 1: By Email (RECOMMENDED)**
```
✅ Easiest method
✅ Human-readable
✅ What users know

How it works:
1. You enter: user@example.com
2. System looks up user_id from restaurants table
3. Creates subscription for that user

Requirements:
- User must have created at least 1 restaurant
- Email must match the email in their restaurant profile
```

### **Option 2: By User ID**
```
✅ Direct method
✅ More technical

How it works:
1. You paste user's UUID
2. Creates subscription directly

Requirements:
- You need to know the user's UUID
- Can get from database query
```

---

## 📊 **STEP-BY-STEP EXAMPLE**

### **Scenario: Assign "Basic" Package to New User**

**Step 1: User creates account**
```
User signs up: owner@restaurant.com
Creates restaurant: "My Cafe"
Restaurant email: owner@restaurant.com
```

**Step 2: Admin assigns subscription**
```
Go to /admin/subscriptions
Click "Add Subscription"

Form:
┌─────────────────────────────────┐
│ User Email:                     │
│ owner@restaurant.com            │ ← Enter this!
│                                 │
│ Package: Basic                  │
│ Status: active                  │
│ Start Date: 2024-01-15          │
│ Expiry Date: 2024-02-15         │
│ Billing Cycle: monthly          │
│ Amount Paid: 15000              │
└─────────────────────────────────┘

Click "Create Subscription"
```

**Step 3: User gains access**
```
User can now:
✅ Their restaurant's public menu is live
✅ Create restaurants (up to package limit)
✅ Access features from "Basic" package
```

---

## 🔍 **HOW EMAIL LOOKUP WORKS**

### **Behind the Scenes:**
```sql
-- When you enter: user@example.com

1. System queries restaurants table:
   SELECT user_id FROM restaurants 
   WHERE email = 'user@example.com'
   LIMIT 1

2. Gets user_id (UUID)

3. Creates subscription:
   INSERT INTO user_subscriptions (user_id, ...)
   VALUES ('uuid-here', ...)

4. Done!
```

---

## ⚠️ **COMMON ISSUES & SOLUTIONS**

### **Issue 1: "No user found with email"**
```
Error: No user found with email: user@example.com

Cause: User hasn't created a restaurant yet

Solution:
1. Ask user to create their first restaurant
2. Make sure they use the same email
3. Try again
```

### **Issue 2: Email doesn't match**
```
User's account: john@gmail.com
Restaurant email: john@company.com

Problem: System looks for restaurant email, not auth email

Solution:
- Use the email from the restaurant profile
- Or use User ID directly
```

### **Issue 3: Multiple restaurants, different emails**
```
User has 3 restaurants:
- Restaurant A: email1@example.com
- Restaurant B: email2@example.com
- Restaurant C: email3@example.com

Solution:
- Use any of the emails (system picks first match)
- Or use User ID for precision
```

---

## 📋 **FINDING USER INFORMATION**

### **Method 1: From Restaurant**
```sql
-- User created a restaurant, get their info
SELECT user_id, email, name
FROM restaurants
WHERE email = 'user@example.com'
OR name ILIKE '%restaurant name%';
```

### **Method 2: From Existing Subscription**
```sql
-- Check if user already has subscription
SELECT * FROM user_subscriptions
WHERE user_id IN (
  SELECT user_id FROM restaurants 
  WHERE email = 'user@example.com'
);
```

### **Method 3: List All Users with Restaurants**
```sql
SELECT 
  r.user_id,
  r.email,
  r.name as restaurant_name,
  us.package_name,
  us.status
FROM restaurants r
LEFT JOIN user_subscriptions us ON r.user_id = us.user_id
ORDER BY r.created_at DESC;
```

---

## 🎨 **ADMIN UI FEATURES**

### **Subscription List Shows:**
```
✓ User Email (from restaurant)
✓ Package Name
✓ Status Badge (active/expired/pending)
✓ Start & Expiry Dates
✓ Days until expiry
✓ Restaurant Count (2 / 3 limit)
✓ Edit/Delete Actions
```

### **Form Validation:**
```
✅ Must provide User ID OR Email
✅ Must select package
✅ Dates validated
✅ Billing cycle required
✅ Amount is optional
```

---

## 💡 **BEST PRACTICES**

### **1. Use Email for New Subscriptions**
```
✅ Easier to remember
✅ Human-readable
✅ Less error-prone
```

### **2. Use User ID for Updates**
```
When editing existing subscription:
- User ID is pre-filled
- Can't be changed
- More precise
```

### **3. Set Reasonable Expiry Dates**
```
Monthly: 30 days
Yearly: 365 days
Trial: 7 days
```

### **4. Track Payments**
```
Always fill "Amount Paid" field:
- Helps with accounting
- Revenue tracking
- Audit trail
```

### **5. Add Notes**
```
Examples:
- "Upgraded from Basic to Pro"
- "Trial period - expires Jan 15"
- "Paid via mobile money"
- "Special discount applied"
```

---

## 🚀 **COMMON WORKFLOWS**

### **Workflow 1: New User Trial**
```
1. User signs up
2. Creates first restaurant
3. Admin assigns "Free Trial"
   - Email: user@example.com
   - Package: Free Trial
   - Expiry: 7 days
4. User tries system
5. Admin upgrades to paid after trial
```

### **Workflow 2: Paid Subscription**
```
1. User signs up
2. User pays 15,000 RWF
3. Admin assigns "Basic"
   - Email: user@example.com
   - Package: Basic
   - Amount Paid: 15000
   - Expiry: 30 days
4. User has full access
5. Admin renews monthly
```

### **Workflow 3: Upgrade Plan**
```
1. User has "Basic" (1 restaurant)
2. User wants to create 2nd restaurant
3. User pays for upgrade
4. Admin edits subscription
   - Change package: Basic → Professional
   - Extend expiry: +30 days
   - Update amount
5. User can now create 3 restaurants
```

### **Workflow 4: Renewal**
```
1. Subscription expires in 3 days
2. Admin sees warning
3. User pays renewal
4. Admin edits subscription
   - Keep package: Basic
   - Extend expiry: +30 days
   - Add payment amount
   - Status: active
5. Access continues
```

---

## ✅ **QUICK CHECKLIST**

**Before Creating Subscription:**
- [ ] User has created a restaurant
- [ ] You know their email OR user ID
- [ ] Package is created and active
- [ ] Dates are reasonable
- [ ] Payment received (if paid)

**After Creating Subscription:**
- [ ] User receives access confirmation
- [ ] Public menus work
- [ ] Features are enabled
- [ ] Limits apply correctly
- [ ] Payment recorded

---

## 🎯 **TESTING**

### **Test 1: Create Subscription by Email**
```
1. Get a test user's restaurant email
2. Go to /admin/subscriptions
3. Click "Add Subscription"
4. Enter email (not UUID)
5. Select package
6. Submit
Expected: ✅ Success message
```

### **Test 2: Verify Access**
```
1. After assigning subscription
2. Visit user's restaurant menu
3. Check it loads
Expected: ✅ Menu accessible
```

### **Test 3: Check Limits**
```
1. Assign "Basic" (max 1 restaurant)
2. User tries to create 2nd restaurant
Expected: ❌ Blocked with upgrade prompt
```

---

## 📖 **SUMMARY**

**To Assign Subscription:**
1. ✅ Go to `/admin/subscriptions`
2. ✅ Click "Add Subscription"
3. ✅ Enter user email OR user ID
4. ✅ Select package
5. ✅ Set dates & status
6. ✅ Save

**User Email is EASIEST:**
- Just type the email from their restaurant
- System finds user automatically
- No need for UUID

**Now you can easily assign subscriptions!** 🎉
