# End-to-End Subscription Flow Test - User Journey

**Date:** January 23, 2025  
**Test Type:** Complete User Journey from Registration to Feature Access  
**Test Status:** 🔄 **IN PROGRESS**

---

## Test Scenario

**User Profile:**
- **Type:** New Restaurant Owner
- **Goal:** Subscribe to MenuForest QR Menu System
- **Payment Method:** Manual Payment (Bank Transfer/Mobile Money)

**Journey Steps:**
1. User signs up and creates restaurant account
2. User navigates to subscription page
3. User selects a subscription plan
4. User chooses manual payment method
5. User submits payment details and proof
6. Admin reviews and approves payment
7. User's subscription is activated
8. User gains access to all features

---

## Test Execution

### Step 1: User Registration ✓ (Already Completed)

**Current Test User:**
- Email: `appswifts@gmail.com`
- Restaurant: "HEINEKEN" (waka-village)
- Status: ✅ Active account

---

### Step 2: Navigate to Subscription Page ✅

**URL:** `http://localhost:8080/dashboard/subscription`

**Expected:**
- Page loads successfully
- Shows current subscription status
- Displays available plans

**Test Actions:**
1. Navigate to subscription page
2. Verify page loads
3. Check for errors in console

**Results:** ✅ PASS
