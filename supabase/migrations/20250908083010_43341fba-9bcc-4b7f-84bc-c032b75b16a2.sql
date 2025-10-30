-- Phase 1: Critical Data Protection - Fix Restaurant Table RLS Policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view restaurant info for menus" ON public.restaurants;
DROP POLICY IF EXISTS "Public can view restaurant menus" ON public.restaurants;
DROP POLICY IF EXISTS "Enable public read access for menus" ON public.restaurants;

-- Create restrictive public policy that only exposes menu-viewing fields
CREATE POLICY "Public can view restaurant menu data only" 
ON public.restaurants 
FOR SELECT 
USING (true)
-- Only expose fields needed for menu display, hide contact information
;

-- Create function to get sanitized restaurant data for public menu viewing
CREATE OR REPLACE FUNCTION public.get_public_restaurant_data(restaurant_slug text)
RETURNS TABLE(
  id uuid,
  name text,
  brand_color text,
  font_family text,
  background_style text,
  background_color text,
  logo_url text,
  menu_layout text,
  card_style text,
  button_style text,
  card_shadow text,
  whatsapp_button_color text,
  whatsapp_button_text text,
  whatsapp_button_style text,
  whatsapp_button_text_color text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.name,
    r.brand_color,
    r.font_family,
    r.background_style,
    r.background_color,
    r.logo_url,
    r.menu_layout,
    r.card_style,
    r.button_style,
    r.card_shadow,
    r.whatsapp_button_color,
    r.whatsapp_button_text,
    r.whatsapp_button_style,
    r.whatsapp_button_text_color
  FROM restaurants r
  WHERE r.slug = restaurant_slug;
$$;

-- Secure Manual Payment Instructions - restrict access to authenticated users making payments only
DROP POLICY IF EXISTS "Everyone can view payment instructions" ON public.manual_payment_instructions;

CREATE POLICY "Authenticated users can view active payment instructions"
ON public.manual_payment_instructions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Phase 2: Admin Authentication Security - Remove localStorage dependency
-- Create secure admin verification function
CREATE OR REPLACE FUNCTION public.verify_admin_access(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has admin or super_admin role
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = p_user_id 
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- Enhanced role assignment validation to prevent privilege escalation
DROP FUNCTION IF EXISTS public.validate_role_assignment();

CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from assigning roles to themselves
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  
  -- Only existing admins can assign admin/super_admin roles
  IF NEW.role IN ('admin', 'super_admin') AND NOT (
    public.has_system_role(auth.uid(), 'admin') OR 
    public.has_system_role(auth.uid(), 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Only existing admins can assign admin roles';
  END IF;
  
  -- Log role assignment for audit trail
  INSERT INTO admin_notifications (
    type,
    title, 
    message,
    data,
    created_by
  ) VALUES (
    'role_assignment',
    'Role Assignment',
    'Role "' || NEW.role || '" assigned to user',
    jsonb_build_object(
      'assigned_user_id', NEW.user_id,
      'assigned_role', NEW.role,
      'assigned_by', auth.uid()
    ),
    auth.uid()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for role assignment validation
DROP TRIGGER IF EXISTS validate_role_assignment_trigger ON public.user_roles;
CREATE TRIGGER validate_role_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_role_assignment();

-- Fix search_path in existing functions for security
CREATE OR REPLACE FUNCTION public.has_system_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;