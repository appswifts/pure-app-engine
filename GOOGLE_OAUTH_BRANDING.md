# Fix Google OAuth Branding - Show App Name Instead of Supabase URL

## Problem

When users click "Sign in with Google", they see:
```
You're signing back in to
isduljdnrbspiqsgvkiv.supabase.co
```

Instead of your app name like:
```
You're signing back in to
Pure App Engine (or MenuForest)
```

## Solution: Configure OAuth Consent Screen

### Step 1: Go to Google Cloud Console

1. **Visit:** https://console.cloud.google.com/
2. **Select your project** (or create one if you haven't)

### Step 2: Configure OAuth Consent Screen

1. **Go to:** APIs & Services → OAuth consent screen
   ```
   https://console.cloud.google.com/apis/credentials/consent
   ```

2. **User Type:** Select **External** (for public app)
   - Click **Create**

3. **App Information:**
   ```
   App name: Pure App Engine
   (or "MenuForest" or your preferred name)
   
   User support email: your@email.com
   
   App logo: [Upload your logo - optional]
   
   Application home page: https://pure-app-engine.vercel.app
   (or your domain)
   ```

4. **App Domain (Optional but recommended):**
   ```
   Application home page: https://pure-app-engine.vercel.app
   Application privacy policy: https://pure-app-engine.vercel.app/terms
   Application terms of service: https://pure-app-engine.vercel.app/terms
   ```

5. **Authorized domains:**
   ```
   pure-app-engine.vercel.app
   supabase.co
   yourdomain.com (if you have one)
   ```

6. **Developer contact information:**
   ```
   Email addresses: your@email.com
   ```

7. **Click Save and Continue**

### Step 3: Configure Scopes

1. **Click "Add or Remove Scopes"**

2. **Select these scopes:**
   ```
   ✅ .../auth/userinfo.email
   ✅ .../auth/userinfo.profile
   ✅ openid
   ```

3. **Click "Update"**

4. **Click "Save and Continue"**

### Step 4: Add Test Users (During Development)

If your app is in "Testing" mode:

1. **Add test users:**
   ```
   your@email.com
   team@email.com
   ```

2. **Click "Save and Continue"**

### Step 5: Create OAuth Client ID

1. **Go to:** APIs & Services → Credentials
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Create Credentials → OAuth client ID**

3. **Application type:** Web application

4. **Name:** Pure App Engine (or your app name)

5. **Authorized JavaScript origins:**
   ```
   https://pure-app-engine.vercel.app
   https://pure-app-engine-4vgz5w0dt-iradukunda-yves-projects.vercel.app
   https://yourdomain.com (if you have one)
   ```

6. **Authorized redirect URIs:**
   ```
   https://isduljdnrbspiqsgvkiv.supabase.co/auth/v1/callback
   ```

7. **Click "Create"**

8. **Copy Client ID and Client Secret**

### Step 6: Add Credentials to Supabase

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/auth/providers
   ```

2. **Find Google provider**

3. **Enter credentials:**
   - Client ID: [Paste from Google Cloud Console]
   - Client Secret: [Paste from Google Cloud Console]

4. **Click Save**

### Step 7: Publish OAuth Consent Screen (Optional)

For production use:

1. **Go to OAuth consent screen**

2. **Click "Publish App"**

3. **Verification may be required** if requesting sensitive scopes

For testing, you can keep it in "Testing" mode with specific test users.

## Result

After configuration, users will see:

### Before (Current):
```
You're signing back in to
isduljdnrbspiqsgvkiv.supabase.co
```

### After (Fixed):
```
You're signing back in to
Pure App Engine
```

## Quick Configuration Summary

| Setting | Value |
|---------|-------|
| **App name** | Pure App Engine (or MenuForest) |
| **User support email** | your@email.com |
| **Authorized domains** | supabase.co, vercel.app, yourdomain.com |
| **Redirect URI** | `https://isduljdnrbspiqsgvkiv.supabase.co/auth/v1/callback` |
| **Scopes** | email, profile, openid |

## Testing Mode vs Production

### Testing Mode (Default)
- Only test users can sign in
- Shows "unverified app" warning
- Good for development
- No verification required

### Production Mode
- Anyone can sign in
- Shows verified badge
- Requires Google verification
- May take 3-5 days for approval

**Recommendation:** Keep in Testing mode until you're ready to launch publicly.

## Common Issues

### Issue 1: "Access blocked: This app's request is invalid"
**Cause:** Redirect URI not configured correctly
**Fix:** Add `https://isduljdnrbspiqsgvkiv.supabase.co/auth/v1/callback` to authorized redirect URIs

### Issue 2: Still shows Supabase URL
**Cause:** OAuth consent screen not configured
**Fix:** Set "App name" in OAuth consent screen settings

### Issue 3: "This app isn't verified"
**Cause:** App in testing mode or not verified by Google
**Fix:** Either add test users or go through verification process

## Additional Branding (Optional)

### Add App Logo
- Size: 120x120 pixels
- Format: PNG or JPG
- Shows next to app name in consent screen

### Brand Colors
Configure in OAuth consent screen for consistent look

## Support Links

- Google Cloud Console: https://console.cloud.google.com/
- OAuth Setup Guide: https://developers.google.com/identity/protocols/oauth2
- Supabase Auth Guide: https://supabase.com/docs/guides/auth/social-login/auth-google

---

**Quick Steps:**
1. Google Cloud Console → OAuth consent screen
2. Set App name: "Pure App Engine"
3. Add authorized domains
4. Create OAuth credentials
5. Add to Supabase
6. Done! ✅
