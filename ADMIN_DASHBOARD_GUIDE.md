# 🎯 Admin Dashboard - Complete Guide

## Overview

A comprehensive admin dashboard for managing your entire subscription platform including:
- **Subscription Plans** - Create, edit, and manage pricing tiers
- **Subscriptions** - Approve/reject subscription requests
- **Users** - Manage user accounts and roles
- **Restaurants** - Monitor all registered restaurants
- **Payments** - Verify manual payment submissions
- **Analytics** - Track revenue, growth, and platform metrics

---

## 🚀 Quick Start

### Step 1: Import the Dashboard

```tsx
import { ComprehensiveAdminDashboard } from '@/components/admin/ComprehensiveAdminDashboard';

// Add to your admin route
<Route path="/admin" element={<ComprehensiveAdminDashboard />} />
```

### Step 2: Set Up Database (Already done via subscription migration)

The admin dashboard uses the existing database tables from the subscription system.

### Step 3: Protect the Route

```tsx
// Example: Admin route protection
import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

// Usage
<Route 
  path="/admin" 
  element={
    <AdminRoute>
      <ComprehensiveAdminDashboard />
    </AdminRoute>
  } 
/>
```

---

## 📊 Dashboard Features

### **1. Overview Tab**

**What It Shows:**
- Total users, restaurants, subscriptions
- Active vs inactive counts
- Monthly revenue
- Pending approvals and payments
- Growth rate

**Action Items:**
- Quick alerts for pending approvals
- Revenue trends
- System health indicators

---

### **2. Plans Tab** (Subscription Plans Management)

**Features:**
✅ Create new subscription plans
✅ Edit existing plans
✅ Set pricing and billing intervals
✅ Define feature lists
✅ Set usage limits (menu items, tables)
✅ Toggle plan active/inactive status
✅ Delete plans

**Plan Configuration:**
- **Name** - Plan identifier (e.g., "Premium")
- **Price** - Monthly or yearly cost
- **Currency** - RWF, USD, EUR, etc.
- **Billing Interval** - Monthly or Yearly
- **Trial Days** - Free trial period
- **Max Menu Items** - Set limit or -1 for unlimited
- **Max Tables** - Set limit or -1 for unlimited
- **Features** - List of included features
- **Display Order** - Sort order in public view

**Actions Available:**
```
Edit → Modify plan details
Toggle → Activate/deactivate plan
Delete → Remove plan (if no active subscriptions)
```

---

### **3. Subscriptions Tab** (Subscription Management)

**Features:**
✅ View all subscription requests
✅ Filter by status (trial, pending, active, cancelled)
✅ Approve pending subscriptions
✅ Reject invalid requests
✅ Add admin notes
✅ Track trial periods

**Workflow:**
1. User submits subscription request
2. Shows as "Pending" in dashboard
3. Admin reviews request
4. Admin approves → Subscription activated
5. Admin rejects → Subscription cancelled

**Statistics Shown:**
- Trial subscriptions count
- Pending payment count
- Total subscriptions

---

### **4. Users Tab** (User Management)

**Features:**
✅ View all registered users
✅ Search by email
✅ Change user roles (user, manager, admin)
✅ Ban/unban users
✅ View user status (verified, unverified, banned)
✅ Track sign-in activity

**User Roles:**
- **User** - Standard restaurant owner
- **Manager** - Can manage restaurants
- **Admin** - Full platform access

**Actions Available:**
```
Change Role → Update user permissions
View → See user details
Ban → Suspend user account
Unban → Restore access
```

**Stats:**
- Total users
- Verified email count
- Admin count
- Banned users

---

### **5. Restaurants Tab** (Restaurant Management)

**Features:**
✅ View all restaurants
✅ Search by name, email, or slug
✅ Monitor subscription status
✅ Toggle active/inactive status
✅ Delete restaurants
✅ Quick link to public menu

**Restaurant Info Displayed:**
- Restaurant name
- Contact (email, phone)
- Menu slug
- Subscription status and expiry
- Creation date

**Actions Available:**
```
View → Open public menu in new tab
Toggle Active → Enable/disable restaurant
Delete → Remove restaurant (careful!)
```

**Stats:**
- Total restaurants
- Active (paid) count
- Trial count
- Inactive/expired count

---

### **6. Payments Tab** (Payment Verification)

**Features:**
✅ Review manual payment submissions
✅ View payment details and proof
✅ Verify and activate subscriptions
✅ Reject invalid payments
✅ Add admin notes
✅ Track payment history

**Payment Verification Workflow:**
1. User submits manual payment
2. Payment appears in "Pending" queue
3. Admin reviews payment proof
4. Admin verifies → Subscription activated
5. Admin rejects → User notified

**Payment Details Shown:**
- Amount and currency
- Payment method (bank transfer, mobile money)
- Reference number
- Payment proof (file/screenshot)
- Restaurant and plan details
- Submission date

**Actions Available:**
```
Verify & Activate → Approve payment, activate subscription
Reject → Deny payment with reason
View Proof → Open payment screenshot
Add Notes → Document verification decision
```

---

### **7. Analytics Tab** (Reports & Insights)

**Metrics Tracked:**

**Revenue:**
- Current month revenue
- Last month comparison
- Growth percentage
- Revenue by plan

**Subscriptions:**
- New subscriptions this month
- Cancellations
- Active total
- Trial total

**Users:**
- Total users
- New users this month
- Active user percentage

**Restaurants:**
- Total count
- Active/inactive breakdown
- Status distribution

**Top Plans:**
- Most subscribed plans
- Revenue per plan
- Subscriber count

**Visual Elements:**
- Growth indicators (up/down arrows)
- Color-coded metrics
- Distribution charts
- Trend comparisons

---

## 🎨 Component Structure

```
src/components/admin/
├── ComprehensiveAdminDashboard.tsx      # Main dashboard with tabs
├── AdminSubscriptionPlans.tsx           # Plan CRUD operations
├── AdminSubscriptionManagement.tsx      # Approve/reject subscriptions
├── AdminUserManagement.tsx              # User admin panel
├── AdminRestaurantManagement.tsx        # Restaurant oversight
├── AdminPaymentVerification.tsx         # Payment approval
└── AdminAnalytics.tsx                   # Reports and metrics
```

---

## 🔐 Security Considerations

### Role-Based Access Control

**Protect admin routes:**
```tsx
// Check user role before rendering
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin') {
  // Redirect or show error
}
```

### Database RLS Policies

Ensure Row Level Security policies allow admin access:

```sql
-- Example: Admin can see all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON subscriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## 📊 Database Schema Required

The admin dashboard works with these tables (already created):

### Core Tables:
- ✅ `subscription_plans` - Plan configurations
- ✅ `subscriptions` - Active subscriptions
- ✅ `payment_records` - Payment history
- ✅ `restaurants` - Restaurant data
- ✅ `profiles` - User profiles
- ✅ `notifications` - Alert system

---

## 🎯 Common Admin Tasks

### **Create a New Plan**
1. Go to "Plans" tab
2. Click "Create Plan"
3. Fill in details:
   - Name, price, features
   - Set limits
   - Choose trial period
4. Click "Create Plan"

### **Approve a Subscription**
1. Go to "Subscriptions" tab
2. Find pending subscription
3. Review details
4. Click "Activate Subscription"

### **Verify a Payment**
1. Go to "Payments" tab
2. Review payment proof
3. Add admin notes
4. Click "Verify & Activate"

### **Ban a User**
1. Go to "Users" tab
2. Find user
3. Click "Ban"
4. Confirm action

### **View Analytics**
1. Go to "Analytics" tab
2. Select period (week/month/year)
3. Review metrics
4. Export data (if implemented)

---

## 🚨 Important Notes

### Payment Verification
- Always verify payment proof before activation
- Add detailed admin notes
- Check reference numbers match
- Confirm amounts are correct

### User Management
- Be careful with role changes
- Test admin access after promoting users
- Keep audit log of admin actions

### Restaurant Deletion
- Deleting is permanent!
- Consider deactivating instead
- Ensure no active subscriptions
- Backup data first

### Plan Management
- Don't delete plans with active subscribers
- Deactivate instead to hide from users
- Update prices carefully (affects renewals)

---

## 📈 Performance Tips

### Optimize Queries
```tsx
// Use select to get only needed columns
.select('id, name, email')

// Add indexes on frequently searched fields
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

### Pagination
For large datasets, implement pagination:
```tsx
const { data, count } = await supabase
  .from('restaurants')
  .select('*', { count: 'exact' })
  .range(0, 49); // First 50 results
```

---

## 🎨 Customization

### Change Colors
All components use Tailwind classes:
```tsx
// Example: Change primary color
className="bg-blue-600" → className="bg-purple-600"
```

### Add Custom Tabs
```tsx
<TabsTrigger value="custom">
  <CustomIcon className="h-4 w-4 mr-2" />
  Custom Tab
</TabsTrigger>

<TabsContent value="custom">
  <YourCustomComponent />
</TabsContent>
```

### Modify Stats
Update the `loadDashboardStats` function in `ComprehensiveAdminDashboard.tsx`

---

## 🆘 Troubleshooting

**No data showing?**
- Check RLS policies
- Verify admin role in database
- Check browser console for errors

**Can't approve subscriptions?**
- Ensure proper database permissions
- Check subscription table constraints
- Verify restaurant exists

**Analytics not loading?**
- Check date calculations
- Verify subscription data exists
- Review query filters

---

## 🔄 Integration Checklist

- [ ] Import ComprehensiveAdminDashboard
- [ ] Add admin route to router
- [ ] Implement role-based protection
- [ ] Test all tab functionalities
- [ ] Verify RLS policies
- [ ] Test payment verification flow
- [ ] Test plan creation/editing
- [ ] Review analytics accuracy
- [ ] Set up admin user accounts

---

## 📚 Related Documentation

- [Subscription System Guide](./SUBSCRIPTION_SYSTEM_GUIDE.md)
- [Database Migration](./database_migrations/subscription_system_tables.sql)
- [Quick Start](./SUBSCRIPTION_QUICK_START.md)

---

**Built for comprehensive platform management** 🚀
