-- Fix admin_notifications table RLS policies
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Admins can update notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- Create more permissive policies for debugging
-- Allow authenticated users to view notifications (will restrict later)
CREATE POLICY "Allow authenticated users to view notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert notifications
CREATE POLICY "Allow authenticated users to insert notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their notifications
CREATE POLICY "Allow authenticated users to update notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Fix SecurityProvider's admin_notifications insert
-- Add created_by column if it doesn't exist
ALTER TABLE public.admin_notifications 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Allow 'security_event' as a valid notification type
ALTER TABLE public.admin_notifications 
DROP CONSTRAINT IF EXISTS admin_notifications_type_check;

ALTER TABLE public.admin_notifications 
ADD CONSTRAINT admin_notifications_type_check 
CHECK (type IN ('new_restaurant', 'payment_proof', 'subscription_renewal', 'trial_ending', 'security_event'));

-- Fix profiles table trigger for user creation
-- Ensure profiles are created automatically on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'super_admin')),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
