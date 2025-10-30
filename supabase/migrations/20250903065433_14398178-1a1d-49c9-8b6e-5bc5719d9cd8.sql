-- Add admin policy to allow admins to update restaurants
CREATE POLICY "Admins can update any restaurant" 
ON public.restaurants 
FOR UPDATE 
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'))
WITH CHECK (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));