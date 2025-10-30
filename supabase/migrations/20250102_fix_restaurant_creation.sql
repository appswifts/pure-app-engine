-- Fix the handle_new_user function to match actual restaurants table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  generated_slug TEXT;
BEGIN
  -- Generate slug from restaurant name or email
  generated_slug := COALESCE(
    regexp_replace(
      lower(trim(COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(COALESCE(NEW.email, 'restaurant'), '@', 1)))),
      '[^a-z0-9]+', '-', 'g'
    ),
    'restaurant-' || substr(NEW.id::text, 1, 8)
  );
  
  -- Ensure slug is unique by appending number if needed
  WHILE EXISTS (SELECT 1 FROM public.restaurants WHERE slug = generated_slug) LOOP
    generated_slug := generated_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Insert restaurant record with only existing columns
  INSERT INTO public.restaurants (
    id,
    user_id,
    name,
    email,
    phone,
    whatsapp_number,
    slug,
    brand_color,
    font_family,
    background_style,
    background_color,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(), -- Generate new UUID for restaurant
    NEW.id, -- Link to user via user_id
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Restaurant ' || COALESCE(NEW.email, 'User')),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'whatsapp', NEW.raw_user_meta_data ->> 'phone', ''),
    generated_slug,
    '#F97316', -- Default brand color (orange)
    'Inter', -- Default font
    'gradient', -- Default background style
    '#ffffff', -- Default background color
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO UPDATE SET
    -- Update if user_id already exists (shouldn't happen but just in case)
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    whatsapp_number = EXCLUDED.whatsapp_number,
    updated_at = NOW();
  
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
