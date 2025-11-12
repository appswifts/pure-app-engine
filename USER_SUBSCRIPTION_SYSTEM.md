# ✅ USER-BASED SUBSCRIPTION SYSTEM

**Status:** ✅ Production Ready  
**Model:** User subscriptions (not restaurant subscriptions)

---

## 🎯 **SYSTEM OVERVIEW**

### **How It Works:**
```
User (Restaurant Owner)
   ↓
Has Subscription (with Package)
   ↓
Package defines Features
   ↓
User can create Restaurants (up to limit)
   ↓
All user's restaurants inherit user's features
   ↓
Public menus check OWNER's subscription
```

**Key Concept:** The **USER** (restaurant owner) has the subscription, not the restaurant!

---

## 📊 **DATABASE STRUCTURE**

### **Table: `user_subscriptions`**
```sql
user_id              UUID (→ auth.users)
package_name         TEXT (→ subscription_packages)
status               active/pending/expired/cancelled/suspended
started_at           DATE
expires_at           DATE
billing_cycle        monthly/yearly/lifetime
amount_paid          DECIMAL
restaurants_count    INTEGER (auto-tracked)
menu_items_count     INTEGER (auto-tracked)
notes                TEXT
```

**One subscription per user!**

---

## 🔐 **ACCESS CONTROL**

### **What Gets Checked:**

**For Public Menu Access:**
```
1. Get restaurant → Get owner (user_id)
2. Check owner's subscription
3. Check if subscription is active
4. Check if package allows public_menu_access
5. Grant or deny access
```

**For Creating Restaurants:**
```
1. Get user's subscription
2. Check max_restaurants limit
3. Check current restaurants_count
4. Allow if: restaurants_count < max_restaurants
```

**For Using Features:**
```
1. Get user's subscription
2. Check package features
3. Enable/disable UI based on features:
   - Analytics dashboard
   - WhatsApp orders
   - Custom branding
   - QR codes
   - Priority support
   - API access
```

---

## 💡 **USER WORKFLOW**

### **New User Signs Up:**
```
Step 1: User creates account
Step 2: Admin assigns subscription package
Step 3: User can now create restaurants (up to limit)
Step 4: All features from package apply
```

### **Creating a Restaurant:**
```
User with "Basic" package (max 1 restaurant):
✅ Can create 1st restaurant
❌ Cannot create 2nd restaurant (limit reached)

User with "Professional" package (max 3 restaurants):
✅ Can create 1st restaurant
✅ Can create 2nd restaurant
✅ Can create 3rd restaurant
❌ Cannot create 4th restaurant (limit reached)
```

### **Public Menu Access:**
```
Customer visits: /menu/restaurant-slug/table1

System checks:
1. Get restaurant → owner: user@example.com
2. Check user@example.com's subscription
3. Status: active ✅
4. Package: "Basic"
5. Feature: public_menu_access = true ✅
6. Result: Show menu

If owner's subscription expired:
❌ Block menu access
Show: "Owner's subscription has expired"
```

---

## 🎨 **ADMIN INTERFACE**

### **Page: `/admin/subscriptions`**

**Features:**
- ✅ List all user subscriptions
- ✅ Show user email
- ✅ Show package assigned
- ✅ Show status (active/expired/pending)
- ✅ Show restaurants count (X / max)
- ✅ Days until expiry
- ✅ Assign package to user
- ✅ Edit subscription
- ✅ Track payments
- ✅ Add notes

**View:**
```
┌────────────────────────────────────────┐
│ User Subscriptions                     │
│                                        │
│ ✓ user@example.com                     │
│   Package: Basic | Active              │
│   Expires: Jan 15 (5d left)            │
│   🏪 1 / 1 restaurants                 │
│   [Edit] [Delete]                      │
│                                        │
│ ✓ owner@restaurant.com                 │
│   Package: Professional | Active       │
│   Expires: Feb 1 (21d left)            │
│   🏪 2 / 3 restaurants                 │
│   [Edit] [Delete]                      │
└────────────────────────────────────────┘
```

---

## ⚡ **DATABASE FUNCTIONS**

### **Function 1: Check User Feature**
```sql
SELECT user_has_feature('user-uuid', 'public_menu_access');
-- Returns: true/false

SELECT user_has_feature('user-uuid', 'analytics');
-- Returns: true/false
```

**Usage in Code:**
```typescript
const { data } = await supabase
  .rpc('user_has_feature', {
    p_user_id: userId,
    p_feature_name: 'whatsapp_orders'
  });

if (data) {
  // Show WhatsApp orders feature
}
```

### **Function 2: Get User Limits**
```sql
SELECT * FROM get_user_subscription_limits('user-uuid');
-- Returns:
{
  max_restaurants: 3,
  max_menu_items: 500,
  current_restaurants: 2,
  current_menu_items: 145,
  can_create_restaurant: true,
  can_create_menu_items: true
}
```

### **Function 3: Get Full Subscription**
```sql
SELECT * FROM get_user_subscription('user-uuid');
-- Returns subscription + package + features + limits
```

---

## 🚀 **QUICK START GUIDE**

### **1. Create Subscription Packages** (if not done)
```
Go to: /admin/packages
Create packages:
- Free Trial (1 restaurant, basic features)
- Basic (1 restaurant, standard features)
- Professional (3 restaurants, all features)
```

### **2. Assign Subscription to User**
```
Go to: /admin/subscriptions
Click: "Add Subscription"

Select:
- User: user@example.com
- Package: "Basic"
- Status: "active"
- Start: Today
- Expiry: 30 days from now
- Billing: "monthly"

Click: "Create Subscription"
✅ Done!
```

### **3. User Creates Restaurant**
```
User logs in → Dashboard
Clicks: "Create Restaurant"

System checks:
- User has subscription? ✅
- Subscription active? ✅
- Under restaurant limit? ✅
- Creates restaurant!

restaurants_count auto-increments!
```

### **4. Public Menu Works**
```
Customer visits: /menu/restaurant-slug/table1

System checks owner's subscription:
- Active? ✅
- Package allows menu? ✅
- Shows menu!
```

---

## 🎯 **PACKAGE EXAMPLES**

### **Free Trial Package**
```
Name: Free Trial
Price: 0 RWF/month
Duration: 7 days

Limits:
- Max Restaurants: 1
- Max Menu Items: 20

Features:
✅ Public Menu Access
✅ QR Codes
❌ WhatsApp Orders
❌ Analytics
❌ Custom Branding
❌ Priority Support
❌ API Access

Use Case: Let users try the system
```

### **Basic Package**
```
Name: Basic
Price: 15,000 RWF/month

Limits:
- Max Restaurants: 1
- Max Menu Items: 100

Features:
✅ Public Menu Access
✅ QR Codes
✅ WhatsApp Orders
❌ Analytics
❌ Custom Branding
❌ Priority Support
❌ API Access

Use Case: Single restaurant owners
```

### **Professional Package**
```
Name: Professional
Price: 35,000 RWF/month

Limits:
- Max Restaurants: 3
- Max Menu Items: 500

Features:
✅ Public Menu Access
✅ QR Codes
✅ WhatsApp Orders
✅ Analytics Dashboard
✅ Custom Branding
✅ Priority Support
❌ API Access

Use Case: Multi-restaurant owners
```

### **Enterprise Package**
```
Name: Enterprise
Price: 75,000 RWF/month

Limits:
- Max Restaurants: 10
- Max Menu Items: Unlimited

Features:
✅ ALL FEATURES ENABLED
Including API Access

Use Case: Restaurant chains
```

---

## 📋 **USAGE TRACKING**

### **Automatic Tracking:**
```sql
-- When user creates restaurant
restaurants_count += 1

-- When user deletes restaurant
restaurants_count -= 1

-- Tracked automatically via trigger!
```

### **Check Usage:**
```sql
SELECT 
  u.email,
  us.package_name,
  us.restaurants_count,
  sp.max_restaurants,
  CASE 
    WHEN us.restaurants_count >= sp.max_restaurants 
    THEN 'LIMIT REACHED'
    ELSE 'CAN CREATE MORE'
  END as status
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
JOIN subscription_packages sp ON us.package_name = sp.name
WHERE us.status = 'active';
```

---

## 🚨 **LIMIT ENFORCEMENT**

### **Before Creating Restaurant:**
```typescript
// Check if user can create restaurant
const { data: limits } = await supabase
  .rpc('get_user_subscription_limits', {
    p_user_id: userId
  });

if (!limits?.can_create_restaurant) {
  toast({
    title: "Limit Reached",
    description: `Your ${packageName} plan allows ${maxRestaurants} restaurants. Upgrade to create more.`,
    variant: "destructive"
  });
  return;
}

// Proceed with creation...
```

### **In Restaurant Creation Form:**
```typescript
const canCreate = limits?.can_create_restaurant;

<Button disabled={!canCreate}>
  {canCreate ? 'Create Restaurant' : 'Upgrade to Create More'}
</Button>

{!canCreate && (
  <Alert>
    Your plan limit: {currentCount} / {maxRestaurants} restaurants
    <Link to="/upgrade">Upgrade Plan</Link>
  </Alert>
)}
```

---

## 💰 **SUBSCRIPTION LIFECYCLE**

### **Status Flow:**
```
New User (no subscription)
   ↓
Admin assigns → pending
   ↓
Payment received → active
   ↓
Using features...
   ↓
Expires → expired (7-day grace)
   ↓
Grace period ends → blocked
   ↓
Admin renews → active
   ↓
Or admin cancels → cancelled (immediate block)
```

### **Grace Period (7 days):**
```
Day 0: Subscription expires
Days 1-7: Grace period
  - Menus still accessible
  - Dashboard shows warning
  - Can renew to continue

Day 8+: No grace
  - Menus blocked
  - Must renew to access
```

---

## 🎨 **UI FEATURE CHECKS**

### **Example: Analytics Dashboard**
```typescript
const { data: hasAnalytics } = await supabase
  .rpc('user_has_feature', {
    p_user_id: user.id,
    p_feature_name: 'analytics'
  });

return (
  <div>
    {hasAnalytics ? (
      <AnalyticsDashboard />
    ) : (
      <UpgradePrompt feature="Analytics Dashboard" />
    )}
  </div>
);
```

### **Example: Create Restaurant Button**
```typescript
const { data: limits } = await supabase
  .rpc('get_user_subscription_limits', {
    p_user_id: user.id
  });

const canCreate = limits?.can_create_restaurant;

return (
  <Button disabled={!canCreate}>
    Create Restaurant
    {!canCreate && ` (${limits.current_restaurants}/${limits.max_restaurants} limit)`}
  </Button>
);
```

---

## 📊 **ADMIN QUERIES**

### **Find Users Without Subscription:**
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN user_subscriptions us ON u.id = us.user_id
WHERE us.id IS NULL;
```

### **Find Expiring Subscriptions:**
```sql
SELECT 
  u.email,
  us.package_name,
  us.expires_at,
  us.expires_at - CURRENT_DATE as days_left
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
WHERE us.status = 'active'
  AND us.expires_at <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY us.expires_at ASC;
```

### **Revenue Report:**
```sql
SELECT 
  package_name,
  billing_cycle,
  COUNT(*) as active_subscriptions,
  SUM(amount_paid) as total_revenue
FROM user_subscriptions
WHERE status = 'active'
  AND last_payment_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY package_name, billing_cycle
ORDER BY total_revenue DESC;
```

### **Users At Limit:**
```sql
SELECT 
  u.email,
  us.package_name,
  us.restaurants_count,
  sp.max_restaurants
FROM user_subscriptions us
JOIN auth.users u ON us.user_id = u.id
JOIN subscription_packages sp ON us.package_name = sp.name
WHERE us.restaurants_count >= sp.max_restaurants
  AND us.status = 'active';
```

---

## ✅ **COMPLETE SYSTEM**

**What You Have:**

1. ✅ **user_subscriptions** table (tracks user subscriptions)
2. ✅ **Admin UI** to assign subscriptions to users
3. ✅ **Automatic usage tracking** (restaurants count)
4. ✅ **Database functions** for feature checks
5. ✅ **Public menu** checks owner's subscription
6. ✅ **Limit enforcement** (max restaurants)
7. ✅ **Grace period** (7 days after expiry)
8. ✅ **Feature-based access control**

**You Can Now:**

- ✅ Assign subscription packages to users
- ✅ Control what users can do (limits & features)
- ✅ Track usage automatically
- ✅ Enforce restaurant limits
- ✅ Block expired subscriptions
- ✅ Enable/disable features per package
- ✅ Manage renewals & payments
- ✅ View subscription status
- ✅ Generate reports

---

## 🎉 **KEY DIFFERENCE**

### **OLD (Restaurant-based):**
```
Restaurant has subscription
→ Control that restaurant's menu
```

### **NEW (User-based):**
```
User (owner) has subscription
→ Controls ALL their restaurants
→ Limits how many restaurants
→ Defines features available
```

**This is the correct model for SaaS!**

---

**Status:** ✅ **USER SUBSCRIPTION SYSTEM COMPLETE!**

**Admin Access:**
- Packages: `/admin/packages`
- User Subscriptions: `/admin/subscriptions`

**Start assigning subscriptions to users now!** 🚀
