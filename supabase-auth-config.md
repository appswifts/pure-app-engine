# Supabase Google OAuth Setup

## Google Cloud Console Setup

1. **Project**: Create or select a project at https://console.cloud.google.com/

2. **Enable Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth Client ID**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   
4. **Authorized redirect URIs**:
   ```
   https://isduljdnrbspiqsgvkiv.supabase.co/auth/v1/callback
   ```

5. **Save your credentials**:
   - Client ID: [PASTE YOUR CLIENT ID HERE]
   - Client Secret: [PASTE YOUR CLIENT SECRET HERE]

## Supabase Dashboard Configuration

1. Go to: https://supabase.com/dashboard/project/isduljdnrbspiqsgvkiv/auth/providers

2. Find "Google" provider and click to expand

3. Toggle "Enable Sign in with Google" to ON

4. Enter:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)

5. Click "Save"

## Frontend Implementation

The auth is already configured in your app. To use Google sign-in, use:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/dashboard`
  }
});
```

## Testing

1. Add a Google sign-in button to your login page
2. Test the OAuth flow
3. Check that user data is properly stored in Supabase

## Redirect URLs

For production (Vercel), add this redirect URI to Google Cloud Console:
```
https://pure-app-engine-azplnd0wl-iradukunda-yves-projects.vercel.app
```

And configure in Supabase:
- Site URL: `https://pure-app-engine-azplnd0wl-iradukunda-yves-projects.vercel.app`
- Redirect URLs: Add your production domain
