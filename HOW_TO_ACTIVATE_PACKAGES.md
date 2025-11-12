# 🎯 HOW TO ACTIVATE SUBSCRIPTION PACKAGES ON RESTAURANTS

**Goal:** Control restaurant features by assigning subscription packages

---

## 📊 **THE CONNECTION**

### **Flow:**
```
Subscription Package (feature_public_menu_access = true/false)
         ↓
Restaurant (subscription_package_name = "Basic")
         ↓
Public Menu Check (reads package features)
         ↓
Access Granted/Denied
```

---

## 🔧 **RESTAURANT SUBSCRIPTION FIELDS**

### **In `restaurants` table:**
```sql
subscription_package_name    TEXT           -- "Basic", "Pro", etc.
subscription_status          ENUM           -- 'active', 'pending', 'expired', 'cancelled'
subscription_start_date      DATE           -- When subscription started
subscription_end_date        DATE           -- When subscription expires
is_menu_active              BOOLEAN        -- Manual override (admin can disable)
```

---

## 📋 **HOW TO ASSIGN A PACKAGE TO A RESTAURANT**

### **Method 1: SQL (Manual)**
```sql
UPDATE restaurants
SET 
  subscription_package_name = 'Basic',
  subscription_status = 'active',
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
  is_menu_active = true
WHERE slug = 'restaurant-slug';
```

### **Method 2: Admin UI (Recommended)**
```
Need to create an admin page:
/admin/restaurants → Click restaurant → Manage Subscription
```

---

## 🎯 **SUBSCRIPTION WORKFLOW**

### **Step 1: Restaurant Signs Up**
```
Default State:
├─ subscription_package_name: NULL
├─ subscription_status: 'pending'
├─ subscription_start_date: NULL
├─ subscription_end_date: NULL
└─ is_menu_active: true

Result: Menu NOT accessible (no package assigned)
```

### **Step 2: Admin Assigns Package**
```
Admin Action:
├─ Assign package: "Basic"
├─ Set status: 'active'
├─ Set start date: Today
├─ Set end date: Today + 30 days
└─ Keep menu active: true

Result: Menu accessible with Basic features
```

### **Step 3: Subscription Expires**
```
Automatic (after end_date):
├─ subscription_status: 'expired'
├─ Grace period: 7 days
└─ After grace: Menu blocked

Result: Menu accessible for 7 days, then blocked
```

### **Step 4: Renewal**
```
Admin Action:
├─ Update end_date: +30 days
├─ Set status: 'active'
└─ Or upgrade package

Result: Menu accessible again
```

---

## 🔐 **ACCESS CONTROL LOGIC**

### **What The System Checks:**

```typescript
// 1. Check if restaurant has package assigned
const hasPackage = restaurant.subscription_package_name !== null;

// 2. Check if package allows menu access
const packageAllowsAccess = 
  restaurant.subscription_package.feature_public_menu_access === true;

// 3. Check subscription status
const hasValidSubscription = 
  restaurant.subscription_status === 'active' ||
  restaurant.subscription_status === 'pending' ||
  (restaurant.subscription_status === 'expired' && within 7 days);

// 4. Check manual override
const menuActive = restaurant.is_menu_active !== false;

// Final check
const canAccessMenu = hasPackage && 
                      packageAllowsAccess && 
                      hasValidSubscription && 
                      menuActive;
```

---

## 💡 **EXAMPLE SCENARIOS**

### **Scenario 1: New Restaurant (Free Trial)**
```
Assign:
├─ Package: "Free Trial"
├─ Status: 'active'
├─ Start: Today
├─ End: Today + 7 days
└─ Menu Active: true

Features Enabled:
├─ ✅ QR Codes (if package has it)
├─ ✅ Public Menu Access (if package has it)
└─ ❌ Premium features

After 7 days:
├─ Status auto-expires
├─ 7-day grace period
└─ Then menu blocked
```

### **Scenario 2: Paid Subscription (Basic)**
```
Assign:
├─ Package: "Basic"
├─ Status: 'active'
├─ Start: Today
├─ End: Today + 30 days
└─ Menu Active: true

Features Enabled:
├─ ✅ QR Codes
├─ ✅ Public Menu Access
├─ ✅ WhatsApp Orders (if in package)
└─ ❌ Advanced features

Renewal:
├─ Every 30 days
├─ Update end_date
└─ Keep status 'active'
```

### **Scenario 3: Upgrade to Pro**
```
Change:
├─ Package: "Basic" → "Professional"
├─ Status: Keep 'active'
├─ End: Extend by 30 days
└─ Menu Active: Keep true

New Features:
├─ ✅ All Basic features
├─ ✅ Analytics
├─ ✅ Custom Branding
├─ ✅ Priority Support
└─ ✅ Multiple Restaurants
```

### **Scenario 4: Suspend Restaurant**
```
Admin Action:
├─ Keep package assigned
├─ Set is_menu_active: false
└─ Or set status: 'cancelled'

Result:
├─ Menu immediately blocked
├─ Even if subscription valid
└─ Admin override
```

---

## 🛠️ **MANUAL ASSIGNMENT (SQL)**

### **Assign Free Trial:**
```sql
UPDATE restaurants
SET 
  subscription_package_name = 'Free Trial',
  subscription_status = 'active',
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '7 days',
  is_menu_active = true
WHERE id = 'restaurant-id';
```

### **Assign Basic (Monthly):**
```sql
UPDATE restaurants
SET 
  subscription_package_name = 'Basic',
  subscription_status = 'active',
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
  is_menu_active = true
WHERE id = 'restaurant-id';
```

### **Upgrade to Professional:**
```sql
UPDATE restaurants
SET 
  subscription_package_name = 'Professional',
  subscription_end_date = subscription_end_date + INTERVAL '30 days'
WHERE id = 'restaurant-id';
```

### **Suspend Restaurant:**
```sql
UPDATE restaurants
SET is_menu_active = false
WHERE id = 'restaurant-id';
```

### **Reactivate Restaurant:**
```sql
UPDATE restaurants
SET 
  is_menu_active = true,
  subscription_status = 'active',
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'restaurant-id';
```

---

## 🎨 **ADMIN UI NEEDED (To Be Created)**

### **Restaurants Management Page:**
```
/admin/restaurants

Table shows:
├─ Restaurant Name
├─ Current Package
├─ Status (Active/Expired)
├─ End Date
├─ Actions [Manage Subscription]
```

### **Subscription Dialog:**
```
Click "Manage Subscription" →

Form:
├─ Select Package [Dropdown]
├─ Status [Active/Pending/Expired/Cancelled]
├─ Start Date [Date Picker]
├─ End Date [Date Picker]
├─ Menu Active [Toggle]
└─ [Save] [Cancel]
```

---

## 📊 **CHECK CURRENT STATUS**

### **Query Restaurant Status:**
```sql
SELECT 
  r.name,
  r.subscription_package_name,
  r.subscription_status,
  r.subscription_start_date,
  r.subscription_end_date,
  r.is_menu_active,
  sp.feature_public_menu_access,
  sp.feature_whatsapp_orders,
  sp.feature_analytics
FROM restaurants r
LEFT JOIN subscription_packages sp 
  ON r.subscription_package_name = sp.name
WHERE r.slug = 'restaurant-slug';
```

### **Check All Restaurants:**
```sql
SELECT 
  name,
  subscription_package_name,
  subscription_status,
  subscription_end_date,
  CASE 
    WHEN subscription_end_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN subscription_end_date < CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING SOON'
    ELSE 'ACTIVE'
  END as status_check
FROM restaurants
ORDER BY subscription_end_date ASC NULLS LAST;
```

---

## ⚠️ **IMPORTANT NOTES**

### **1. Package Must Exist:**
```
Cannot assign package that doesn't exist in subscription_packages table.
Foreign key constraint will fail.
```

### **2. Package Name is Case-Sensitive:**
```
✅ 'Basic'
❌ 'basic' (won't match)
```

### **3. NULL Package = No Access:**
```
If subscription_package_name is NULL:
├─ Restaurant has no package
└─ Menu will be blocked
```

### **4. Grace Period:**
```
7 days after expiry:
├─ Menu still accessible
├─ Status shows 'expired'
└─ After 7 days: Blocked
```

### **5. Manual Override:**
```
is_menu_active = false
├─ Blocks menu immediately
├─ Even if subscription active
└─ Admin emergency control
```

---

## 🎯 **QUICK START GUIDE**

### **To Activate a Restaurant RIGHT NOW:**

1. **Create packages** (if not done):
```sql
-- Already done via /admin/packages UI
```

2. **Assign package to restaurant:**
```sql
UPDATE restaurants
SET 
  subscription_package_name = 'Basic',
  subscription_status = 'active',
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
  is_menu_active = true
WHERE slug = 'your-restaurant-slug';
```

3. **Test it:**
```
Visit: /menu/your-restaurant-slug/table1
Result: Should work if package has feature_public_menu_access = true
```

---

## 🚀 **NEXT STEP: CREATE ADMIN UI**

### **What We Need:**
```
1. Admin Restaurants List
   └─ Show current package & status

2. Subscription Management Dialog
   └─ Assign/change package
   └─ Set dates
   └─ Control access

3. Bulk Operations
   └─ Expire old subscriptions
   └─ Send renewal reminders
```

### **Would you like me to create this admin UI?**

I can create:
- ✅ Restaurant list with subscription info
- ✅ Subscription management form
- ✅ Quick actions (activate, suspend, renew)
- ✅ Status indicators
- ✅ Expiry warnings

---

## 📋 **SUMMARY**

**To Control a Restaurant:**

1. **Create packages** in `/admin/packages`
2. **Assign package** to restaurant:
   ```sql
   UPDATE restaurants SET subscription_package_name = 'Basic'
   ```
3. **Set status** to 'active'
4. **Set dates** (start & end)
5. **Package features** automatically apply
6. **Access controlled** by package settings

**Status Flow:**
```
pending → active → expired (grace) → blocked
         ↑                    ↓
         └──── renew ─────────┘
```

---

**Ready to create the admin UI for managing subscriptions?** 🚀
