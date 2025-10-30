-- Create storage bucket for menu items if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-items',
  'menu-items', 
  true, -- Public bucket for menu item images
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- Create storage bucket for restaurant logos if it doesn't exist  
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-logos',
  'restaurant-logos',
  true, -- Public bucket for restaurant logos
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- RLS policies for menu-items bucket
CREATE POLICY "Public can view menu item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'menu-items');

CREATE POLICY "Authenticated users can upload menu item images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'menu-items' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own menu item images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'menu-items'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own menu item images" ON storage.objects  
  FOR DELETE USING (
    bucket_id = 'menu-items'
    AND auth.uid() IS NOT NULL
  );

-- RLS policies for restaurant-logos bucket
CREATE POLICY "Public can view restaurant logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can upload restaurant logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'restaurant-logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own restaurant logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'restaurant-logos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete their own restaurant logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'restaurant-logos'
    AND auth.uid() IS NOT NULL
  );
