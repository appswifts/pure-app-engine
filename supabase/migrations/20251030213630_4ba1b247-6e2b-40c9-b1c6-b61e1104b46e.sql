-- Fix function search_path security issues
-- Add SET search_path to functions that are missing it

-- Fix assign_system_role function
CREATE OR REPLACE FUNCTION public.assign_system_role(p_user_id uuid, p_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role_id uuid;
BEGIN
    -- Validate role
    IF p_role NOT IN ('admin', 'super_admin', 'restaurant_manager') THEN
        RAISE EXCEPTION 'Invalid system role: %. Must be one of: admin, super_admin, restaurant_manager', p_role;
    END IF;
    
    -- Insert role if not exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_user_id, p_role)
    ON CONFLICT (user_id, role) DO NOTHING
    RETURNING id INTO v_role_id;
    
    -- If no ID returned, get existing one
    IF v_role_id IS NULL THEN
        SELECT id INTO v_role_id FROM public.user_roles 
        WHERE user_id = p_user_id AND role = p_role;
    END IF;
    
    RETURN v_role_id;
END;
$$;

-- Fix get_restaurant_menu_data function
CREATE OR REPLACE FUNCTION public.get_restaurant_menu_data(restaurant_slug text)
RETURNS TABLE(
    restaurant_id uuid,
    restaurant_name text,
    restaurant_email text,
    restaurant_phone text,
    restaurant_whatsapp text,
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
    category_id uuid,
    category_name text,
    category_order integer,
    item_id uuid,
    item_name text,
    item_description text,
    item_price numeric,
    item_image_url text,
    item_available boolean,
    item_order integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.email as restaurant_email,
    r.phone as restaurant_phone,
    r.whatsapp_number as restaurant_whatsapp,
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
    c.id as category_id,
    c.name as category_name,
    c.display_order as category_order,
    mi.id as item_id,
    mi.name as item_name,
    mi.description as item_description,
    mi.base_price as item_price,
    mi.image_url as item_image_url,
    mi.is_available as item_available,
    mi.display_order as item_order
  FROM restaurants r
  LEFT JOIN categories c ON r.id = c.restaurant_id
  LEFT JOIN menu_items mi ON c.id = mi.category_id AND mi.is_available = true
  WHERE r.slug = restaurant_slug
  ORDER BY c.display_order ASC, mi.display_order ASC;
$$;

-- Fix user_owns_restaurant function
CREATE OR REPLACE FUNCTION public.user_owns_restaurant(restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM restaurants 
    WHERE id = restaurant_id AND user_id = auth.uid()
  );
$$;

-- Fix check_restaurant_subscription_access function
CREATE OR REPLACE FUNCTION public.check_restaurant_subscription_access(restaurant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    restaurant_record RECORD;
BEGIN
    SELECT subscription_status, trial_end_date, subscription_end_date, grace_period_end_date
    INTO restaurant_record
    FROM restaurants
    WHERE id = restaurant_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    CASE restaurant_record.subscription_status
        WHEN 'active' THEN
            RETURN restaurant_record.subscription_end_date IS NULL OR restaurant_record.subscription_end_date > NOW();
        WHEN 'trial' THEN
            RETURN restaurant_record.trial_end_date IS NULL OR restaurant_record.trial_end_date > NOW();
        WHEN 'expired' THEN
            RETURN restaurant_record.grace_period_end_date IS NOT NULL AND restaurant_record.grace_period_end_date > NOW();
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;