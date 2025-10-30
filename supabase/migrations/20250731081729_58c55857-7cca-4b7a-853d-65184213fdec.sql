-- Fix infinite recursion in user_roles RLS policy by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles 
  WHERE user_id = _user_id 
  LIMIT 1;
$$;

-- Drop the problematic RLS policy on user_roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;

-- Create new policy using the security definer function
CREATE POLICY "Admins can manage user roles" ON public.user_roles
FOR ALL
USING (
  public.has_system_role(auth.uid(), 'admin') OR 
  public.has_system_role(auth.uid(), 'super_admin')
);

-- Fix storage policies for restaurant logos
CREATE POLICY "Users can upload their own restaurant logos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'restaurant-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own restaurant logos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'restaurant-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own restaurant logos" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'restaurant-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Restaurant logos are publicly viewable" ON storage.objects
FOR SELECT 
USING (bucket_id = 'restaurant-logos');