-- Enable required extensions for cron jobs (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing cron job if it exists
SELECT cron.unschedule('check-subscription-expiry-daily');

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

-- Create an index on subscription_end_date for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_end_date 
ON restaurants(subscription_end_date, subscription_status);