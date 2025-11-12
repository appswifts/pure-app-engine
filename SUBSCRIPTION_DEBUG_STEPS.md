# 🔍 SUBSCRIPTION DEBUG STEPS

**Issue:** `appswifts@gmail.com` shows "active subscription" but admin didn't activate it  
**Status:** 🔧 Debugging Required

---

## 🎯 **PROBLEM ANALYSIS**

### **Code Issue Found:**
```typescript
// Line 70-71: Query loads BOTH active AND pending
.in('status', ['active', 'pending'])

// Line 108: But only checks for 'active' in display logic
userSubscription?.status === 'active'
```

**This means:**
- ✅ Query loads pending subscriptions
- ❌ Display treats them as active
- 🐛 **BUG: Pending subscriptions show as "Current Plan"**

---

## 🔧 **IMMEDIATE STEPS TO DEBUG**

### **Step 1: Check Database Directly**
```sql
-- Find the user's subscription
SELECT us.*, r.email, r.name 
FROM user_subscriptions us
LEFT JOIN restaurants r ON r.user_id = us.user_id
WHERE r.email = 'appswifts@gmail.com';

-- Check what status it has
SELECT status, package_name, created_at, expires_at
FROM user_subscriptions us
JOIN restaurants r ON r.user_id = us.user_id
WHERE r.email = 'appswifts@gmail.com';
```

### **Step 2: Check Admin Panel**
```
1. Go to /admin/subscriptions
2. Search for appswifts@gmail.com
3. Check the status column
4. Look for any 'pending' entries
```

### **Step 3: Browser Console Debug**
```javascript
// Add this to browser console on dashboard
console.log('User subscription data:', userSubscription);
console.log('Status:', userSubscription?.status);
console.log('Package:', userSubscription?.package_name);
```

---

## 🛠️ **LIKELY SCENARIOS**

### **Scenario A: Pending Subscription**
```
Database: status = 'pending'
Display:  Shows as "Current Plan" ❌
Fix:     Update display logic
```

### **Scenario B: Test Data**
```
Database: Old test subscription exists
Display:  Shows as active
Fix:     Delete test subscription
```

### **Scenario C: Admin Error**
```
Database: Admin accidentally created subscription
Display:  Shows correctly but shouldn't exist
Fix:     Delete unwanted subscription
```

---

## 🔧 **QUICK FIXES**

### **Fix 1: Update Display Logic (Recommended)**
```typescript
// Change line 108 from:
userSubscription?.status === 'active'

// To:
userSubscription?.status === 'active' && userSubscription?.package_name === packageName
```

### **Fix 2: Update Query Logic**
```typescript
// Change lines 70-71 from:
.in('status', ['active', 'pending'])

// To:
.eq('status', 'active')  // Only load truly active subscriptions
```

### **Fix 3: Add Status Display**
```typescript
// Show the actual status in the UI
Current Plan: {userSubscription.package_name} ({userSubscription.status})
```

---

## 🎯 **RECOMMENDED SOLUTION**

### **Immediate Fix:**
1. ✅ Update the `isCurrentPackage` function to be more strict
2. ✅ Only show "Current Plan" for truly active subscriptions
3. ✅ Add status display for transparency

### **Code Changes Needed:**
```typescript
// Fix the logic to only highlight truly active subscriptions
const isCurrentPackage = (packageName: string) => {
  return userSubscription?.package_name === packageName && 
         userSubscription?.status === 'active';
};

// Update query to be more explicit about what we want
const { data: subscriptionData, error: subscriptionError } = await (supabase as any)
  .from('user_subscriptions')
  .select('id, package_name, status, expires_at')
  .eq('user_id', user.id)
  .eq('status', 'active')  // Only active subscriptions
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

---

## 📋 **DEBUGGING CHECKLIST**

### **Check These Items:**
```
□ What is the actual status in user_subscriptions table?
□ Is there a pending subscription that shouldn't be there?
□ Did admin accidentally create a subscription?
□ Is the display logic working correctly?
□ Are there multiple subscriptions for this user?
```

### **Admin Actions:**
```
□ Go to /admin/subscriptions
□ Find appswifts@gmail.com entry
□ Check status (should be pending, not active)
□ Delete if it's unwanted test data
□ Update status if it should be active
```

---

## 🚨 **URGENT ACTION NEEDED**

**The bug is in the code logic - pending subscriptions are showing as active!**

**Quick Fix Command:**
1. Update the subscription query to only load active subscriptions
2. Or fix the display logic to properly check status
3. Check admin panel for any unwanted subscriptions

---

**This is a display bug that makes pending subscriptions appear active!** 🐛
