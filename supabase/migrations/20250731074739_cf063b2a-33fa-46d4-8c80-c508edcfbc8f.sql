-- Fix storage policies for menu-item-images bucket
-- Create policy for authenticated users to upload to menu-item-images
CREATE POLICY "Authenticated users can upload menu item images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'menu-item-images' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for public read access to menu item images
CREATE POLICY "Public can view menu item images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'menu-item-images');

-- Create policy for restaurant owners to update their menu item images
CREATE POLICY "Restaurant owners can update their menu item images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'menu-item-images' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for restaurant owners to delete their menu item images
CREATE POLICY "Restaurant owners can delete their menu item images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'menu-item-images' 
  AND auth.uid() IS NOT NULL
);