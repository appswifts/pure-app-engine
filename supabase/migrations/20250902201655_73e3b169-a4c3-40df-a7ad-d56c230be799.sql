-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a table to track notification history (optional but useful for analytics)
CREATE TABLE IF NOT EXISTS public.whatsapp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message_content TEXT,
  status TEXT DEFAULT 'sent',
  whatsapp_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications table
ALTER TABLE public.whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_notifications
CREATE POLICY "Restaurant owners can view their own notifications" 
ON public.whatsapp_notifications 
FOR SELECT 
USING (restaurant_id IN (
  SELECT id FROM restaurants WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all notifications" 
ON public.whatsapp_notifications 
FOR SELECT 
USING (has_system_role(auth.uid(), 'admin') OR has_system_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert notifications" 
ON public.whatsapp_notifications 
FOR INSERT 
WITH CHECK (true);

-- Schedule the subscription expiry check to run daily at 9 AM
SELECT cron.schedule(
  'check-subscription-expiry-daily',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://isduljdnrbspiqsgvkiv.supabase.co/functions/v1/check-subscription-expiry',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZHVsamRucmJzcGlxc2d2a2l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1OTkwNzQsImV4cCI6MjA2OTE3NTA3NH0.95m_dYb_tfeFNOcxyn1Sq8IQlnuTAJWvUNd2XaB85Lg"}'::jsonb,
        body:='{"scheduled_check": true}'::jsonb
    ) as request_id;
  $$
);

-- Create an index on subscription_end_date for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_end_date 
ON restaurants(subscription_end_date, subscription_status);