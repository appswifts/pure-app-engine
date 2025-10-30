-- Enhance Menu Access Security - Add stricter RLS policies to prevent unauthorized menu access

-- Drop existing permissive policies and replace with more restrictive ones
DROP POLICY IF EXISTS "Public can view restaurant menu data only" ON public.restaurants;
DROP POLICY IF EXISTS "Enable public read access for menus" ON public.restaurants;

-- Create separate policies for different access patterns
-- 1. Restaurant owners can access their own restaurant data
CREATE POLICY "Restaurant owners can access own data"
ON public.restaurants
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 2. Public can only access minimal menu display data via the secure function
CREATE POLICY "Public menu access via secure function only"
ON public.restaurants
FOR SELECT
TO anon, authenticated
USING (false); -- Force all public access through the secure function

-- 3. Admins can access all restaurant data
CREATE POLICY "Admins can access all restaurants"
ON public.restaurants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Enhance Categories table security
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage their categories" ON public.categories;

-- Categories: Only restaurant owners can access their categories
CREATE POLICY "Restaurant owners manage own categories"
ON public.categories
FOR ALL
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  )
);

-- Categories: Public can only view through secure menu access
CREATE POLICY "Public category access for menus only"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (
  restaurant_id IN (
    SELECT r.id FROM public.restaurants r
    WHERE r.id = restaurant_id
  )
);

-- Enhance Menu Items table security
DROP POLICY IF EXISTS "Public can view menu items" ON public.categories;
DROP POLICY IF EXISTS "Restaurant owners can manage their menu items" ON public.menu_items;

-- Menu Items: Only restaurant owners can manage their items
CREATE POLICY "Restaurant owners manage own menu items"
ON public.menu_items
FOR ALL
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  ) OR
  category_id IN (
    SELECT c.id FROM public.categories c
    JOIN public.restaurants r ON c.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  ) OR
  category_id IN (
    SELECT c.id FROM public.categories c
    JOIN public.restaurants r ON c.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

-- Menu Items: Public can only view available items for menu display
CREATE POLICY "Public menu item access for available items only"
ON public.menu_items
FOR SELECT
TO anon, authenticated
USING (is_available = true);

-- Add more restrictive policies for variations and accompaniments
DROP POLICY IF EXISTS "Public can view variations" ON public.item_variations;
DROP POLICY IF EXISTS "Restaurant owners can manage variations" ON public.item_variations;

CREATE POLICY "Restaurant owners manage own variations"
ON public.item_variations
FOR ALL
TO authenticated
USING (
  menu_item_id IN (
    SELECT mi.id FROM public.menu_items mi
    JOIN public.restaurants r ON mi.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
)
WITH CHECK (
  menu_item_id IN (
    SELECT mi.id FROM public.menu_items mi
    JOIN public.restaurants r ON mi.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view variations for available items"
ON public.item_variations
FOR SELECT
TO anon, authenticated
USING (
  menu_item_id IN (
    SELECT id FROM public.menu_items 
    WHERE is_available = true
  )
);

-- Same for accompaniments
DROP POLICY IF EXISTS "Public can view accompaniments" ON public.accompaniments;
DROP POLICY IF EXISTS "Restaurant owners can manage accompaniments" ON public.accompaniments;

CREATE POLICY "Restaurant owners manage own accompaniments"
ON public.accompaniments
FOR ALL
TO authenticated
USING (
  menu_item_id IN (
    SELECT mi.id FROM public.menu_items mi
    JOIN public.restaurants r ON mi.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
)
WITH CHECK (
  menu_item_id IN (
    SELECT mi.id FROM public.menu_items mi
    JOIN public.restaurants r ON mi.restaurant_id = r.id
    WHERE r.user_id = auth.uid()
  )
);

CREATE POLICY "Public can view accompaniments for available items"
ON public.accompaniments
FOR SELECT
TO anon, authenticated
USING (
  menu_item_id IN (
    SELECT id FROM public.menu_items 
    WHERE is_available = true
  )
);

-- Add table access security
DROP POLICY IF EXISTS "Public can view tables for menu access" ON public.tables;
DROP POLICY IF EXISTS "Restaurant owners can manage their tables" ON public.tables;

CREATE POLICY "Restaurant owners manage own tables"
ON public.tables
FOR ALL
TO authenticated
USING (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  restaurant_id IN (
    SELECT id FROM public.restaurants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Public can view tables for menu access"
ON public.tables
FOR SELECT
TO anon, authenticated
USING (true); -- Allow public to view tables for QR menu access

-- Create a function to validate restaurant ownership for additional security
CREATE OR REPLACE FUNCTION public.user_owns_restaurant_strict(restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = restaurant_id 
    AND user_id = auth.uid()
  );
$$;

-- Add audit logging for menu access attempts
CREATE OR REPLACE FUNCTION public.log_menu_access_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access attempt for security monitoring
  INSERT INTO public.admin_notifications (
    type,
    title,
    message,
    data,
    created_by
  ) VALUES (
    'menu_access',
    'Menu Access Attempt',
    'User attempted to access menu data',
    jsonb_build_object(
      'user_id', auth.uid(),
      'restaurant_id', COALESCE(NEW.restaurant_id, OLD.restaurant_id),
      'action', TG_OP,
      'table', TG_TABLE_NAME,
      'timestamp', now()
    ),
    auth.uid()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add triggers for audit logging on sensitive tables
CREATE TRIGGER log_restaurant_access
  AFTER SELECT ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.log_menu_access_attempt();

CREATE TRIGGER log_menu_item_access
  AFTER SELECT ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.log_menu_access_attempt();