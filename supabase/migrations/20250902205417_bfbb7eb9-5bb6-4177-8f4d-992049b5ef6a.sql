-- Create admin_notifications table for admin notification system
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('new_restaurant', 'payment_proof', 'subscription_renewal', 'trial_ending')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin notifications
CREATE POLICY "Admins can view all notifications" 
ON public.admin_notifications 
FOR SELECT 
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update notifications" 
ON public.admin_notifications 
FOR UPDATE 
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert notifications" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_restaurant_id ON public.admin_notifications(restaurant_id);